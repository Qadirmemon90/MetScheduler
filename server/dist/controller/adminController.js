import bcrypt from "bcrypt";
import { Account } from "../models/Accounts.js";
import { ActivityLog } from "../models/ActivityLog.js";
import { PlanInquiry } from "../models/PlanInquiry.js";
import { Invoice } from "../models/Invoice.js";
import { Organization } from "../models/Organization.js";
import { PaymentRequest } from "../models/PaymentRequest.js";
import { Post } from "../models/Post.js";
import { User } from "../models/user.js";
import { flushCache, getCacheStatus, delCachePattern } from "../config/redis.js";
import { publishPost } from "../services/publishService.js";
// GET /api/admin/stats
export const getAdminStats = async (_req, res) => {
    try {
        const [totalUsers, connectedAccounts, scheduledPosts, publishedPosts, failedPosts, openInquiries, pendingPayments, approvedPayments,] = await Promise.all([
            User.countDocuments(),
            Account.countDocuments({ status: "connected" }),
            Post.countDocuments({ status: "scheduled" }),
            Post.countDocuments({ status: "published" }),
            Post.countDocuments({ status: "failed" }),
            PlanInquiry.countDocuments({ status: { $ne: "closed" } }),
            PaymentRequest.countDocuments({ status: "pending" }),
            PaymentRequest.countDocuments({ status: "approved" }),
        ]);
        // Calculate total revenue from approved payments
        const revenueAgg = await PaymentRequest.aggregate([
            { $match: { status: "approved" } },
            { $group: { _id: null, total: { $sum: "$amount" } } },
        ]);
        const totalRevenuePKR = revenueAgg[0]?.total || 0;
        res.json({
            totalUsers,
            connectedAccounts,
            scheduledPosts,
            publishedPosts,
            failedPosts,
            openInquiries,
            pendingPayments,
            approvedPayments,
            totalRevenuePKR,
        });
    }
    catch (error) {
        res.status(500).json({ message: error?.message || "Server error" });
    }
};
// GET /api/admin/payments
export const getAdminPayments = async (req, res) => {
    try {
        const { status, search } = req.query;
        const query = {};
        if (status && status !== "all") {
            query.status = status;
        }
        if (search) {
            const s = String(search).trim();
            query.$or = [
                { userName: { $regex: s, $options: "i" } },
                { userEmail: { $regex: s, $options: "i" } },
                { transactionId: { $regex: s, $options: "i" } },
                { senderAccountNumber: { $regex: s, $options: "i" } },
            ];
        }
        const payments = await PaymentRequest.find(query)
            .populate("user", "name email plan billingStatus")
            .populate("reviewedBy", "name email")
            .sort({ createdAt: -1 })
            .limit(200);
        res.json(payments);
    }
    catch (error) {
        res.status(500).json({ message: error?.message || "Server error fetching payments" });
    }
};
// PATCH /api/admin/payments/:id/approve
export const approvePayment = async (req, res) => {
    try {
        const payment = await PaymentRequest.findById(req.params.id);
        if (!payment) {
            res.status(404).json({ message: "Payment request not found" });
            return;
        }
        if (payment.status === "approved") {
            res.status(400).json({ message: "This payment request has already been approved" });
            return;
        }
        payment.status = "approved";
        payment.reviewedBy = req.user._id;
        payment.reviewedAt = new Date();
        payment.adminNotes = req.body?.adminNotes || "Approved by admin";
        // Generate verified Invoice
        const invoiceNumber = `INV-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
        const invoice = await Invoice.create({
            invoiceNumber,
            user: payment.user,
            paymentRequest: payment._id,
            customerName: payment.userName,
            customerEmail: payment.userEmail,
            plan: payment.targetPlan.toUpperCase(),
            billingPeriod: payment.billingCycle || "monthly",
            amount: payment.amount,
            tax: 0,
            total: payment.amount,
            currency: payment.currency || "PKR",
            paymentMethod: payment.paymentMethod,
            transactionId: payment.transactionId,
            status: "paid",
            paidAt: new Date(),
        });
        payment.invoice = invoice._id;
        await payment.save();
        // Upgrade target user plan
        const user = await User.findById(payment.user);
        if (user) {
            user.plan = payment.targetPlan;
            user.billingStatus = "active";
            await user.save();
            await ActivityLog.create({
                user: user._id,
                actionType: "PLAN_UPGRADED",
                description: `Payment approved! Plan upgraded to ${payment.targetPlan.toUpperCase()} via ${payment.paymentMethod}. Amount: PKR ${payment.amount}. Invoice: ${invoiceNumber}`,
            });
        }
        await delCachePattern("cache:*");
        res.json({
            message: `Payment approved! User upgraded to ${payment.targetPlan.toUpperCase()}.`,
            payment,
            invoice,
        });
    }
    catch (error) {
        res.status(500).json({ message: error?.message || "Server error approving payment" });
    }
};
// PATCH /api/admin/payments/:id/reject
export const rejectPayment = async (req, res) => {
    try {
        const { rejectionReason, adminNotes } = req.body;
        const payment = await PaymentRequest.findById(req.params.id);
        if (!payment) {
            res.status(404).json({ message: "Payment request not found" });
            return;
        }
        payment.status = "rejected";
        payment.rejectionReason = rejectionReason || "Payment verification failed";
        payment.adminNotes = adminNotes || "";
        payment.reviewedBy = req.user._id;
        payment.reviewedAt = new Date();
        await payment.save();
        // Revert user billing status if they were pending
        const user = await User.findById(payment.user);
        if (user && user.billingStatus === "payment_pending") {
            user.billingStatus = user.plan === "free" ? "free" : "active";
            await user.save();
            await ActivityLog.create({
                user: user._id,
                actionType: "PAYMENT_REJECTED",
                description: `Payment verification rejected for ${payment.targetPlan.toUpperCase()}. Reason: ${payment.rejectionReason}`,
            });
        }
        await delCachePattern("cache:*");
        res.json({
            message: "Payment rejected.",
            payment,
        });
    }
    catch (error) {
        res.status(500).json({ message: error?.message || "Server error rejecting payment" });
    }
};
// PATCH /api/admin/payments/:id/request-info
export const requestMoreInfoPayment = async (req, res) => {
    try {
        const { adminNotes } = req.body;
        const payment = await PaymentRequest.findById(req.params.id);
        if (!payment) {
            res.status(404).json({ message: "Payment request not found" });
            return;
        }
        payment.status = "more_info_required";
        payment.adminNotes = adminNotes || "Additional transaction proof required (e.g. Sender Account #, clearer receipt screenshot).";
        payment.reviewedBy = req.user._id;
        payment.reviewedAt = new Date();
        await payment.save();
        await ActivityLog.create({
            user: payment.user,
            actionType: "PAYMENT_REJECTED",
            description: `Payment verification update: More information requested. Admin Note: ${payment.adminNotes}`,
        });
        res.json({
            message: "Payment status marked as more info required.",
            payment,
        });
    }
    catch (error) {
        res.status(500).json({ message: error?.message || "Server error updating payment" });
    }
};
// GET /api/admin/users
export const getAdminUsers = async (req, res) => {
    try {
        const { search, role, plan, status } = req.query;
        const query = {};
        if (search) {
            const s = String(search).trim();
            query.$or = [
                { name: { $regex: s, $options: "i" } },
                { email: { $regex: s, $options: "i" } },
            ];
        }
        if (role && role !== "all")
            query.role = role;
        if (plan && plan !== "all")
            query.plan = plan;
        if (status && status !== "all")
            query.status = status;
        const users = await User.find(query)
            .select("-password")
            .sort({ createdAt: -1 })
            .limit(200);
        res.json(users);
    }
    catch (error) {
        res.status(500).json({ message: error?.message || "Server error" });
    }
};
// PATCH /api/admin/users/:id/role
export const updateUserRole = async (req, res) => {
    try {
        const { role } = req.body;
        if (!["user", "admin"].includes(role)) {
            res.status(400).json({ message: "Role must be user or admin" });
            return;
        }
        const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select("-password");
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
// PATCH /api/admin/users/:id/status
export const updateUserStatus = async (req, res) => {
    try {
        const { status } = req.body;
        if (!["active", "suspended"].includes(status)) {
            res.status(400).json({ message: "Status must be active or suspended" });
            return;
        }
        const user = await User.findByIdAndUpdate(req.params.id, { status }, { new: true }).select("-password");
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
// POST /api/admin/users/:id/reset-password
export const resetUserPasswordAdmin = async (req, res) => {
    try {
        const { newPassword } = req.body;
        if (!newPassword || newPassword.length < 6) {
            res.status(400).json({ message: "Password must be at least 6 characters" });
            return;
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);
        const user = await User.findByIdAndUpdate(req.params.id, { password: hashedPassword }, { new: true }).select("-password");
        if (!user) {
            res.status(404).json({ message: "User not found" });
            return;
        }
        res.json({ message: "Password updated successfully" });
    }
    catch (error) {
        res.status(500).json({ message: error?.message || "Server error" });
    }
};
// DELETE /api/admin/users/:id
export const deleteUserAdmin = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            res.status(404).json({ message: "User not found" });
            return;
        }
        await Promise.all([
            Account.deleteMany({ user: user._id }),
            ActivityLog.deleteMany({ user: user._id }),
            PaymentRequest.deleteMany({ user: user._id }),
            PlanInquiry.deleteMany({ user: user._id }),
            Post.deleteMany({ user: user._id }),
            user.deleteOne(),
        ]);
        res.json({ message: "User and all associated data deleted successfully" });
    }
    catch (error) {
        res.status(500).json({ message: error?.message || "Server error" });
    }
};
// GET /api/admin/posts
export const getAdminPosts = async (req, res) => {
    try {
        const { status, search } = req.query;
        const query = {};
        if (status && status !== "all")
            query.status = status;
        if (search)
            query.content = { $regex: String(search).trim(), $options: "i" };
        const posts = await Post.find(query)
            .populate("user", "name email")
            .sort({ createdAt: -1 })
            .limit(200);
        res.json(posts);
    }
    catch (error) {
        res.status(500).json({ message: error?.message || "Server error" });
    }
};
// DELETE /api/admin/posts/:id
export const deleteAdminPost = async (req, res) => {
    try {
        const post = await Post.findByIdAndDelete(req.params.id);
        if (!post) {
            res.status(404).json({ message: "Post not found" });
            return;
        }
        res.json({ message: "Post deleted successfully" });
    }
    catch (error) {
        res.status(500).json({ message: error?.message || "Server error" });
    }
};
// POST /api/admin/posts/:id/publish-now
export const publishAdminPostNow = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) {
            res.status(404).json({ message: "Post not found" });
            return;
        }
        const result = await publishPost(post);
        res.json({ success: true, publishedPost: result.publishedPost });
    }
    catch (error) {
        res.status(500).json({ message: error?.message || "Failed to publish post" });
    }
};
// GET /api/admin/accounts
export const getAdminAccounts = async (_req, res) => {
    try {
        const accounts = await Account.find({})
            .populate("user", "name email")
            .sort({ createdAt: -1 })
            .limit(200);
        res.json(accounts);
    }
    catch (error) {
        res.status(500).json({ message: error?.message || "Server error" });
    }
};
// GET /api/admin/inquiries
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
// PATCH /api/admin/inquiries/:id
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
// PATCH /api/admin/users/:id/plan
export const updateUserPlan = async (req, res) => {
    try {
        const { plan, billingStatus } = req.body;
        if (plan && !["free", "pro", "business"].includes(plan)) {
            res.status(400).json({ message: "Invalid plan" });
            return;
        }
        if (billingStatus &&
            !["free", "contact_requested", "payment_pending", "active"].includes(billingStatus)) {
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
        await delCachePattern("cache:*");
        res.json(user);
    }
    catch (error) {
        res.status(500).json({ message: error?.message || "Server error" });
    }
};
// GET /api/admin/cache-status
export const getAdminCacheStatusEndpoint = async (_req, res) => {
    try {
        const status = await getCacheStatus();
        res.json(status);
    }
    catch (error) {
        res.status(500).json({ message: error?.message || "Server error checking cache" });
    }
};
// POST /api/admin/flush-cache
export const flushAdminCacheEndpoint = async (_req, res) => {
    try {
        await flushCache();
        res.json({ success: true, message: "Redis & Memory cache successfully flushed!" });
    }
    catch (error) {
        res.status(500).json({ message: error?.message || "Server error flushing cache" });
    }
};
// GET /api/admin/activity-logs
export const getAdminActivityLogs = async (_req, res) => {
    try {
        const logs = await ActivityLog.find({})
            .populate("user", "name email")
            .sort({ createdAt: -1 })
            .limit(100);
        res.json(logs);
    }
    catch (error) {
        res.status(500).json({ message: error?.message || "Server error fetching logs" });
    }
};
// GET /api/admin/invoices
export const getAdminInvoices = async (req, res) => {
    try {
        const { search, status, plan } = req.query;
        const query = {};
        if (status && status !== "all")
            query.status = status;
        if (plan && plan !== "all")
            query.plan = plan.toUpperCase();
        if (search) {
            const s = String(search).trim();
            query.$or = [
                { invoiceNumber: { $regex: s, $options: "i" } },
                { customerName: { $regex: s, $options: "i" } },
                { customerEmail: { $regex: s, $options: "i" } },
                { transactionId: { $regex: s, $options: "i" } },
            ];
        }
        const invoices = await Invoice.find(query)
            .populate("user", "name email plan")
            .populate("paymentRequest")
            .sort({ createdAt: -1 })
            .limit(200);
        res.json(invoices);
    }
    catch (error) {
        res.status(500).json({ message: error?.message || "Server error fetching invoices" });
    }
};
// GET /api/admin/invoices/:id
export const getAdminInvoiceById = async (req, res) => {
    try {
        const invoice = await Invoice.findById(req.params.id)
            .populate("user", "name email plan billingStatus")
            .populate("paymentRequest");
        if (!invoice) {
            res.status(404).json({ message: "Invoice not found" });
            return;
        }
        res.json(invoice);
    }
    catch (error) {
        res.status(500).json({ message: error?.message || "Server error fetching invoice" });
    }
};
// GET /api/admin/organizations
export const getAdminOrganizations = async (req, res) => {
    try {
        const { search, status, plan } = req.query;
        const query = {};
        if (status && status !== "all")
            query.status = status;
        if (plan && plan !== "all")
            query.plan = plan;
        if (search) {
            const s = String(search).trim();
            query.$or = [
                { name: { $regex: s, $options: "i" } },
                { slug: { $regex: s, $options: "i" } },
                { contactEmail: { $regex: s, $options: "i" } },
            ];
        }
        let organizations = await Organization.find(query)
            .populate("owner", "name email plan")
            .sort({ createdAt: -1 })
            .limit(100);
        // If no organizations exist yet, auto-provision default organizations from existing users
        if (organizations.length === 0 && !search && !status && !plan) {
            const users = await User.find({}).limit(20);
            for (const u of users) {
                const orgName = `${u.name}'s Organization`;
                const slug = u.name.toLowerCase().replace(/[^a-z0-9]/g, "-") + "-" + u._id.toString().slice(-4);
                await Organization.findOneAndUpdate({ owner: u._id }, {
                    $setOnInsert: {
                        name: orgName,
                        slug,
                        owner: u._id,
                        plan: u.plan === "business" ? "business" : u.plan === "pro" ? "pro" : "free",
                        status: "active",
                        usersCount: 1,
                        branchesCount: 1,
                        warehousesCount: 1,
                        contactEmail: u.email,
                    },
                }, { upsert: true, new: true });
            }
            organizations = await Organization.find(query)
                .populate("owner", "name email plan")
                .sort({ createdAt: -1 })
                .limit(100);
        }
        res.json(organizations);
    }
    catch (error) {
        res.status(500).json({ message: error?.message || "Server error fetching organizations" });
    }
};
// PATCH /api/admin/organizations/:id/status
export const updateOrganizationStatus = async (req, res) => {
    try {
        const { status } = req.body;
        if (!["active", "trial", "suspended"].includes(status)) {
            res.status(400).json({ message: "Status must be active, trial, or suspended" });
            return;
        }
        const org = await Organization.findByIdAndUpdate(req.params.id, { status }, { new: true }).populate("owner", "name email");
        if (!org) {
            res.status(404).json({ message: "Organization not found" });
            return;
        }
        res.json(org);
    }
    catch (error) {
        res.status(500).json({ message: error?.message || "Server error updating organization status" });
    }
};
