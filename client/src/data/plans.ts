export type PlanId = "free" | "pro" | "business";

export type PricingPlan = {
  id: PlanId;
  name: string;
  price: string;
  period?: string;
  description: string;
  features: string[];
  cta: string;
  highlight?: boolean;
  enabled?: boolean;
};

export const defaultPricingPlans: PricingPlan[] = [
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
    price: "$25",
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
    price: "$50",
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

export const paidPlanIds: PlanId[] = ["pro", "business"];
