import mongoose, { model, Schema } from "mongoose";
export const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/brainly");
        console.log("MongoDB connected successfully");
    }
    catch (err) {
        console.error("MongoDB connection failed", err);
        process.exit(1);
    }
};
const userSchema = new Schema({
    username: { type: String, required: true, unique: true, index: true },
    password: { type: String, required: true },
});
const tagsSchema = new Schema({
    name: { type: String, required: true, unique: true },
});
const contentSchema = new Schema({
    title: { type: String, required: true },
    link: { type: String },
    type: { type: String },
    tags: [{ type: Schema.Types.ObjectId, ref: "Tags" }],
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
});
const linkSchema = new Schema({
    shareLink: { type: String, required: true, unique: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
});
export const User = model("User", userSchema);
export const Content = model("Content", contentSchema);
export const Tags = model("Tags", tagsSchema);
export const Link = model("Link", linkSchema);
//# sourceMappingURL=db.js.map