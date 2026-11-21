import dotenv from "dotenv";
import path from "node:path";
import dns from "node:dns";
import readline from "node:readline";
import mongoose from "mongoose";
import { User } from "./models/user.js";
import { Account } from "./models/Accounts.js";
import { Post } from "./models/Post.js";
import { publishPost, type SocialPlatform } from "./services/publishService.js";

dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), ".env") });
dotenv.config({ path: path.resolve(process.cwd(), "server", ".env") });

try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch {
  // Use system default DNS
}

let dbConnected = false;
async function ensureDb() {
  if (dbConnected && mongoose.connection.readyState === 1) return;
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not configured in .env");
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  dbConnected = true;
}

async function resolveUser(email?: string) {
  await ensureDb();
  if (email) {
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (user) return user;
  }
  // Fallback to first user or admin user
  const adminEmail = process.env.ADMIN_EMAILS?.split(",")[0]?.trim();
  if (adminEmail) {
    const adminUser = await User.findOne({ email: adminEmail.toLowerCase() });
    if (adminUser) return adminUser;
  }
  const anyUser = await User.findOne({});
  if (!anyUser) throw new Error("No user found in MetScheduler database.");
  return anyUser;
}

const TOOLS = [
  {
    name: "metscheduler_list_accounts",
    description: "List all connected social media accounts (LinkedIn, Twitter/X, Facebook, Instagram, etc.) in MetScheduler.",
    inputSchema: {
      type: "object",
      properties: {
        userEmail: {
          type: "string",
          description: "Optional email of the user whose accounts to list. Defaults to the primary user.",
        },
      },
    },
  },
  {
    name: "metscheduler_schedule_post",
    description: "Schedule a social media post to be published at a specified time across one or more platforms.",
    inputSchema: {
      type: "object",
      properties: {
        content: {
          type: "string",
          description: "The text content of the social media post, including hashtags and emojis.",
        },
        platforms: {
          type: "array",
          items: { type: "string" },
          description: "Target social platforms: e.g. ['linkedin', 'twitter', 'facebook', 'instagram'].",
        },
        scheduledFor: {
          type: "string",
          description: "Scheduled date/time in ISO 8601 format (e.g. '2026-11-21T14:30:00Z').",
        },
        mediaUrl: {
          type: "string",
          description: "Optional image or video URL to attach to the post.",
        },
        userEmail: {
          type: "string",
          description: "Optional user email. Defaults to primary user.",
        },
      },
      required: ["content", "platforms", "scheduledFor"],
    },
  },
  {
    name: "metscheduler_list_posts",
    description: "List posts by status (scheduled, published, draft, failed).",
    inputSchema: {
      type: "object",
      properties: {
        status: {
          type: "string",
          enum: ["scheduled", "published", "draft", "failed"],
          description: "Filter by status: 'scheduled' for upcoming posts, 'published' for already posted.",
        },
        limit: {
          type: "number",
          description: "Max number of posts to retrieve (default 10).",
        },
        userEmail: {
          type: "string",
          description: "Optional user email.",
        },
      },
    },
  },
  {
    name: "metscheduler_publish_now",
    description: "Immediately publish a post to its connected social platforms right now without waiting for schedule.",
    inputSchema: {
      type: "object",
      properties: {
        postId: {
          type: "string",
          description: "The MongoDB ID of the post to publish immediately.",
        },
      },
      required: ["postId"],
    },
  },
];

async function handleToolCall(name: string, args: any) {
  await ensureDb();

  switch (name) {
    case "metscheduler_list_accounts": {
      const user = await resolveUser(args?.userEmail);
      const accounts = await Account.find({ user: user._id, status: "connected" });
      return {
        user: { name: user.name, email: user.email },
        count: accounts.length,
        accounts: accounts.map((a) => ({
          id: a._id.toString(),
          platform: a.platform,
          handle: a.handle,
          status: a.status,
          avatarUrl: a.avatarUrl,
        })),
      };
    }

    case "metscheduler_schedule_post": {
      const user = await resolveUser(args?.userEmail);
      const scheduledDate = new Date(args.scheduledFor);
      if (Number.isNaN(scheduledDate.getTime())) {
        throw new Error("Invalid scheduledFor date format. Please provide an ISO 8601 date string.");
      }

      const platforms = (args.platforms || []).map((p: string) => p.toLowerCase().trim());
      if (platforms.length === 0) {
        throw new Error("At least one platform must be selected.");
      }

      const post = await Post.create({
        user: user._id,
        content: args.content.trim(),
        platforms: platforms as SocialPlatform[],
        scheduledFor: scheduledDate,
        mediaUrl: args.mediaUrl,
        mediaType: args.mediaUrl ? "image" : undefined,
        status: "scheduled",
      });

      return {
        success: true,
        message: `Post successfully scheduled for ${scheduledDate.toISOString()} across ${platforms.join(", ")}`,
        postId: post._id.toString(),
        post,
      };
    }

    case "metscheduler_list_posts": {
      const user = await resolveUser(args?.userEmail);
      const query: any = { user: user._id };
      if (args?.status) query.status = args.status;

      const limit = Number(args?.limit) || 10;
      const posts = await Post.find(query).sort({ scheduledFor: 1, createdAt: -1 }).limit(limit);

      return {
        count: posts.length,
        posts: posts.map((p) => ({
          id: p._id.toString(),
          content: p.content,
          platforms: p.platforms,
          scheduledFor: p.scheduledFor,
          status: p.status,
          mediaUrl: p.mediaUrl,
          createdAt: p.createdAt,
        })),
      };
    }

    case "metscheduler_publish_now": {
      const post = await Post.findById(args.postId);
      if (!post) throw new Error(`Post with ID ${args.postId} not found.`);

      const result = await publishPost(post);
      return {
        success: true,
        message: `Post published successfully to ${result.accounts.map((a) => a.platform).join(", ")}`,
        publishedPost: result.publishedPost,
      };
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

// JSON-RPC stdio protocol loop
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false,
});

rl.on("line", async (line) => {
  if (!line.trim()) return;

  let request: any;
  try {
    request = JSON.parse(line);
  } catch (err) {
    return;
  }

  const { id, method, params } = request;

  const sendResponse = (result: any) => {
    process.stdout.write(JSON.stringify({ jsonrpc: "2.0", id, result }) + "\n");
  };

  const sendError = (code: number, message: string) => {
    process.stdout.write(JSON.stringify({ jsonrpc: "2.0", id, error: { code, message } }) + "\n");
  };

  try {
    if (method === "initialize") {
      sendResponse({
        protocolVersion: "2024-11-05",
        capabilities: {
          tools: {},
        },
        serverInfo: {
          name: "metscheduler-mcp",
          version: "1.0.0",
        },
      });
    } else if (method === "notifications/initialized") {
      // client ack
    } else if (method === "tools/list") {
      sendResponse({ tools: TOOLS });
    } else if (method === "tools/call") {
      const { name, arguments: args } = params || {};
      const data = await handleToolCall(name, args);
      sendResponse({
        content: [
          {
            type: "text",
            text: JSON.stringify(data, null, 2),
          },
        ],
      });
    } else {
      sendError(-32601, `Method ${method} not found`);
    }
  } catch (err: any) {
    sendError(-32603, err?.message || "Internal MCP error");
  }
});

process.stderr.write("MetScheduler MCP Server started (stdio transport)\n");
