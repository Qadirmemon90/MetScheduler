import mongoose from "mongoose";
export const defaultPlans = [
    {
        id: "free",
        name: "Free",
        price: "PKR 0",
        period: "/month",
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
        price: "PKR 2,500",
        period: "/month",
        description: "For growing creators and professionals who need unlimited scheduling and high AI speed.",
        features: [
            "Unlimited scheduled posts",
            "10 social accounts",
            "Priority AI credits (100/mo)",
            "Advanced analytics & insights",
            "Dedicated MCP ChatGPT integration",
            "Fast WhatsApp / Email support",
        ],
        cta: "Upgrade with Easypaisa/Bank",
        highlight: true,
        enabled: true,
    },
    {
        id: "business",
        name: "Business",
        price: "PKR 6,500",
        period: "/month",
        description: "For agencies and businesses managing multiple client brands at scale.",
        features: [
            "Everything in Pro",
            "Unlimited social accounts",
            "Unlimited AI credits",
            "Team collaboration & multi-role",
            "Full API & MCP access",
            "Dedicated account manager",
        ],
        cta: "Upgrade with Easypaisa/Bank",
        highlight: false,
        enabled: true,
    },
];
export const defaultPaymentMethods = {
    easypaisa: {
        enabled: true,
        accountTitle: "MetScheduler Payments",
        accountNumber: "0300-1234567",
        instructions: "1. Open Easypaisa app and choose 'Send Money'.\n2. Enter our Easypaisa Mobile Number.\n3. Enter the exact plan amount in PKR.\n4. Take a clear screenshot of the successful payment receipt showing Transaction ID.\n5. Upload the screenshot below.",
        qrCodeUrl: "",
    },
    jazzcash: {
        enabled: true,
        accountTitle: "MetScheduler Payments",
        accountNumber: "0300-7654321",
        instructions: "1. Open JazzCash App or dial *786#.\n2. Transfer the plan amount to the JazzCash mobile number.\n3. Take a screenshot showing the TID / Transaction ID.\n4. Upload the screenshot below.",
        qrCodeUrl: "",
    },
    bankTransfer: {
        enabled: true,
        bankName: "Meezan Bank Limited",
        accountTitle: "MetScheduler Digital Solutions",
        accountNumber: "01020304050607",
        iban: "PK12MEZN0001020304050607",
        branchCode: "0102",
        instructions: "1. Transfer via your banking app (Meezan, HBL, Bank Alfalah, etc.) using IBAN or Account Number.\n2. Save the transaction receipt / PDF screenshot.\n3. Enter the Reference / Transaction ID and upload the proof below.",
    },
    sadapay: {
        enabled: true,
        accountTitle: "MetScheduler Tech",
        accountNumber: "0312-3456789",
        instructions: "1. Open SadaPay app -> Send Money -> SadaPay.\n2. Enter the phone number and confirm Account Title.\n3. Take a screenshot of the completed transfer.\n4. Upload the proof below.",
    },
    nayapay: {
        enabled: true,
        accountTitle: "MetScheduler Tech",
        accountNumber: "0312-9876543",
        instructions: "1. Open NayaPay app -> Send Money.\n2. Transfer the plan amount and upload proof below.",
    },
};
export const defaultPolicies = {
    privacyPolicy: `# Privacy Policy\n\n**Last Updated: November 2026**\n\nAt MetScheduler, we take your privacy very seriously. We collect only the information necessary to provide and improve our social media scheduling, AI generation, and account management services.\n\n### 1. Information We Collect\n- **Account Information:** Name, email, and authentication credentials.\n- **Social Media Content:** Scheduled posts, media files, and publish times.\n- **Payment Proofs:** Screenshots and transaction IDs submitted for plan upgrades.\n\n### 2. How We Protect Your Data\nAll sensitive tokens, secrets, and credentials are encrypted. We never sell your personal data to third parties.`,
    termsOfService: `# Terms of Service\n\n**Last Updated: November 2026**\n\nBy accessing or using MetScheduler, you agree to comply with and be bound by these terms.\n\n### 1. User Responsibilities\n- You are responsible for maintaining the confidentiality of your account credentials.\n- You agree not to use the service for spamming, abusive content, or illegal activities.\n\n### 2. Manual Payment & Verification\n- Plan upgrades via Pakistani payment methods (Easypaisa, JazzCash, Bank Transfer) require manual verification by our administrative team.\n- Uploaded transaction proofs must be authentic. Falsified screenshots will result in immediate account termination.`,
    refundPolicy: `# Refund Policy\n\n**Last Updated: November 2026**\n\nWe strive for 100% customer satisfaction. If you experience technical issues that prevent you from using MetScheduler:\n\n- Refund requests submitted within **7 days** of plan activation will be reviewed by our finance team.\n- Verified refunds will be returned via the original payment method (Easypaisa/JazzCash/Bank Account) within 3-5 business days.`,
    cookiePolicy: `# Cookie Policy\n\nMetScheduler uses essential cookies and local storage tokens strictly to maintain your authenticated session and application preferences.`,
};
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
    siteName: { type: String, default: "MetScheduler" },
    tagline: {
        type: String,
        default: "AI-Powered Social Media Scheduler & Content Engine",
    },
    googleAnalyticsEnabled: { type: Boolean, default: false },
    googleAnalyticsMeasurementId: { type: String, default: "" },
    maintenanceMode: { type: Boolean, default: false },
    vendorName: { type: String, default: "MetScheduler Team" },
    vendorEmail: { type: String, default: "support@metscheduler.com" },
    vendorPhone: { type: String, default: "+92 300 1234567" },
    vendorWhatsapp: { type: String, default: "+92 300 1234567" },
    supportEmail: { type: String, default: "support@metscheduler.com" },
    publicApiNote: {
        type: String,
        default: "Only public tracking IDs and contact details should be stored here. Secret API keys belong in server .env.",
    },
    plans: { type: [planSchema], default: () => defaultPlans },
    paymentMethods: {
        type: mongoose.Schema.Types.Mixed,
        default: () => defaultPaymentMethods,
    },
    policies: {
        type: mongoose.Schema.Types.Mixed,
        default: () => defaultPolicies,
    },
}, { timestamps: true });
export const SiteSettings = mongoose.model("SiteSettings", siteSettingsSchema);
