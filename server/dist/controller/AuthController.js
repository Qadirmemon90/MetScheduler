import { User } from "../models/user.js";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Account } from "../models/Accounts.js";
import { ActivityLog } from "../models/ActivityLog.js";
import { Generation } from "../models/Generation.js";
import { PlanInquiry } from "../models/PlanInquiry.js";
import { Post } from "../models/Post.js";
import { isAdminUser } from "../middlewares/authMiddleware.js";
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || "fallback_secret", { expiresIn: '30d' });
};
const userPayload = (user, includeToken = false) => ({
    _id: user._id,
    id: user._id,
    name: user.name,
    email: user.email,
    role: isAdminUser(user) ? "admin" : user.role || "user",
    plan: user.plan || "free",
    billingStatus: user.billingStatus || "free",
    ...(includeToken ? { token: generateToken(user._id.toString()) } : {}),
});
// Register user
// Post /api/auth/register
export const registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const userExists = await User.findOne({ email });
        if (userExists) {
            res.status(400).json({ message: "User already exists" });
            return;
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const user = await User.create({ name, email, password: hashedPassword });
        if (user) {
            res.status(201).json(userPayload(user, true));
        }
        else {
            res.status(400).json({ message: "Invalid user data" });
        }
    }
    catch (error) {
        res.status(500).json({ message: error?.message || "Server error" });
    }
};
// Login user
// Post /api/auth/Login
export const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (user && (await bcrypt.compare(password, user.password))) {
            res.json(userPayload(user, true));
        }
        else {
            res.status(401).json({ message: "Invalid email or password" });
        }
    }
    catch (error) {
        res.status(500).json({ message: error?.message || "Server error" });
    }
};
export const getMe = async (req, res) => {
    res.json(userPayload(req.user));
};
export const updateProfile = async (req, res) => {
    try {
        const { name, email } = req.body;
        if (!name?.trim() || !email?.trim()) {
            res.status(400).json({ message: "Name and email are required" });
            return;
        }
        const emailOwner = await User.findOne({
            email: email.trim().toLowerCase(),
            _id: { $ne: req.user._id },
        });
        if (emailOwner) {
            res.status(400).json({ message: "Email is already in use" });
            return;
        }
        const user = await User.findByIdAndUpdate(req.user._id, {
            name: name.trim(),
            email: email.trim().toLowerCase(),
        }, { new: true }).select("-password");
        res.json(userPayload(user));
    }
    catch (error) {
        res.status(500).json({ message: error?.message || "Server error" });
    }
};
export const deleteAccount = async (req, res) => {
    try {
        const { password, confirmation } = req.body;
        if (confirmation !== "DELETE") {
            res.status(400).json({ message: "Type DELETE to confirm account deletion" });
            return;
        }
        const user = await User.findById(req.user._id);
        if (!user) {
            res.status(404).json({ message: "User not found" });
            return;
        }
        if (!password || !(await bcrypt.compare(password, user.password))) {
            res.status(401).json({ message: "Password is incorrect" });
            return;
        }
        await Promise.all([
            Account.deleteMany({ user: user._id }),
            ActivityLog.deleteMany({ user: user._id }),
            Generation.deleteMany({ user: user._id }),
            PlanInquiry.deleteMany({ user: user._id }),
            Post.deleteMany({ user: user._id }),
        ]);
        await user.deleteOne();
        res.json({ message: "Account deleted successfully" });
    }
    catch (error) {
        res.status(500).json({ message: error?.message || "Server error" });
    }
};
