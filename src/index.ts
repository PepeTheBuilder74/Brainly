import bcrypt from "bcrypt";
import dotenv from "dotenv";
import express from "express";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
dotenv.config();

import { User, Content, Tags, Link, connectDB } from "./db.js";
const app = express();

await connectDB();

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
  } catch (err: any) {
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
  const token = await jwt.sign(
    { userId: user._id },
    process.env.JWT_SECRET || "adfihjklqwertyuiopzxcvbnm1234567890",
    {
      expiresIn: "1h",
    }
  );
  return res.status(200).json({ token, userId: user._id });
});

app.post("/api/v1/content", (req, res) => {


});

app.get("/api/v1/content", (req, res) => {


});

app.delete("/api/v1/delete", (req, res) => {


});

app.post("/api/v1/brain/share", (req, res) => {


});

app.get("/api/v1/brain/:shareLink", (req, res) => {


});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
