/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import {
  LayersIcon,
  Loader2Icon,
  SaveIcon,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../api/axios";
import { useSiteSettings } from "../../context/SiteSettingsContext";

export default function AdminPaymentAccounts() {
  const { refreshSettings } = useSiteSettings();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<any>({
    easypaisa: {
      enabled: true,
      accountTitle: "",
      accountNumber: "",
      instructions: "",
    },
    jazzcash: {
      enabled: true,
      accountTitle: "",
      accountNumber: "",
      instructions: "",
    },
    bankTransfer: {
      enabled: true,
      bankName: "",
      accountTitle: "",
      accountNumber: "",
      iban: "",
      branchCode: "",
      instructions: "",
    },
    sadapay: {
      enabled: true,
      accountTitle: "",
      accountNumber: "",
      instructions: "",
    },
    nayapay: {
      enabled: true,
      accountTitle: "",
      accountNumber: "",
      instructions: "",
    },
  });

  const fetchMethods = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/api/admin/settings");
      if (data?.paymentMethods) {
        setPaymentMethods((prev: any) => ({
          ...prev,
          ...data.paymentMethods,
        }));
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to load payment accounts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMethods();
  }, []);

  const updateMethod = (key: string, field: string, val: any) => {
    setPaymentMethods((prev: any) => ({
      ...prev,
      [key]: {
        ...(prev[key] || {}),
        [field]: val,
      },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put("/api/admin/settings", { paymentMethods });
      await refreshSettings();
      toast.success("Pakistani payment accounts updated & cache flushed!");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to save payment accounts");
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
            <LayersIcon className="size-5 text-red-500" />
            Pakistani Payment Gateways & Bank Accounts
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Configure your Easypaisa, JazzCash, Meezan/HBL bank details shown to users during plan
            upgrade.
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
          Save Accounts
        </button>
      </div>

      {loading ? (
        <div className="py-20 text-center">
          <Loader2Icon className="size-8 text-red-500 animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-400">Loading accounts...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Easypaisa */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="size-3 rounded-full bg-emerald-500" />
                <h3 className="text-sm font-bold text-white">Easypaisa Mobile Account</h3>
              </div>
              <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={paymentMethods.easypaisa?.enabled !== false}
                  onChange={(e) => updateMethod("easypaisa", "enabled", e.target.checked)}
                  className="rounded accent-emerald-500"
                />
                Enabled
              </label>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 font-medium block mb-1">
                  Account Title
                </label>
                <input
                  type="text"
                  value={paymentMethods.easypaisa?.accountTitle || ""}
                  onChange={(e) => updateMethod("easypaisa", "accountTitle", e.target.value)}
                  placeholder="e.g. MetScheduler Finance"
                  className="w-full text-xs bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 font-medium block mb-1">
                  Easypaisa Mobile Number
                </label>
                <input
                  type="text"
                  value={paymentMethods.easypaisa?.accountNumber || ""}
                  onChange={(e) => updateMethod("easypaisa", "accountNumber", e.target.value)}
                  placeholder="e.g. 0300-1234567"
                  className="w-full text-xs font-mono bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 font-medium block mb-1">
                  Payment Instructions
                </label>
                <textarea
                  rows={3}
                  value={paymentMethods.easypaisa?.instructions || ""}
                  onChange={(e) => updateMethod("easypaisa", "instructions", e.target.value)}
                  placeholder="Instructions for customer..."
                  className="w-full text-xs bg-slate-800 border border-slate-700 rounded-xl p-3 text-slate-300 outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* JazzCash */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="size-3 rounded-full bg-amber-500" />
                <h3 className="text-sm font-bold text-white">JazzCash Mobile Account</h3>
              </div>
              <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={paymentMethods.jazzcash?.enabled !== false}
                  onChange={(e) => updateMethod("jazzcash", "enabled", e.target.checked)}
                  className="rounded accent-amber-500"
                />
                Enabled
              </label>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 font-medium block mb-1">
                  Account Title
                </label>
                <input
                  type="text"
                  value={paymentMethods.jazzcash?.accountTitle || ""}
                  onChange={(e) => updateMethod("jazzcash", "accountTitle", e.target.value)}
                  placeholder="e.g. MetScheduler Finance"
                  className="w-full text-xs bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 font-medium block mb-1">
                  JazzCash Mobile Number
                </label>
                <input
                  type="text"
                  value={paymentMethods.jazzcash?.accountNumber || ""}
                  onChange={(e) => updateMethod("jazzcash", "accountNumber", e.target.value)}
                  placeholder="e.g. 0300-7654321"
                  className="w-full text-xs font-mono bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 font-medium block mb-1">
                  Payment Instructions
                </label>
                <textarea
                  rows={3}
                  value={paymentMethods.jazzcash?.instructions || ""}
                  onChange={(e) => updateMethod("jazzcash", "instructions", e.target.value)}
                  placeholder="Instructions for customer..."
                  className="w-full text-xs bg-slate-800 border border-slate-700 rounded-xl p-3 text-slate-300 outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </div>

          {/* Bank Transfer (Full Width) */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 md:col-span-2">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="size-3 rounded-full bg-blue-500" />
                <h3 className="text-sm font-bold text-white">Bank Account Transfer (Meezan / HBL / Alfalah)</h3>
              </div>
              <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={paymentMethods.bankTransfer?.enabled !== false}
                  onChange={(e) => updateMethod("bankTransfer", "enabled", e.target.checked)}
                  className="rounded accent-blue-500"
                />
                Enabled
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 font-medium block mb-1">
                  Bank Name
                </label>
                <input
                  type="text"
                  value={paymentMethods.bankTransfer?.bankName || ""}
                  onChange={(e) => updateMethod("bankTransfer", "bankName", e.target.value)}
                  placeholder="e.g. Meezan Bank Limited"
                  className="w-full text-xs bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 font-medium block mb-1">
                  Account Title
                </label>
                <input
                  type="text"
                  value={paymentMethods.bankTransfer?.accountTitle || ""}
                  onChange={(e) => updateMethod("bankTransfer", "accountTitle", e.target.value)}
                  placeholder="e.g. MetScheduler Digital Solutions"
                  className="w-full text-xs bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 font-medium block mb-1">
                  Account Number
                </label>
                <input
                  type="text"
                  value={paymentMethods.bankTransfer?.accountNumber || ""}
                  onChange={(e) => updateMethod("bankTransfer", "accountNumber", e.target.value)}
                  placeholder="e.g. 01020304050607"
                  className="w-full text-xs font-mono bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 font-medium block mb-1">
                  IBAN Number (24 characters)
                </label>
                <input
                  type="text"
                  value={paymentMethods.bankTransfer?.iban || ""}
                  onChange={(e) => updateMethod("bankTransfer", "iban", e.target.value)}
                  placeholder="e.g. PK12MEZN0001020304050607"
                  className="w-full text-xs font-mono bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-400 font-medium block mb-1">
                Bank Transfer Instructions
              </label>
              <textarea
                rows={2}
                value={paymentMethods.bankTransfer?.instructions || ""}
                onChange={(e) => updateMethod("bankTransfer", "instructions", e.target.value)}
                placeholder="Instructions for bank transfer..."
                className="w-full text-xs bg-slate-800 border border-slate-700 rounded-xl p-3 text-slate-300 outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* SadaPay / NayaPay */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="size-3 rounded-full bg-teal-500" />
                <h3 className="text-sm font-bold text-white">SadaPay Account</h3>
              </div>
              <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={paymentMethods.sadapay?.enabled !== false}
                  onChange={(e) => updateMethod("sadapay", "enabled", e.target.checked)}
                  className="rounded accent-teal-500"
                />
                Enabled
              </label>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 font-medium block mb-1">
                  Account Title
                </label>
                <input
                  type="text"
                  value={paymentMethods.sadapay?.accountTitle || ""}
                  onChange={(e) => updateMethod("sadapay", "accountTitle", e.target.value)}
                  placeholder="e.g. MetScheduler SadaPay"
                  className="w-full text-xs bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 outline-none focus:border-teal-500"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 font-medium block mb-1">
                  SadaPay Number
                </label>
                <input
                  type="text"
                  value={paymentMethods.sadapay?.accountNumber || ""}
                  onChange={(e) => updateMethod("sadapay", "accountNumber", e.target.value)}
                  placeholder="e.g. 0312-3456789"
                  className="w-full text-xs font-mono bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 outline-none focus:border-teal-500"
                />
              </div>
            </div>
          </div>

          {/* NayaPay */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="size-3 rounded-full bg-cyan-500" />
                <h3 className="text-sm font-bold text-white">NayaPay Account</h3>
              </div>
              <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={paymentMethods.nayapay?.enabled !== false}
                  onChange={(e) => updateMethod("nayapay", "enabled", e.target.checked)}
                  className="rounded accent-cyan-500"
                />
                Enabled
              </label>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 font-medium block mb-1">
                  Account Title
                </label>
                <input
                  type="text"
                  value={paymentMethods.nayapay?.accountTitle || ""}
                  onChange={(e) => updateMethod("nayapay", "accountTitle", e.target.value)}
                  placeholder="e.g. MetScheduler NayaPay"
                  className="w-full text-xs bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 font-medium block mb-1">
                  NayaPay Number
                </label>
                <input
                  type="text"
                  value={paymentMethods.nayapay?.accountNumber || ""}
                  onChange={(e) => updateMethod("nayapay", "accountNumber", e.target.value)}
                  placeholder="e.g. 0312-9876543"
                  className="w-full text-xs font-mono bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 outline-none focus:border-cyan-500"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
