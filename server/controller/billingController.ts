import { Request, Response } from "express";
import { AuthRequest } from "../middlewares/authMiddleware.js";
import { PlanInquiry } from "../models/PlanInquiry.js";
import { User } from "../models/user.js";

const paidPlans = ["pro", "business"] as const;
type PaidPlan = (typeof paidPlans)[number];

const normalize = (value: unknown) => String(value || "").trim();

const validatePaidPlan = (plan: unknown, res: Response) => {
  const normalizedPlan = normalize(plan).toLowerCase();
  if (!paidPlans.includes(normalizedPlan as PaidPlan)) {
    res.status(400).json({ message: "Select a valid upgrade plan" });
    return null;
  }
  return normalizedPlan as PaidPlan;
};

export const contactVendor = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { plan, message, phone, company } = req.body;
    const selectedPlan = validatePaidPlan(plan, res);
    if (!selectedPlan) return;

    const inquiry = await PlanInquiry.create({
      user: req.user._id,
      plan: selectedPlan,
      name: req.user.name,
      email: req.user.email,
      phone: normalize(phone),
      company: normalize(company),
      message: normalize(message),
      source: "settings",
    });

    await User.findByIdAndUpdate(req.user._id, {
      plan: selectedPlan,
      billingStatus: "contact_requested",
    });

    res.status(201).json({
      message: "Upgrade request sent. Vendor will contact you directly.",
      inquiry,
    });
  } catch (error: any) {
    res.status(500).json({ message: error?.message || "Server error" });
  }
};

export const publicContactVendor = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { plan, name, email, phone, company, message } = req.body;
    const selectedPlan = validatePaidPlan(plan, res);
    if (!selectedPlan) return;

    const normalizedName = normalize(name);
    const normalizedEmail = normalize(email).toLowerCase();

    if (!normalizedName || !normalizedEmail) {
      res.status(400).json({ message: "Name and email are required" });
      return;
    }

    const inquiry = await PlanInquiry.create({
      plan: selectedPlan,
      name: normalizedName,
      email: normalizedEmail,
      phone: normalize(phone),
      company: normalize(company),
      message: normalize(message),
      source: "home",
    });

    res.status(201).json({
      message: "Vendor contact request sent. We will contact you directly.",
      inquiry,
    });
  } catch (error: any) {
    res.status(500).json({ message: error?.message || "Server error" });
  }
};
