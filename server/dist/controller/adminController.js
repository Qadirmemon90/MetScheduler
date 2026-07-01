import { Account } from "../models/Accounts.js";
import { PlanInquiry } from "../models/PlanInquiry.js";
import { Post } from "../models/Post.js";
import { User } from "../models/user.js";
export const getAdminStats = async (_req, res) => {
    try {
        const [totalUsers, connectedAccounts, scheduledPosts, publishedPosts, failedPosts, openInquiries,] = await Promise.all([
            User.countDocuments(),
            Account.countDocuments({ status: "connected" }),
            Post.countDocuments({ status: "scheduled" }),
            Post.countDocuments({ status: "published" }),
            Post.countDocuments({ status: "failed" }),
            PlanInquiry.countDocuments({ status: { $ne: "closed" } }),
        ]);
        res.json({
            totalUsers,
            connectedAccounts,
            scheduledPosts,
            publishedPosts,
            failedPosts,
            openInquiries,
        });
    }
    catch (error) {
        res.status(500).json({ message: error?.message || "Server error" });
    }
};
export const getAdminUsers = async (_req, res) => {
    try {
        const users = await User.find({})
            .select("-password")
            .sort({ createdAt: -1 })
            .limit(100);
        res.json(users);
    }
    catch (error) {
        res.status(500).json({ message: error?.message || "Server error" });
    }
};
export const getAdminPosts = async (_req, res) => {
    try {
        const posts = await Post.find({})
            .populate("user", "name email")
            .sort({ createdAt: -1 })
            .limit(100);
        res.json(posts);
    }
    catch (error) {
        res.status(500).json({ message: error?.message || "Server error" });
    }
};
export const getAdminInquiries = async (_req, res) => {
    try {
        const inquiries = await PlanInquiry.find({})
            .populate("user", "name email plan billingStatus")
            .sort({ createdAt: -1 })
            .limit(100);
        res.json(inquiries);
    }
    catch (error) {
        res.status(500).json({ message: error?.message || "Server error" });
    }
};
export const updateInquiryStatus = async (req, res) => {
    try {
        const { status } = req.body;
        if (!["new", "contacted", "closed"].includes(status)) {
            res.status(400).json({ message: "Invalid inquiry status" });
            return;
        }
        const inquiry = await PlanInquiry.findByIdAndUpdate(req.params.id, { status }, { new: true });
        if (!inquiry) {
            res.status(404).json({ message: "Inquiry not found" });
            return;
        }
        res.json(inquiry);
    }
    catch (error) {
        res.status(500).json({ message: error?.message || "Server error" });
    }
};
export const updateUserPlan = async (req, res) => {
    try {
        const { plan, billingStatus } = req.body;
        if (plan && !["free", "pro", "business"].includes(plan)) {
            res.status(400).json({ message: "Invalid plan" });
            return;
        }
        if (billingStatus &&
            !["free", "contact_requested", "active"].includes(billingStatus)) {
            res.status(400).json({ message: "Invalid billing status" });
            return;
        }
        const user = await User.findByIdAndUpdate(req.params.id, {
            ...(plan ? { plan } : {}),
            ...(billingStatus ? { billingStatus } : {}),
        }, { new: true }).select("-password");
        if (!user) {
            res.status(404).json({ message: "User not found" });
            return;
        }
        res.json(user);
    }
    catch (error) {
        res.status(500).json({ message: error?.message || "Server error" });
    }
};
