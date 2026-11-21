import mongoose from "mongoose";
import crypto from "node:crypto";
const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    plan: { type: String, enum: ["free", "pro", "business"], default: "free" },
    billingStatus: {
        type: String,
        enum: ["free", "contact_requested", "payment_pending", "active"],
        default: "free",
    },
    status: {
        type: String,
        enum: ["active", "suspended"],
        default: "active",
    },
    zernioProfileId: { type: String },
    mcpApiKey: {
        type: String,
        unique: true,
        sparse: true,
        default: () => `met_mcp_${crypto.randomBytes(16).toString("hex")}`,
    },
    resetPasswordToken: { type: String },
    resetPasswordExpire: { type: Date },
}, { timestamps: true });
export const User = mongoose.model("User", userSchema);
