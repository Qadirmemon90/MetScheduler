import { Request, Response } from "express";
import { AuthRequest } from "../middlewares/authMiddleware.js";
import { PlanInquiry } from "../models/PlanInquiry.js";
import { PaymentRequest } from "../models/PaymentRequest.js";
import { Invoice } from "../models/Invoice.js";
import { SiteSettings, defaultPaymentMethods, defaultPlans } from "../models/SiteSettings.js";
import { User } from "../models/user.js";
import { ActivityLog } from "../models/ActivityLog.js";
import { uploadImageBuffer } from "../services/uploadService.js";
import { delCachePattern } from "../config/redis.js";

const paidPlans = ["pro", "business"] as const;
type PaidPlan = (typeof paidPlans)[number];

const normalize = (value: unknown) => String(value || "").trim();

const validatePaidPlan = (plan: unknown, res: Response) => {
  const normalizedPlan = normalize(plan).toLowerCase();
  if (!paidPlans.includes(normalizedPlan as PaidPlan)) {
    res.status(400).json({ message: "Select a valid upgrade plan (Pro or Business)" });
    return null;
  }
  return normalizedPlan as PaidPlan;
};

// GET /api/billing/methods
export const getPaymentMethods = async (_req: Request, res: Response): Promise<void> => {
  try {
    const settings = await SiteSettings.findOne({});
    const paymentMethods = settings?.paymentMethods || defaultPaymentMethods;
    const plans = settings?.plans || defaultPlans;

    res.json({
      paymentMethods,
      plans,
      currency: "PKR",
    });
  } catch (error: any) {
    res.status(500).json({ message: error?.message || "Server error fetching payment methods" });
  }
};

// POST /api/billing/submit-payment
// Authenticated user submits proof screenshot + transaction ID
export const submitPaymentProof = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      targetPlan,
      paymentMethod,
      transactionId,
      amount,
      senderAccountTitle,
      senderAccountNumber,
      billingCycle = "monthly",
    } = req.body;

    const validatedPlan = validatePaidPlan(targetPlan, res);
    if (!validatedPlan) return;

    if (!paymentMethod) {
      res.status(400).json({ message: "Please select a payment method (Easypaisa, JazzCash, Bank Transfer, SadaPay, etc.)" });
      return;
    }

    if (!transactionId || !transactionId.trim()) {
      res.status(400).json({ message: "Transaction ID / Reference Number is required" });
      return;
    }

    let screenshotUrl = "";
    let screenshotPublicId = "";

    // 1. From Multer file upload
    if (req.file) {
      const uploadResult = await uploadImageBuffer(
        req.file.buffer,
        req.file.mimetype,
        "metscheduler/payments",
      );
      screenshotUrl = uploadResult.url;
      screenshotPublicId = uploadResult.publicId || "";
    } else if (req.body.proofScreenshotUrl) {
      // 2. From pre-uploaded URL or base64 string
      screenshotUrl = req.body.proofScreenshotUrl.trim();
    }

    if (!screenshotUrl) {
      res.status(400).json({
        message: "Payment screenshot/receipt is required. Please upload proof of payment.",
      });
      return;
    }

    // Check for duplicate pending transaction ID
    const existingTx = await PaymentRequest.findOne({
      transactionId: transactionId.trim(),
      status: { $in: ["pending", "approved"] },
    });
    if (existingTx) {
      res.status(400).json({
        message: "This Transaction ID has already been submitted or approved. Please verify your receipt.",
      });
      return;
    }

    const parsedAmount = Number(amount) || (validatedPlan === "pro" ? 2500 : 6500);

    const paymentRequest = await PaymentRequest.create({
      user: req.user._id,
      userName: req.user.name,
      userEmail: req.user.email,
      targetPlan: validatedPlan,
      billingCycle,
      amount: parsedAmount,
      currency: "PKR",
      paymentMethod,
      senderAccountTitle: normalize(senderAccountTitle),
      senderAccountNumber: normalize(senderAccountNumber),
      transactionId: transactionId.trim(),
      proofScreenshotUrl: screenshotUrl,
      proofScreenshotPublicId: screenshotPublicId,
      status: "pending",
    });

    // Mark user status as payment_pending
    await User.findByIdAndUpdate(req.user._id, {
      billingStatus: "payment_pending",
    });

    await ActivityLog.create({
      user: req.user._id,
      actionType: "PAYMENT_SUBMITTED",
      description: `Submitted payment proof for ${validatedPlan.toUpperCase()} plan via ${paymentMethod}. TID: ${transactionId.trim()}`,
    });

    await delCachePattern("cache:*");

    res.status(201).json({
      success: true,
      message:
        "Payment screenshot submitted successfully! Your upgrade will be activated once verified by admin.",
      paymentRequest,
    });
  } catch (error: any) {
    res.status(500).json({ message: error?.message || "Failed to submit payment proof" });
  }
};

// GET /api/billing/my-payments
export const getMyPayments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const payments = await PaymentRequest.find({ user: req.user._id }).sort({
      createdAt: -1,
    });
    res.json(payments);
  } catch (error: any) {
    res.status(500).json({ message: error?.message || "Server error" });
  }
};

// GET /api/billing/invoices
export const getMyInvoices = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const invoices = await Invoice.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(invoices);
  } catch (error: any) {
    res.status(500).json({ message: error?.message || "Server error fetching invoices" });
  }
};

// GET /api/billing/invoices/:id
export const getInvoiceById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const invoiceId = String(req.params.id || "").trim();
    // Allow fetching by Mongo ID or unique invoiceNumber
    const query: any = invoiceId.startsWith("INV-")
      ? { invoiceNumber: invoiceId }
      : { _id: invoiceId };

    const invoice: any = await Invoice.findOne(query)
      .populate("user", "name email plan")
      .populate("paymentRequest");

    if (!invoice) {
      res.status(404).json({ message: "Invoice not found" });
      return;
    }

    // Must be owner or admin
    const ownerId = invoice.user?._id ? invoice.user._id.toString() : String(invoice.user);
    if (ownerId !== req.user._id.toString() && req.user.role !== "admin") {
      res.status(403).json({ message: "Unauthorized to view this invoice" });
      return;
    }

    res.json(invoice);
  } catch (error: any) {
    res.status(500).json({ message: error?.message || "Server error fetching invoice" });
  }
};

// Legacy inquiry fallback
export const contactVendor = async (req: AuthRequest, res: Response): Promise<void> => {
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
      message: "Upgrade inquiry sent. Vendor will contact you directly.",
      inquiry,
    });
  } catch (error: any) {
    res.status(500).json({ message: error?.message || "Server error" });
  }
};

export const publicContactVendor = async (req: Request, res: Response): Promise<void> => {
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
      message: "Contact request sent. We will contact you directly.",
      inquiry,
    });
  } catch (error: any) {
    res.status(500).json({ message: error?.message || "Server error" });
  }
};
