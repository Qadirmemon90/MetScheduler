/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import {
  EyeIcon,
  FileTextIcon,
  Loader2Icon,
  SaveIcon,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../api/axios";
import { useSiteSettings } from "../../context/SiteSettingsContext";

type PolicyKey = "privacyPolicy" | "termsOfService" | "refundPolicy" | "cookiePolicy";

export default function AdminPolicies() {
  const { refreshSettings } = useSiteSettings();
  const [activeTab, setActiveTab] = useState<PolicyKey>("privacyPolicy");
  const [policies, setPolicies] = useState<Record<PolicyKey, string>>({
    privacyPolicy: "",
    termsOfService: "",
    refundPolicy: "",
    cookiePolicy: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/api/admin/settings");
      if (data?.policies) {
        setPolicies({
          privacyPolicy: data.policies.privacyPolicy || "",
          termsOfService: data.policies.termsOfService || "",
          refundPolicy: data.policies.refundPolicy || "",
          cookiePolicy: data.policies.cookiePolicy || "",
        });
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to load policies");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put("/api/admin/settings", { policies });
      await refreshSettings();
      toast.success("Policies saved & cache updated!");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to save policies");
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: "privacyPolicy", label: "Privacy Policy", path: "/privacy" },
    { id: "termsOfService", label: "Terms of Service", path: "/terms" },
    { id: "refundPolicy", label: "Refund Policy", path: "/refund" },
    { id: "cookiePolicy", label: "Cookie Policy", path: "/cookies" },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FileTextIcon className="size-5 text-red-500" />
            Website Policies & Legal Documents
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Edit your Privacy Policy, Terms, Refund, and Cookie policies shown on public footer links
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition border border-slate-700"
          >
            <EyeIcon className="size-3.5" />
            {showPreview ? "Hide Preview" : "Live Preview"}
          </button>

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
            Save Policies
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as PolicyKey)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
              activeTab === tab.id
                ? "bg-red-500/15 text-red-400 border border-red-500/30 shadow-xs"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-20 text-center">
          <Loader2Icon className="size-8 text-red-500 animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-400">Loading policy content...</p>
        </div>
      ) : (
        <div className={`grid gap-6 ${showPreview ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1"}`}>
          {/* Editor */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-semibold text-slate-300">
                Editing: <span className="text-red-400 uppercase font-mono">{activeTab}</span>
              </span>
              <span className="text-[11px] text-slate-500">Supports Markdown (# Heading, **, - lists)</span>
            </div>

            <textarea
              rows={20}
              value={policies[activeTab] || ""}
              onChange={(e) =>
                setPolicies((prev) => ({ ...prev, [activeTab]: e.target.value }))
              }
              placeholder="Write your policy in Markdown format here..."
              className="w-full text-xs font-mono bg-slate-950 border border-slate-800 rounded-xl p-4 text-slate-200 outline-none focus:border-red-500 leading-relaxed"
            />
          </div>

          {/* Preview */}
          {showPreview && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 max-h-[600px] overflow-y-auto">
              <div className="pb-3 border-b border-slate-800 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase">
                  Live Public Preview
                </span>
                <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded">
                  Formatted
                </span>
              </div>

              <div className="prose prose-invert prose-sm max-w-none text-slate-300 whitespace-pre-wrap leading-relaxed">
                {policies[activeTab] || <span className="text-slate-600 italic">No content written yet.</span>}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
