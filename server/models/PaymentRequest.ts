import mongoose from "mongoose";

export interface IPaymentRequest extends mongoose.Document {
  user: mongoose.Types.ObjectId;
  userName: string;
  userEmail: string;
  organization?: mongoose.Types.ObjectId;
  invoice?: mongoose.Types.ObjectId;
  targetPlan: "pro" | "business";
  billingCycle: "monthly" | "yearly";
  amount: number;
  currency: string;
  paymentMethod: "easypaisa" | "jazzcash" | "bankTransfer" | "sadapay" | "nayapay" | "other";
  senderAccountTitle?: string;
  senderAccountNumber?: string;
  transactionId: string;
  proofScreenshotUrl: string;
  proofScreenshotPublicId?: string;
  status: "pending" | "approved" | "rejected" | "more_info_required";
  adminNotes?: string;
  rejectionReason?: string;
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const paymentRequestSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    userName: { type: String, required: true },
    userEmail: { type: String, required: true, lowercase: true },
    organization: { type: mongoose.Schema.Types.ObjectId, ref: "Organization" },
    invoice: { type: mongoose.Schema.Types.ObjectId, ref: "Invoice" },
    targetPlan: {
      type: String,
      enum: ["pro", "business"],
      required: true,
    },
    billingCycle: {
      type: String,
      enum: ["monthly", "yearly"],
      default: "monthly",
    },
    amount: { type: Number, required: true },
    currency: { type: String, default: "PKR" },
    paymentMethod: {
      type: String,
      enum: ["easypaisa", "jazzcash", "bankTransfer", "sadapay", "nayapay", "other"],
      required: true,
    },
    senderAccountTitle: { type: String, trim: true },
    senderAccountNumber: { type: String, trim: true },
    transactionId: { type: String, required: true, trim: true },
    proofScreenshotUrl: { type: String, required: true },
    proofScreenshotPublicId: { type: String },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "more_info_required"],
      default: "pending",
      index: true,
    },
    adminNotes: { type: String },
    rejectionReason: { type: String },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    reviewedAt: { type: Date },
  },
  { timestamps: true },
);

export const PaymentRequest = mongoose.model<IPaymentRequest>(
  "PaymentRequest",
  paymentRequestSchema,
);
