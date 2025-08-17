import dotenv from "dotenv";
import jwt from "jsonwebtoken";
dotenv.config();
export const userMiddleware = (req, res, next) => {
    const header = req.headers["authorization"];
    if (!header || !header.startsWith("Bearer ")) {
        return res.status(401).json({ error: "No header provided" });
    }
    const token = header.split(" ")[1];
    if (!token) {
        return res.status(401).json({ error: "No token provided" });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "adfihjklqwertyuiopzxcvbnm1234567890");
        req.user = decoded;
        next();
    }
    catch (err) {
        return res.status(401).json({ error: "Invalid token" });
    }
};
//# sourceMappingURL=middleware.js.map