import { useState } from "react";
import { CheckIcon, CircleCheckBigIcon, SparklesIcon } from "lucide-react";
import { Link } from "react-router-dom";
import ContactVendorModal from "../ContactVendorModal";
import PakistaniPaymentModal from "../PakistaniPaymentModal";
import { useSiteSettings } from "../../context/SiteSettingsContext";
import { useAuth } from "../../context/AuthContext";
import { paidPlanIds } from "../../data/plans";
import type { PlanId } from "../../data/plans";

export default function Pricing() {
    const { plans } = useSiteSettings();
    const { isAuthenticated } = useAuth();
    const [contactPlan, setContactPlan] = useState<PlanId>("pro");
    const [isContactOpen, setIsContactOpen] = useState(false);
    const [isPaymentOpen, setIsPaymentOpen] = useState(false);

    const handlePlanAction = (planId: PlanId) => {
        setContactPlan(planId);
        if (isAuthenticated) {
            setIsPaymentOpen(true);
        } else {
            setIsContactOpen(true);
        }
    };

    return (
        <section id="pricing" className="py-24 bg-white">
            <div className="max-w-6xl mx-auto px-4 sm:px-6">
                <div className="text-center mb-16">
                    <div className="mb-6 inline-flex items-center gap-1.5 bg-red-500/10 border border-red-500/15 text-red-500 text-[11px] font-medium tracking-[0.06em] uppercase px-3.5 py-1.5 rounded-full">
                        <CircleCheckBigIcon className="size-3" />
                        Simple & Transparent Pricing
                    </div>
                    <h2 className="font-serif font-medium text-4xl sm:text-5xl leading-tight text-gray-900">
                        Plans for every stage
                        <br />
                        <span className="text-red-400 italic">of growth</span>
                    </h2>
                    <p className="mt-5 text-gray-500 max-w-md mx-auto text-sm">
                        Start free, upgrade anytime with Easypaisa, JazzCash, or Bank Transfer.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
                    {plans.map((plan) => (
                        <div
                            key={plan.id}
                            className={`rounded-2xl border p-7 flex flex-col gap-6 relative transition-all ${
                                plan.highlight
                                    ? "bg-red-500 text-white border-red-400 shadow-2xl shadow-red-200"
                                    : "bg-white text-slate-900 border-slate-200 shadow-sm"
                            }`}
                        >
                            {plan.highlight && (
                                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs font-bold px-3.5 py-1.5 rounded-full flex items-center gap-1 shadow-md">
                                    <SparklesIcon className="size-3 text-amber-300" />
                                    Most Popular
                                </div>
                            )}
                            <div>
                                <div className={`text-sm font-semibold mb-1 ${plan.highlight ? "text-red-100" : "text-red-500"}`}>
                                    {plan.name}
                                </div>
                                <div className="flex items-end gap-1">
                                    <span className="text-4xl font-extrabold">{plan.price}</span>
                                    <span className={`text-sm mb-1.5 ${plan.highlight ? "text-red-200" : "text-slate-400"}`}>
                                        {plan.period}
                                    </span>
                                </div>
                                <p className={`text-sm mt-2 leading-relaxed ${plan.highlight ? "text-red-100" : "text-slate-500"}`}>
                                    {plan.description}
                                </p>
                            </div>

                            <ul className="space-y-2.5">
                                {plan.features.map((feature) => (
                                    <li key={feature} className="flex items-center gap-2.5 text-sm">
                                        <div className={`size-4 rounded-full flex items-center justify-center shrink-0 ${plan.highlight ? "bg-red-400" : "bg-red-50"}`}>
                                            <CheckIcon className={`w-2.5 h-2.5 ${plan.highlight ? "text-white" : "text-red-500"}`} />
                                        </div>
                                        <span className={plan.highlight ? "text-red-50" : "text-slate-600"}>{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            {paidPlanIds.includes(plan.id) ? (
                                <button
                                    onClick={() => handlePlanAction(plan.id)}
                                    className={`mt-auto text-center font-semibold text-sm px-6 py-3 rounded-full transition ${
                                        plan.highlight
                                            ? "bg-white text-red-500 hover:bg-red-50 shadow-md"
                                            : "bg-red-500 text-white hover:bg-red-600"
                                    }`}
                                >
                                    {plan.cta || (isAuthenticated ? "Upgrade with Easypaisa/Bank" : "Get Started")}
                                </button>
                            ) : (
                                <Link
                                    to="/login"
                                    className={`mt-auto text-center font-semibold text-sm px-6 py-3 rounded-full transition ${
                                        plan.highlight
                                            ? "bg-white text-red-500 hover:bg-red-50 shadow-md"
                                            : "bg-red-500 text-white hover:bg-red-600"
                                    }`}
                                >
                                    {plan.cta || "Get Started Free"}
                                </Link>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Vendor Inquiry Modal (for logged-out visitors) */}
            <ContactVendorModal
                isOpen={isContactOpen}
                defaultPlan={contactPlan}
                onClose={() => setIsContactOpen(false)}
            />

            {/* Pakistani Manual Transfer Payment Modal (for authenticated users) */}
            <PakistaniPaymentModal
                isOpen={isPaymentOpen}
                defaultPlan={contactPlan === "business" ? "business" : "pro"}
                onClose={() => setIsPaymentOpen(false)}
            />
        </section>
    );
}
