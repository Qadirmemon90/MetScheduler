import mongoose from "mongoose";

export interface IOrganization extends mongoose.Document {
  name: string;
  slug: string;
  owner: mongoose.Types.ObjectId;
  plan: "free" | "starter" | "pro" | "business" | "enterprise";
  status: "active" | "trial" | "suspended";
  usersCount: number;
  branchesCount: number;
  warehousesCount: number;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const organizationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, lowercase: true, trim: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    plan: {
      type: String,
      enum: ["free", "starter", "pro", "business", "enterprise"],
      default: "free",
    },
    status: {
      type: String,
      enum: ["active", "trial", "suspended"],
      default: "active",
      index: true,
    },
    usersCount: { type: Number, default: 1 },
    branchesCount: { type: Number, default: 1 },
    warehousesCount: { type: Number, default: 1 },
    contactEmail: { type: String, trim: true, lowercase: true },
    contactPhone: { type: String, trim: true },
    address: { type: String, trim: true },
    notes: { type: String },
  },
  { timestamps: true },
);

export const Organization = mongoose.model<IOrganization>(
  "Organization",
  organizationSchema,
);
