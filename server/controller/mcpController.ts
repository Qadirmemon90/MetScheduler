import { Request, Response } from "express";
import crypto from "node:crypto";
import { User } from "../models/user.js";
import { Account } from "../models/Accounts.js";
import { Post } from "../models/Post.js";
import { publishPost, SocialPlatform } from "../services/publishService.js";
import { AuthRequest } from "../middlewares/authMiddleware.js";

// MCP Tools Schema Definition
export const USER_MCP_TOOLS = [
  {
    name: "metscheduler_list_accounts",
    description: "List all connected social media accounts (LinkedIn, Twitter/X, Facebook, Instagram) for this user.",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "metscheduler_schedule_post",
    description: "Schedule a social media post across one or more of your connected platforms at a specific date and time.",
    inputSchema: {
      type: "object",
      properties: {
        content: {
          type: "string",
          description: "The full text content of the social media post, including emojis and hashtags.",
        },
        platforms: {
          type: "array",
          items: { type: "string" },
          description: "Target social platforms, e.g. ['linkedin', 'twitter', 'facebook', 'instagram'].",
        },
        scheduledFor: {
          type: "string",
          description: "ISO 8601 formatted date and time for when the post should be published (e.g. 2026-11-22T15:00:00Z).",
        },
        mediaUrl: {
          type: "string",
          description: "Optional URL of an image or video to attach to the post.",
        },
      },
      required: ["content", "platforms", "scheduledFor"],
    },
  },
  {
    name: "metscheduler_list_posts",
    description: "List upcoming scheduled posts or past published posts for this user.",
    inputSchema: {
      type: "object",
      properties: {
        status: {
          type: "string",
          enum: ["scheduled", "published", "draft", "failed"],
          description: "Filter by status: 'scheduled' for upcoming queue, 'published' for published archive.",
        },
        limit: {
          type: "number",
          description: "Max number of posts to retrieve (default 10).",
        },
      },
    },
  },
  {
    name: "metscheduler_publish_now",
    description: "Immediately publish a post to its connected social platforms right now without waiting for its scheduled time.",
    inputSchema: {
      type: "object",
      properties: {
        postId: {
          type: "string",
          description: "The ID of the post to publish immediately.",
        },
      },
      required: ["postId"],
    },
  },
  {
    name: "get_my_profile",
    description: "Retrieve profile and identity information for the currently authenticated user.",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "get_subscription_details",
    description: "Get subscription tier, active limits, billing status, and entitlement details.",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
];

// Helper to authenticate user via MCP key
const resolveUserFromMcpKey = async (req: Request) => {
  const authHeader = req.headers.authorization;
  let key = "";

  if (authHeader?.startsWith("Bearer ")) {
    key = authHeader.substring(7).trim();
  } else if (req.query.key) {
    key = String(req.query.key).trim();
  } else if (req.body?.apiKey) {
    key = String(req.body.apiKey).trim();
  }

  if (!key) return null;

  return await User.findOne({ mcpApiKey: key, status: { $ne: "suspended" } });
};

// POST /api/mcp
// Handles JSON-RPC 2.0 requests from ChatGPT or MCP clients
export const handleMcpJsonRpc = async (req: Request, res: Response): Promise<void> => {
  const user = await resolveUserFromMcpKey(req);
  if (!user) {
    res.status(401).json({
      jsonrpc: "2.0",
      id: req.body?.id || null,
      error: {
        code: -32000,
        message:
          "Unauthorized: Invalid or missing MCP API key. Provide your key via 'Authorization: Bearer <key>' or '?key=<key>'.",
      },
    });
    return;
  }

  const { id, method, params } = req.body || {};

  const sendResponse = (result: any) => {
    res.json({ jsonrpc: "2.0", id: id ?? null, result });
  };

  const sendError = (code: number, message: string) => {
    res.json({ jsonrpc: "2.0", id: id ?? null, error: { code, message } });
  };

  try {
    switch (method) {
      case "initialize":
        sendResponse({
          protocolVersion: "2024-11-05",
          capabilities: { tools: {} },
          serverInfo: {
            name: "metscheduler-user-mcp",
            version: "1.0.0",
            user: { name: user.name, email: user.email },
          },
        });
        break;

      case "tools/list":
        sendResponse({ tools: USER_MCP_TOOLS });
        break;

      case "tools/call": {
        const { name, arguments: args } = params || {};
        const result = await executeToolForUser(user, name, args || {});
        sendResponse({
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        });
        break;
      }

      default:
        sendError(-32601, `Method '${method}' not found`);
    }
  } catch (error: any) {
    sendError(-32603, error?.message || "Internal MCP error");
  }
};

async function executeToolForUser(user: any, toolName: string, args: any) {
  switch (toolName) {
    case "metscheduler_list_accounts": {
      const accounts = await Account.find({ user: user._id, status: "connected" });
      return {
        user: { name: user.name, email: user.email },
        connectedCount: accounts.length,
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
      const scheduledDate = new Date(args.scheduledFor);
      if (Number.isNaN(scheduledDate.getTime())) {
        throw new Error("Invalid scheduledFor date. Provide a valid ISO 8601 date string.");
      }

      const platforms = (args.platforms || []).map((p: string) => p.toLowerCase().trim());
      if (platforms.length === 0) {
        throw new Error("At least one target social platform is required.");
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
      const query: any = { user: user._id };
      if (args?.status) query.status = args.status;
      const limit = Number(args?.limit) || 10;

      const posts = await Post.find(query)
        .sort({ scheduledFor: 1, createdAt: -1 })
        .limit(limit);

      return {
        count: posts.length,
        posts: posts.map((p) => ({
          id: p._id.toString(),
          content: p.content,
          platforms: p.platforms,
          scheduledFor: p.scheduledFor,
          status: p.status,
          mediaUrl: p.mediaUrl,
        })),
      };
    }

    case "metscheduler_publish_now": {
      const post = await Post.findOne({ _id: args.postId, user: user._id });
      if (!post) throw new Error(`Post with ID ${args.postId} not found for this user.`);

      const result = await publishPost(post);
      return {
        success: true,
        message: `Post published successfully to ${result.accounts.map((a) => a.platform).join(", ")}`,
        publishedPost: result.publishedPost,
      };
    }

    case "get_my_profile": {
      return {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role || "user",
        plan: user.plan || "free",
        status: user.status || "active",
      };
    }

    case "get_subscription_details": {
      return {
        plan: user.plan || "free",
        billingStatus: user.billingStatus || "free",
        unlimitedPosts: user.plan !== "free",
        priorityAI: user.plan !== "free",
        connectedAccountsLimit: user.plan === "business" ? "unlimited" : user.plan === "pro" ? 10 : 2,
      };
    }

    default:
      throw new Error(`Unknown tool: ${toolName}`);
  }
}

// GET /api/mcp/my-credentials
export const getMyMcpCredentials = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    let mcpKey = user.mcpApiKey;
    if (!mcpKey) {
      mcpKey = `met_mcp_${crypto.randomBytes(16).toString("hex")}`;
      user.mcpApiKey = mcpKey;
      await user.save();
    }

    const host = req.get("host") || "localhost:3000";
    const protocol = req.protocol || "http";
    const serverUrl = `${protocol}://${host}`;

    // Desktop MCP config snippet
    const desktopConfig = {
      mcpServers: {
        metscheduler: {
          command: "node",
          args: [
            `${process.cwd()}\\node_modules\\tsx\\dist\\cli.mjs`,
            `${process.cwd()}\\mcpServer.ts`,
          ],
          env: {
            USER_EMAIL: user.email,
            MCP_API_KEY: mcpKey,
            MONGODB_URI: process.env.MONGODB_URI || "",
            ZERNIO_API_KEY: process.env.ZERNIO_API_KEY || "",
          },
        },
      },
    };

    res.json({
      mcpApiKey: mcpKey,
      mcpEndpointUrl: `${serverUrl}/api/mcp?key=${mcpKey}`,
      openApiSpecUrl: `${serverUrl}/api/mcp/openapi.json?key=${mcpKey}`,
      desktopConfig,
      tools: USER_MCP_TOOLS,
    });
  } catch (error: any) {
    res.status(500).json({ message: error?.message || "Server error fetching MCP info" });
  }
};

// POST /api/mcp/regenerate-key
export const regenerateMcpKey = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const newKey = `met_mcp_${crypto.randomBytes(16).toString("hex")}`;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { mcpApiKey: newKey },
      { new: true },
    );

    res.json({
      message: "New MCP API Key generated successfully!",
      mcpApiKey: user?.mcpApiKey,
    });
  } catch (error: any) {
    res.status(500).json({ message: error?.message || "Server error regenerating MCP key" });
  }
};

// GET /api/mcp/openapi.json
// OpenAPI schema specifically formatted for ChatGPT Custom GPT Actions
export const getMcpOpenApiSpec = async (req: Request, res: Response): Promise<void> => {
  const host = req.get("host") || "localhost:3000";
  const protocol = req.protocol || "http";
  const serverUrl = `${protocol}://${host}`;

  const spec = {
    openapi: "3.0.0",
    info: {
      title: "MetScheduler AI Assistant API",
      description:
        "Manage social accounts, list scheduled posts, and schedule posts across LinkedIn, Twitter/X, Facebook, and Instagram.",
      version: "1.0.0",
    },
    servers: [{ url: `${serverUrl}/api` }],
    paths: {
      "/accounts": {
        get: {
          summary: "List connected social accounts",
          operationId: "listAccounts",
          responses: {
            "200": {
              description: "Array of connected social accounts",
            },
          },
        },
      },
      "/posts": {
        get: {
          summary: "List user posts",
          operationId: "listPosts",
          parameters: [
            {
              name: "status",
              in: "query",
              required: false,
              schema: { type: "string", enum: ["scheduled", "published"] },
            },
          ],
          responses: {
            "200": { description: "List of posts" },
          },
        },
        post: {
          summary: "Schedule or create a post",
          operationId: "createPost",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["content", "platforms", "scheduledFor"],
                  properties: {
                    content: { type: "string" },
                    platforms: {
                      type: "array",
                      items: { type: "string" },
                    },
                    scheduledFor: { type: "string", format: "date-time" },
                    mediaUrl: { type: "string" },
                  },
                },
              },
            },
          },
          responses: {
            "201": { description: "Post successfully scheduled" },
          },
        },
      },
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
        },
      },
    },
    security: [{ bearerAuth: [] }],
  };

  res.json(spec);
};
