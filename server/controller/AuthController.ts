import { Request, Response } from "express";
import crypto from "node:crypto";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { User } from "../models/user.js";
import { Account } from "../models/Accounts.js";
import { ActivityLog } from "../models/ActivityLog.js";
import { Generation } from "../models/Generation.js";
import { PlanInquiry } from "../models/PlanInquiry.js";
import { Post } from "../models/Post.js";
import { AuthRequest, isAdminUser } from "../middlewares/authMiddleware.js";

const generateToken = (id: string) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || "fallback_secret", {
    expiresIn: "30d",
  });
};

const userPayload = (user: any, includeToken = false) => {
  // Ensure MCP key exists
  const mcpKey =
    user.mcpApiKey || `met_mcp_${crypto.randomBytes(16).toString("hex")}`;
  if (!user.mcpApiKey) {
    User.findByIdAndUpdate(user._id, { mcpApiKey: mcpKey }).exec();
  }

  return {
    _id: user._id,
    id: user._id,
    name: user.name,
    email: user.email,
    role: isAdminUser(user) ? "admin" : user.role || "user",
    plan: user.plan || "free",
    billingStatus: user.billingStatus || "free",
    status: user.status || "active",
    mcpApiKey: mcpKey,
    ...(includeToken ? { token: generateToken(user._id.toString()) } : {}),
  };
};

// Register user
// POST /api/auth/register
export const registerUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password } = req.body;
    if (!name?.trim() || !email?.trim() || !password) {
      res.status(400).json({ message: "Name, email and password are required" });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const userExists = await User.findOne({ email: normalizedEmail });
    if (userExists) {
      res.status(400).json({ message: "An account with this email already exists" });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const mcpApiKey = `met_mcp_${crypto.randomBytes(16).toString("hex")}`;

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      mcpApiKey,
    });

    if (user) {
      res.status(201).json(userPayload(user, true));
    } else {
      res.status(400).json({ message: "Invalid user data" });
    }
  } catch (error) {
    res.status(500).json({ message: (error as Error)?.message || "Server error" });
  }
};

// Login user
// POST /api/auth/login
export const loginUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    if (!email?.trim() || !password) {
      res.status(400).json({ message: "Email and password are required" });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      res.status(401).json({ message: "Invalid email or password" });
      return;
    }

    if (user.status === "suspended") {
      res.status(403).json({
        message: "Your account has been suspended. Please contact support.",
      });
      return;
    }

    res.json(userPayload(user, true));
  } catch (error) {
    res.status(500).json({ message: (error as Error)?.message || "Server error" });
  }
};

// Forgot Password
// POST /api/auth/forgot-password
export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;
    if (!email?.trim()) {
      res.status(400).json({ message: "Please provide your registered email address" });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      // Return friendly success to prevent email enumeration
      res.json({
        message:
          "If an account exists with that email, password reset instructions have been generated.",
      });
      return;
    }

    // Generate random 6-digit verification code & secure token
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const rawToken = crypto.randomBytes(32).toString("hex");

    // Hash token to store in database
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

    user.resetPasswordToken = `${tokenHash}:${verificationCode}`;
    user.resetPasswordExpire = new Date(Date.now() + 60 * 60 * 1000); // 1 hour validity
    await user.save();

    // Reset link
    const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
    const resetUrl = `${clientUrl}/reset-password?token=${rawToken}&code=${verificationCode}`;

    console.log(`[Auth] Password reset generated for ${user.email}: Code=${verificationCode}, Link=${resetUrl}`);

    res.json({
      message: "Password reset instructions have been generated successfully.",
      resetToken: rawToken,
      code: verificationCode,
      resetUrl,
    });
  } catch (error) {
    res.status(500).json({ message: (error as Error)?.message || "Server error" });
  }
};

// Reset Password
// POST /api/auth/reset-password
export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token, code, email, newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      res.status(400).json({ message: "Password must be at least 6 characters long" });
      return;
    }

    let user: any = null;

    if (token) {
      const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
      user = await User.findOne({
        resetPasswordToken: { $regex: new RegExp(`^${tokenHash}`) },
        resetPasswordExpire: { $gt: new Date() },
      });
    }

    if (!user && email && code) {
      const normalizedEmail = email.trim().toLowerCase();
      user = await User.findOne({
        email: normalizedEmail,
        resetPasswordToken: { $regex: new RegExp(`:${code}$`) },
        resetPasswordExpire: { $gt: new Date() },
      });
    }

    if (!user) {
      res.status(400).json({
        message: "Invalid or expired password reset link/code. Please request a new one.",
      });
      return;
    }

    // Update password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.json({
      message: "Password reset successfully! You can now log in with your new password.",
      user: userPayload(user, true),
    });
  } catch (error) {
    res.status(500).json({ message: (error as Error)?.message || "Server error" });
  }
};

export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  res.json(userPayload(req.user));
};

export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
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
      res.status(400).json({ message: "Email is already in use by another account" });
      return;
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        name: name.trim(),
        email: email.trim().toLowerCase(),
      },
      { new: true },
    ).select("-password");

    res.json(userPayload(user));
  } catch (error) {
    res.status(500).json({ message: (error as Error)?.message || "Server error" });
  }
};

export const deleteAccount = async (req: AuthRequest, res: Response): Promise<void> => {
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
  } catch (error) {
    res.status(500).json({ message: (error as Error)?.message || "Server error" });
  }
};
