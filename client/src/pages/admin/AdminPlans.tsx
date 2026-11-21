/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import {
  CreditCardIcon,
  Loader2Icon,
  PlusIcon,
  SaveIcon,
  SparklesIcon,
  Trash2Icon,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../api/axios";
import { useSiteSettings } from "../../context/SiteSettingsContext";
import { defaultPricingPlans } from "../../data/plans";

export default function AdminPlans() {
  const { refreshSettings } = useSiteSettings();
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/api/admin/settings");
      const existingPlans = Array.isArray(data?.plans) ? data.plans : [];
      const mergedPlans = defaultPricingPlans.map((fallback) => ({
        ...fallback,
        ...(existingPlans.find((p: any) => p.id === fallback.id) || {}),
        id: fallback.id,
      }));
      setPlans(mergedPlans);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to load pricing settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const updatePlanField = (index: number, field: string, val: any) => {
    setPlans((prev) =>
      prev.map((p, i) => (i === index ? { ...p, [field]: val } : p)),
    );
  };

  const handleAddFeature = (planIndex: number) => {
    setPlans((prev) =>
      prev.map((p, i) =>
        i === planIndex ? { ...p, features: [...(p.features || []), "New Feature"] } : p,
      ),
    );
  };

  const handleRemoveFeature = (planIndex: number, featureIndex: number) => {
    setPlans((prev) =>
      prev.map((p, i) =>
        i === planIndex
          ? { ...p, features: p.features.filter((_: any, fi: number) => fi !== featureIndex) }
          : p,
      ),
    );
  };

  const handleFeatureChange = (planIndex: number, featureIndex: number, val: string) => {
    setPlans((prev) =>
      prev.map((p, i) =>
        i === planIndex
          ? {
              ...p,
              features: p.features.map((f: string, fi: number) =>
                fi === featureIndex ? val : f,
              ),
            }
          : p,
      ),
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put("/api/admin/settings", { plans });
      await refreshSettings();
      toast.success("Pricing plans saved & cache updated!");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to save plans");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <CreditCardIcon className="size-5 text-red-500" />
            Pricing & Membership Plans Management
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Customize package names, PKR prices, features, CTA buttons, and highlighted tiers
            displayed on the public website.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving || loading}
          className="px-5 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-red-500/20 flex items-center gap-2 transition disabled:opacity-50"
        >
          {saving ? (
            <Loader2Icon className="size-4 animate-spin" />
          ) : (
            <SaveIcon className="size-4" />
          )}
          Save All Plans
        </button>
      </div>

      {loading ? (
        <div className="py-20 text-center">
          <Loader2Icon className="size-8 text-red-500 animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-400">Loading plan configurations...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan, planIdx) => (
            <div
              key={plan.id}
              className={`bg-slate-900 border rounded-2xl p-5 space-y-4 flex flex-col justify-between ${
                plan.highlight
                  ? "border-red-500/50 shadow-xl shadow-red-500/10 ring-1 ring-red-500/20"
                  : "border-slate-800"
              }`}
            >
              <div className="space-y-4">
                {/* Plan Header & Toggle */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-red-400 uppercase">
                      [{plan.id}]
                    </span>
                    <input
                      type="text"
                      value={plan.name}
                      onChange={(e) => updatePlanField(planIdx, "name", e.target.value)}
                      className="text-sm font-bold bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-white outline-none focus:border-red-500"
                    />
                  </div>

                  <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-slate-400">
                    <input
                      type="checkbox"
                      checked={plan.enabled !== false}
                      onChange={(e) => updatePlanField(planIdx, "enabled", e.target.checked)}
                      className="rounded accent-red-500"
                    />
                    <span>Active</span>
                  </label>
                </div>

                {/* Price & Period */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-semibold uppercase text-slate-400 block mb-1">
                      Price (PKR or $)
                    </label>
                    <input
                      type="text"
                      value={plan.price}
                      onChange={(e) => updatePlanField(planIdx, "price", e.target.value)}
                      className="w-full text-xs font-bold bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-emerald-400 outline-none focus:border-red-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold uppercase text-slate-400 block mb-1">
                      Billing Period
                    </label>
                    <input
                      type="text"
                      value={plan.period || ""}
                      placeholder="/month"
                      onChange={(e) => updatePlanField(planIdx, "period", e.target.value)}
                      className="w-full text-xs bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-300 outline-none focus:border-red-500"
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="text-[10px] font-semibold uppercase text-slate-400 block mb-1">
                    Short Description
                  </label>
                  <textarea
                    rows={2}
                    value={plan.description || ""}
                    onChange={(e) => updatePlanField(planIdx, "description", e.target.value)}
                    className="w-full text-xs bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-slate-300 outline-none focus:border-red-500"
                  />
                </div>

                {/* Features List */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[10px] font-semibold uppercase text-slate-400">
                      Features List
                    </label>
                    <button
                      type="button"
                      onClick={() => handleAddFeature(planIdx)}
                      className="text-[10px] text-red-400 hover:text-red-300 flex items-center gap-1 font-semibold"
                    >
                      <PlusIcon className="size-3" /> Add Feature
                    </button>
                  </div>

                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 scrollbar-thin">
                    {(plan.features || []).map((feat: string, featIdx: number) => (
                      <div key={featIdx} className="flex items-center gap-1.5">
                        <input
                          type="text"
                          value={feat}
                          onChange={(e) =>
                            handleFeatureChange(planIdx, featIdx, e.target.value)
                          }
                          className="flex-1 text-xs bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-200 outline-none focus:border-red-500"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveFeature(planIdx, featIdx)}
                          className="p-1 text-slate-500 hover:text-red-400 rounded transition"
                        >
                          <Trash2Icon className="size-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Highlight Checkbox */}
                <div className="pt-2 border-t border-slate-800">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                    <input
                      type="checkbox"
                      checked={Boolean(plan.highlight)}
                      onChange={(e) => updatePlanField(planIdx, "highlight", e.target.checked)}
                      className="rounded accent-red-500"
                    />
                    <span className="flex items-center gap-1 font-medium">
                      <SparklesIcon className="size-3 text-amber-400" />
                      Highlight as "Most Popular"
                    </span>
                  </label>
                </div>
              </div>

              {/* CTA Label */}
              <div>
                <label className="text-[10px] font-semibold uppercase text-slate-400 block mb-1">
                  CTA Button Text
                </label>
                <input
                  type="text"
                  value={plan.cta || ""}
                  placeholder="e.g. Upgrade Now"
                  onChange={(e) => updatePlanField(planIdx, "cta", e.target.value)}
                  className="w-full text-xs bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200 outline-none focus:border-red-500"
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
