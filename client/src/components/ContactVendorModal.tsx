/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useState } from "react";
import { Building2Icon, MailIcon, PhoneIcon, SendIcon, XIcon } from "lucide-react";
import toast from "react-hot-toast";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { useSiteSettings } from "../context/SiteSettingsContext";
import { paidPlanIds } from "../data/plans";
import type { PlanId } from "../data/plans";

type ContactVendorModalProps = {
  isOpen: boolean;
  defaultPlan?: PlanId;
  onClose: () => void;
};

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-red-300 focus:bg-white";
const labelClass = "text-[11px] font-medium uppercase tracking-wide text-slate-500";

export default function ContactVendorModal({
  isOpen,
  defaultPlan = "pro",
  onClose,
}: ContactVendorModalProps) {
  const { user, refreshUser, isAuthenticated } = useAuth();
  const { plans, settings } = useSiteSettings();
  const paidPlans = useMemo(
    () => plans.filter((plan) => paidPlanIds.includes(plan.id)),
    [plans],
  );

  const [plan, setPlan] = useState<PlanId>(
    paidPlanIds.includes(defaultPlan) ? defaultPlan : "pro",
  );
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setPlan(paidPlanIds.includes(defaultPlan) ? defaultPlan : "pro");
    setName(user?.name || "");
    setEmail(user?.email || "");
  }, [defaultPlan, isOpen, user?.email, user?.name]);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const payload = { plan, name, email, phone, company, message };
      const endpoint = isAuthenticated
        ? "/api/billing/contact-vendor"
        : "/api/billing/public-contact-vendor";

      await api.post(endpoint, payload);
      if (isAuthenticated) await refreshUser();
      toast.success("Vendor request sent");
      setPhone("");
      setCompany("");
      setMessage("");
      onClose();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to contact vendor");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/50 px-4 py-6 backdrop-blur-sm">
      <div className="w-full max-w-2xl overflow-hidden rounded-lg border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Contact Vendor</h2>
            <p className="mt-1 text-sm text-slate-500">
              Share your contact details and the vendor will follow up directly.
            </p>
          </div>
          <button
            onClick={onClose}
            className="inline-flex size-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-50"
            aria-label="Close"
          >
            <XIcon className="size-4" />
          </button>
        </div>

        <div className="space-y-4 px-5 py-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className={labelClass}>Plan</span>
              <select
                value={plan}
                onChange={(event) => setPlan(event.target.value as PlanId)}
                className={inputClass}
              >
                {paidPlans.map((pricingPlan) => (
                  <option key={pricingPlan.id} value={pricingPlan.id}>
                    {pricingPlan.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-2">
              <span className={labelClass}>Company</span>
              <div className="relative">
                <Building2Icon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={company}
                  onChange={(event) => setCompany(event.target.value)}
                  placeholder="Company or brand name"
                  className={`${inputClass} pl-9`}
                />
              </div>
            </label>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className={labelClass}>Name</span>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                disabled={isAuthenticated}
                placeholder="Your name"
                className={inputClass}
              />
            </label>
            <label className="space-y-2">
              <span className={labelClass}>Email</span>
              <div className="relative">
                <MailIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  disabled={isAuthenticated}
                  placeholder="you@example.com"
                  className={`${inputClass} pl-9`}
                />
              </div>
            </label>
          </div>

          <label className="space-y-2">
            <span className={labelClass}>Phone / WhatsApp</span>
            <div className="relative">
              <PhoneIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <input
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="+92 300 0000000"
                className={`${inputClass} pl-9`}
              />
            </div>
          </label>

          <label className="space-y-2">
            <span className={labelClass}>Requirement</span>
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              rows={4}
              placeholder="Tell us your pages, posting volume, team size, and any special requirement."
              className={`${inputClass} resize-none`}
            />
          </label>

          {(settings.vendorEmail || settings.vendorPhone) && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
              Vendor contact: {[settings.vendorEmail, settings.vendorPhone]
                .filter(Boolean)
                .join(" · ")}
            </div>
          )}
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row sm:justify-end">
          <button
            onClick={onClose}
            className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-red-500 px-5 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-60"
          >
            <SendIcon className="size-4" />
            {submitting ? "Sending..." : "Send Request"}
          </button>
        </div>
      </div>
    </div>
  );
}
