import mongoose from "mongoose";

const planInquirySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    plan: {
      type: String,
      enum: ["pro", "business"],
      required: true,
    },
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String },
    company: { type: String },
    message: { type: String },
    source: {
      type: String,
      enum: ["home", "settings", "admin"],
      default: "home",
    },
    status: {
      type: String,
      enum: ["new", "contacted", "closed"],
      default: "new",
    },
  },
  { timestamps: true },
);

export const PlanInquiry = mongoose.model("PlanInquiry", planInquirySchema);
