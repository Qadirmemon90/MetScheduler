import { PlanInquiry } from "../models/PlanInquiry.js";
import { User } from "../models/user.js";
const paidPlans = ["pro", "business"];
const normalize = (value) => String(value || "").trim();
const validatePaidPlan = (plan, res) => {
    const normalizedPlan = normalize(plan).toLowerCase();
    if (!paidPlans.includes(normalizedPlan)) {
        res.status(400).json({ message: "Select a valid upgrade plan" });
        return null;
    }
    return normalizedPlan;
};
export const contactVendor = async (req, res) => {
    try {
        const { plan, message, phone, company } = req.body;
        const selectedPlan = validatePaidPlan(plan, res);
        if (!selectedPlan)
            return;
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
    }
    catch (error) {
        res.status(500).json({ message: error?.message || "Server error" });
    }
};
export const publicContactVendor = async (req, res) => {
    try {
        const { plan, name, email, phone, company, message } = req.body;
        const selectedPlan = validatePaidPlan(plan, res);
        if (!selectedPlan)
            return;
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
    }
    catch (error) {
        res.status(500).json({ message: error?.message || "Server error" });
    }
};
