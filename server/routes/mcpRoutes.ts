import express from "express";
import {
  getMyMcpCredentials,
  getMcpOpenApiSpec,
  handleMcpJsonRpc,
  regenerateMcpKey,
} from "../controller/mcpController.js";
import { protect } from "../middlewares/authMiddleware.js";

const mcpRouter = express.Router();

// JSON-RPC 2.0 endpoint for ChatGPT & MCP clients
mcpRouter.post("/", handleMcpJsonRpc);

// OpenAPI Spec for ChatGPT Custom Actions
mcpRouter.get("/openapi.json", getMcpOpenApiSpec);

// Authenticated user credentials & instructions
mcpRouter.get("/my-credentials", protect, getMyMcpCredentials);
mcpRouter.post("/regenerate-key", protect, regenerateMcpKey);

export default mcpRouter;
