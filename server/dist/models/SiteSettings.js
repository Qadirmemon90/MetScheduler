import mongoose from "mongoose";
export const defaultPlans = [
    {
        id: "free",
        name: "Free",
        price: "$0",
        period: "",
        description: "Perfect for creators getting started with social media automation.",
        features: [
            "2 social accounts",
            "10 scheduled posts/month",
            "AI content (5 credits/month)",
            "Basic dashboard",
        ],
        cta: "Get Started Free",
        highlight: false,
        enabled: true,
    },
    {
        id: "pro",
        name: "Pro",
        price: "Vendor quote",
        period: "",
        description: "For growing brands that need more automation and faster support.",
        features: [
            "Unlimited scheduled posts",
            "Priority AI credits",
            "Advanced analytics",
            "Faster support",
        ],
        cta: "Contact Vendor",
        highlight: true,
        enabled: true,
    },
    {
        id: "business",
        name: "Business",
        price: "Vendor quote",
        period: "",
        description: "For teams and agencies managing multiple brands at scale.",
        features: [
            "Team workflow",
            "Admin controls",
            "Custom onboarding",
            "Dedicated vendor support",
        ],
        cta: "Contact Vendor",
        highlight: false,
        enabled: true,
    },
];
const planSchema = new mongoose.Schema({
    id: {
        type: String,
        enum: ["free", "pro", "business"],
        required: true,
    },
    name: { type: String, required: true },
    price: { type: String, required: true },
    period: { type: String, default: "" },
    description: { type: String, default: "" },
    features: [{ type: String }],
    cta: { type: String, default: "" },
    highlight: { type: Boolean, default: false },
    enabled: { type: Boolean, default: true },
}, { _id: false });
const siteSettingsSchema = new mongoose.Schema({
    googleAnalyticsEnabled: { type: Boolean, default: false },
    googleAnalyticsMeasurementId: { type: String, default: "" },
    vendorName: { type: String, default: "Vendor Team" },
    vendorEmail: { type: String, default: "" },
    vendorPhone: { type: String, default: "" },
    vendorWhatsapp: { type: String, default: "" },
    supportEmail: { type: String, default: "" },
    publicApiNote: {
        type: String,
        default: "Only public tracking IDs should be stored here. Keep secret API keys in server .env.",
    },
    plans: { type: [planSchema], default: () => defaultPlans },
}, { timestamps: true });
export const SiteSettings = mongoose.model("SiteSettings", siteSettingsSchema);
