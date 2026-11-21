/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import {
  KeyRoundIcon,
  Loader2Icon,
  SaveIcon,
  ShieldAlertIcon,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../api/axios";
import { useSiteSettings } from "../../context/SiteSettingsContext";

export default function AdminSiteSettings() {
  const { refreshSettings } = useSiteSettings();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<any>({
    siteName: "MetScheduler",
    tagline: "",
    supportEmail: "",
    vendorPhone: "",
    vendorWhatsapp: "",
    googleAnalyticsEnabled: false,
    googleAnalyticsMeasurementId: "",
    maintenanceMode: false,
    publicApiNote: "",
  });

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/api/admin/settings");
      setForm({
        siteName: data.siteName || "MetScheduler",
        tagline: data.tagline || "",
        supportEmail: data.supportEmail || "",
        vendorPhone: data.vendorPhone || "",
        vendorWhatsapp: data.vendorWhatsapp || "",
        googleAnalyticsEnabled: Boolean(data.googleAnalyticsEnabled),
        googleAnalyticsMeasurementId: data.googleAnalyticsMeasurementId || "",
        maintenanceMode: Boolean(data.maintenanceMode),
        publicApiNote: data.publicApiNote || "",
      });
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to load site settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleChange = (field: string, val: any) => {
    setForm((prev: any) => ({ ...prev, [field]: val }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put("/api/admin/settings", form);
      await refreshSettings();
      toast.success("Site settings updated & cached cleared!");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to save settings");
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
            <KeyRoundIcon className="size-5 text-red-500" />
            Website Branding & Global System Configuration
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            General website title, support contact channels, analytics tracking, and maintenance
            mode
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
          Save Settings
        </button>
      </div>

      {loading ? (
        <div className="py-20 text-center">
          <Loader2Icon className="size-8 text-red-500 animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-400">Loading settings...</p>
        </div>
      ) : (
        <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* General Branding */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-white pb-3 border-b border-slate-800">
              Site Identity & Branding
            </h3>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 font-medium block mb-1">
                  Website / Platform Name
                </label>
                <input
                  type="text"
                  value={form.siteName}
                  onChange={(e) => handleChange("siteName", e.target.value)}
                  className="w-full text-xs bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 font-medium block mb-1">
                  Tagline / Hero Headline
                </label>
                <input
                  type="text"
                  value={form.tagline}
                  onChange={(e) => handleChange("tagline", e.target.value)}
                  className="w-full text-xs bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 outline-none focus:border-red-500"
                />
              </div>

              <div className="pt-2 border-t border-slate-800">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={form.maintenanceMode}
                    onChange={(e) => handleChange("maintenanceMode", e.target.checked)}
                    className="rounded accent-red-500"
                  />
                  <span className="flex items-center gap-1 font-semibold text-amber-400">
                    <ShieldAlertIcon className="size-4" /> Enable Maintenance Mode
                  </span>
                </label>
                <p className="text-[11px] text-slate-500 mt-1 ml-6">
                  When enabled, shows maintenance notice to public visitors while allowing admins to log in.
                </p>
              </div>
            </div>
          </div>

          {/* Support & Contact */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-white pb-3 border-b border-slate-800">
              Support & Communication
            </h3>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 font-medium block mb-1">
                  Official Support Email
                </label>
                <input
                  type="email"
                  value={form.supportEmail}
                  onChange={(e) => handleChange("supportEmail", e.target.value)}
                  placeholder="support@metscheduler.com"
                  className="w-full text-xs bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 font-medium block mb-1">
                  Vendor Phone / Helpline
                </label>
                <input
                  type="text"
                  value={form.vendorPhone}
                  onChange={(e) => handleChange("vendorPhone", e.target.value)}
                  placeholder="+92 300 1234567"
                  className="w-full text-xs bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 font-medium block mb-1">
                  WhatsApp Support Number
                </label>
                <input
                  type="text"
                  value={form.vendorWhatsapp}
                  onChange={(e) => handleChange("vendorWhatsapp", e.target.value)}
                  placeholder="+92 300 1234567"
                  className="w-full text-xs bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 outline-none focus:border-red-500"
                />
              </div>
            </div>
          </div>

          {/* Google Analytics & SEO */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 md:col-span-2">
            <h3 className="text-sm font-bold text-white pb-3 border-b border-slate-800">
              Analytics & Tracking (Google Analytics 4)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300 mb-2">
                  <input
                    type="checkbox"
                    checked={form.googleAnalyticsEnabled}
                    onChange={(e) =>
                      handleChange("googleAnalyticsEnabled", e.target.checked)
                    }
                    className="rounded accent-red-500"
                  />
                  <span>Enable Google Analytics (gtag.js)</span>
                </label>

                <input
                  type="text"
                  placeholder="G-XXXXXXXXXX"
                  value={form.googleAnalyticsMeasurementId}
                  onChange={(e) =>
                    handleChange("googleAnalyticsMeasurementId", e.target.value)
                  }
                  className="w-full text-xs bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 font-medium block mb-1">
                  Public Configuration Notes
                </label>
                <textarea
                  rows={2}
                  value={form.publicApiNote}
                  onChange={(e) => handleChange("publicApiNote", e.target.value)}
                  placeholder="Public tracking notes..."
                  className="w-full text-xs bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-slate-300 outline-none focus:border-red-500"
                />
              </div>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
