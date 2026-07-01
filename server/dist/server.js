import "dotenv/config";
import dns from "node:dns";
import express from "express";
import cors from "cors";
import connectDB from "./config/db.js";
import authRouter from "./routes/AuthRoutes.js";
import adminRouter from "./routes/adminRoutes.js";
import billingRouter from "./routes/billingRoutes.js";
import socialAuthRouter from "./routes/socialAuthRouter.js";
import accountRouter from "./routes/accountRouts.js";
import postRouter from "./routes/postRoutes.js";
import activityRouter from "./routes/activityRoutes.js";
import siteSettingsRouter from "./routes/siteSettingsRoutes.js";
import { initScheduler } from "./services/schedulerService.js";
import { cloudinary } from "./config/cloudinary.js";
import { protect } from "./middlewares/authMiddleware.js";
import { Post } from "./models/Post.js";
import { Account } from "./models/Accounts.js";
import { publishDuePosts, publishPost } from "./services/publishService.js";
dns.setServers(["8.8.8.8", "1.1.1.1"]);
const app = express();
const port = process.env.PORT || 3000;
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.get("/", (_req, res) => {
    res.send("Server is Running Fast!");
});
app.use("/api/auth", authRouter);
app.use("/api/admin", adminRouter);
app.use("/api/billing", billingRouter);
app.use("/api/oauth", socialAuthRouter);
app.use("/api/accounts", accountRouter);
app.use("/api/posts", postRouter);
app.use("/api/activity", activityRouter);
app.use("/api/site-settings", siteSettingsRouter);
app.get("/api/debug/cloudinary", async (_req, res) => {
    try {
        const result = await cloudinary.api.resources({ max_results: 1 });
        res.json({
            ok: true,
            count: result.total_count || result.resources?.length || 0,
        });
    }
    catch (err) {
        console.error("Cloudinary debug error:", err?.message || err);
        res.status(502).json({
            ok: false,
            message: err?.message || err,
            details: err?.error || err,
        });
    }
});
app.post("/api/debug/publish-due", async (_req, res) => {
    try {
        const summary = await publishDuePosts();
        res.json({ ok: true, ...summary });
    }
    catch (error) {
        console.error("Error in debug publish-due:", error);
        res.status(500).json({ ok: false, message: error?.message || error });
    }
});
app.post("/api/debug/publish/:postId", protect, async (req, res) => {
    try {
        const post = await Post.findOne({
            _id: req.params.postId,
            user: req.user._id,
        });
        if (!post) {
            res.status(404).json({ message: "Post not found" });
            return;
        }
        const result = await publishPost(post);
        res.json({ ok: true, published: result.publishedPost });
    }
    catch (err) {
        console.error("Debug publish error:", err?.response?.data || err?.message || err);
        res.status(500).json({
            message: err?.response?.data?.message || err?.message || "Publish failed",
        });
    }
});
app.get("/api/debug/accounts", async (_req, res) => {
    try {
        const accounts = await Account.find({});
        res.json({ ok: true, count: accounts.length, accounts });
    }
    catch (err) {
        res.status(500).json({ ok: false, message: err?.message || err });
    }
});
app.get("/api/debug/posts", async (_req, res) => {
    try {
        const posts = await Post.find({}).sort({ createdAt: -1 });
        res.json({ ok: true, count: posts.length, posts });
    }
    catch (err) {
        res.status(500).json({ ok: false, message: err?.message || err });
    }
});
app.use((err, _req, res, _next) => {
    console.error(err);
    res.status(err?.statusCode || 500).json({
        message: err?.response?.data?.message ||
            err?.response?.data ||
            err?.message ||
            "Server error",
    });
});
await connectDB();
initScheduler();
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
