import bcrypt from "bcrypt";
import dotenv from "dotenv";
import express from "express";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { userMiddleware } from "./middleware.js";
import { User, Content, Tags, Link, connectDB } from "./db.js";
import { generateRandomString } from "./util.js";
const app = express();
await connectDB();
dotenv.config();
app.use(express.json());
app.post("/api/v1/signup", async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res
            .status(400)
            .json({ error: "Username and password are required" });
    }
    try {
        const salt = bcrypt.genSaltSync(8);
        const hashedPassword = bcrypt.hashSync(password, salt);
        const newUser = await new User({ username, password: hashedPassword });
        await newUser.save();
        return res.status(201).json({ message: "User created successfully" });
    }
    catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({ error: "Username already exists" });
        }
        return res.status(500).json({ error: "Internal server error" });
    }
});
app.post("/api/v1/signin", async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res
            .status(400)
            .json({ error: "Username and password are required" });
    }
    const user = await User.findOne({ username });
    if (!user) {
        return res.status(404).json({ error: "User not found" });
    }
    const isPasswordValid = bcrypt.compareSync(password, user.password);
    if (!isPasswordValid) {
        return res.status(401).json({ error: "Invalid password" });
    }
    const token = await jwt.sign({ userId: user._id }, process.env.JWT_SECRET || "adfihjklqwertyuiopzxcvbnm1234567890", {
        expiresIn: "1h",
    });
    return res.status(200).json({ token, userId: user._id });
});
app.post("/api/v1/content", userMiddleware, async (req, res) => {
    const { title, link, type, tags } = req.body;
    const userId = req.user.userId;
    if (!title || !userId) {
        return res.status(400).json({ error: "Title and userId are required" });
    }
    try {
        const tagIds = await Promise.all(tags.map(async (tagName) => {
            let cleanedTagName = tagName.trim().toLowerCase();
            if (!cleanedTagName) {
                return null;
            }
            let tag = await Tags.findOne({ name: cleanedTagName });
            if (!tag) {
                tag = new Tags({ name: cleanedTagName });
                await tag.save();
            }
            return tag._id;
        }));
        const filteredTagIds = tagIds.filter((id) => {
            return id !== null;
        });
        const newContent = new Content({
            title,
            link,
            type,
            tags: filteredTagIds,
            userId,
        });
        await newContent.save();
        return res.status(201).json({ message: "Content created successfully" });
    }
    catch (err) {
        return res.status(500).json({ error: "Internal server error" });
    }
});
app.get("/api/v1/content", userMiddleware, async (req, res) => {
    const userId = req.user.userId;
    if (!userId) {
        return res.status(400).json({ error: "User ID is required" });
    }
    try {
        const contents = await Content.find({ userId }).populate("tags", "name");
        if (!contents || contents.length === 0) {
            return res.status(404).json({ error: "No content found for this user" });
        }
        return res.status(200).json(contents);
    }
    catch (err) {
        return res.status(500).json({ error: "Internal server error" });
    }
});
app.delete("/api/v1/content/:id", userMiddleware, async (req, res) => {
    const contentId = req.params.id;
    const userId = req.user.userId;
    if (!contentId || !userId) {
        return res
            .status(400)
            .json({ error: "Content ID and user ID are required" });
    }
    try {
        const content = await Content.findById(contentId);
        if (!content) {
            return res.status(404).json({ error: "Content not found" });
        }
        if (content.userId.toString() !== userId) {
            return res
                .status(403)
                .json({ error: "You do not have permission to delete this content" });
        }
        await Content.findByIdAndDelete(contentId);
        return res.status(200).json({ message: "Content deleted successfully" });
    }
    catch (err) {
        return res.status(500).json({ error: "Internal server error" });
    }
});
app.post("/api/v1/share/user", userMiddleware, async (req, res) => {
    const userId = req.user.userId;
    try {
        const existingLink = await Link.findOne({ userId: userId });
        if (existingLink) {
            const shareUrl = `${req.protocol}://${req.get("host")}/api/v1/brain/${existingLink.shareLink}`;
            return res.status(200).json({ shareUrl: shareUrl });
        }
        const shareId = generateRandomString(16);
        const newLink = new Link({
            shareLink: shareId,
            userId: userId,
        });
        await newLink.save();
        const shareUrl = `${req.protocol}://${req.get("host")}/api/v1/brain/${shareId}`;
        return res.status(201).json({ shareUrl: shareUrl });
    }
    catch (err) {
        console.error("Error creating user share link:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
});
app.get("/api/v1/brain/:shareLink", async (req, res) => {
    const { shareLink } = req.params;
    try {
        const link = await Link.findOne({ shareLink: shareLink });
        if (!link) {
            return res
                .status(404)
                .json({ error: "Share link not found or has expired" });
        }
        const sharedContent = await Content.find({ userId: link.userId })
            .populate("userId", "username")
            .populate("tags", "name");
        if (!sharedContent || sharedContent.length === 0) {
            return res
                .status(404)
                .json({ error: "No shared content could be found for this link" });
        }
        const formattedContent = sharedContent.map((content) => ({
            _id: content._id,
            title: content.title,
            link: content.link,
            type: content.type,
            tags: content.tags.map((tag) => tag.name),
            username: content.userId.username,
        }));
        res.status(200).json(formattedContent);
    }
    catch (error) {
        console.error("Error fetching shared content:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});
app.listen(3000, () => {
    console.log("Server is running on port 3000");
});
//# sourceMappingURL=index.js.map