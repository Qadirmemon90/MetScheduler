import mongoose from "mongoose";

export interface IInvoice extends mongoose.Document {
  invoiceNumber: string;
  user: mongoose.Types.ObjectId;
  organization?: mongoose.Types.ObjectId;
  paymentRequest?: mongoose.Types.ObjectId;
  customerName: string;
  customerEmail: string;
  plan: string;
  billingPeriod: "monthly" | "yearly";
  amount: number;
  tax: number;
  total: number;
  currency: string;
  paymentMethod: string;
  transactionId: string;
  status: "paid" | "pending" | "refunded";
  paidAt?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    organization: { type: mongoose.Schema.Types.ObjectId, ref: "Organization" },
    paymentRequest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PaymentRequest",
    },
    customerName: { type: String, required: true },
    customerEmail: { type: String, required: true },
    plan: { type: String, required: true },
    billingPeriod: {
      type: String,
      enum: ["monthly", "yearly"],
      default: "monthly",
    },
    amount: { type: Number, required: true },
    tax: { type: Number, default: 0 },
    total: { type: Number, required: true },
    currency: { type: String, default: "PKR" },
    paymentMethod: { type: String, required: true },
    transactionId: { type: String, required: true },
    status: {
      type: String,
      enum: ["paid", "pending", "refunded"],
      default: "paid",
      index: true,
    },
    paidAt: { type: Date, default: () => new Date() },
    notes: { type: String },
  },
  { timestamps: true },
);

export const Invoice = mongoose.model<IInvoice>("Invoice", invoiceSchema);
