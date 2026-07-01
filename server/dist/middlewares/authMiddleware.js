import jwt from "jsonwebtoken";
import { User } from "../models/user.js";
const adminEmails = () => (process.env.ADMIN_EMAILS || process.env.ADMIN_EMAIL || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
export const isAdminUser = (user) => user?.role === "admin" || adminEmails().includes(user?.email?.toLowerCase?.());
export const protect = async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
        try {
            token = req.headers.authorization.split(" ")[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = await User.findById(decoded.id).select("-password");
            if (!req.user) {
                res.status(401).json({ message: "Not authorized, user not found" });
                return;
            }
            next();
        }
        catch (error) {
            res.status(401).json({ message: error?.message || "Not authorized, token failed" });
        }
    }
    else {
        res.status(401).json({ message: "Not authorized, no token" });
    }
};
export const requireAdmin = (req, res, next) => {
    if (!isAdminUser(req.user)) {
        res.status(403).json({ message: "Admin access required" });
        return;
    }
    next();
};
