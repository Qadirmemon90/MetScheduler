import "dotenv/config";
import dotenv from "dotenv";
import path from "node:path";
import dns from "node:dns";
import express from "express";
dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), ".env"), override: true });
dotenv.config({ path: path.resolve(process.cwd(), "server", ".env"), override: true });
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
import mcpRouter from "./routes/mcpRoutes.js";
import "./config/redis.js";
import { initScheduler } from "./services/schedulerService.js";
import { cloudinary } from "./config/cloudinary.js";
import { protect } from "./middlewares/authMiddleware.js";
import { Post } from "./models/Post.js";
import { Account } from "./models/Accounts.js";
import { publishDuePosts, publishPost } from "./services/publishService.js";
dns.setServers(["8.8.8.8", "1.1.1.1"]);
const app = express();
const port = Number(process.env.PORT) || 3000;
const allowedOrigins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    process.env.CLIENT_URL,
    process.env.FRONTEND_URL,
].filter(Boolean);
app.use(cors({
    origin: (origin, callback) => {
        // allow requests with no origin (like mobile apps, curl, postman, server-to-server)
        if (!origin || allowedOrigins.includes(origin) || allowedOrigins.some(o => origin.startsWith(o))) {
            callback(null, true);
        }
        else {
            callback(null, true);
        }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.get("/", (_req, res) => {
    res.send("Server is Running Fast!");
});
app.use("/uploads", express.static(path.resolve(process.cwd(), "uploads")));
app.use("/api/auth", authRouter);
app.use("/api/admin", adminRouter);
app.use("/api/billing", billingRouter);
app.use("/api/oauth", socialAuthRouter);
app.use("/api/accounts", accountRouter);
app.use("/api/posts", postRouter);
app.use("/api/activity", activityRouter);
app.use("/api/site-settings", siteSettingsRouter);
app.use("/api/mcp", mcpRouter);
app.use("/mcp", mcpRouter);
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
app.listen(port, "0.0.0.0", () => {
    console.log(`Server is running at http://localhost:${port}`);
});
connectDB()
    .then(() => {
    initScheduler();
})
    .catch((err) => {
    console.error("Initial connectDB error:", err);
});
