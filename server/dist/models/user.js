import mongoose from "mongoose";
const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    name: { type: String, required: true },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    plan: { type: String, enum: ["free", "pro", "business"], default: "free" },
    billingStatus: {
        type: String,
        enum: ["free", "contact_requested", "active"],
        default: "free",
    },
    zernioProfileId: { type: String },
}, { timestamps: true });
export const User = mongoose.model('User', userSchema);
