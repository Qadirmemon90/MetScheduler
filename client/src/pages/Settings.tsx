/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import {
  BadgeCheckIcon,
  BotIcon,
  Building2Icon,
  CheckIcon,
  ClockIcon,
  CopyIcon,
  CrownIcon,
  FileCheckIcon,
  MoonIcon,
  RefreshCwIcon,
  SaveIcon,
  ShieldAlertIcon,
  SparklesIcon,
  SunIcon,
  Trash2Icon,
  UserIcon,
  WalletIcon,
  XCircleIcon,
} from "lucide-react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { useSiteSettings } from "../context/SiteSettingsContext";
import { useTheme } from "../context/ThemeContext";
import PakistaniPaymentModal from "../components/PakistaniPaymentModal";
import McpIntegrationModal from "../components/McpIntegrationModal";

const planIconMap = {
  free: UserIcon,
  pro: CrownIcon,
  business: Building2Icon,
};

const cardClass = "rounded-xl border border-slate-200 bg-white p-6 shadow-xs";
const inputClass =
  "w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 outline-none transition focus:border-red-500 focus:bg-white";
const labelClass = "text-[11px] font-semibold uppercase tracking-wider text-slate-500";

const Settings = () => {
  const { user, updateUser, refreshUser, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { plans } = useSiteSettings();
  const navigate = useNavigate();

  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [profileSaving, setProfileSaving] = useState(false);

  // Modals state
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [targetUpgradePlan, setTargetUpgradePlan] = useState<"pro" | "business">("pro");
  const [mcpModalOpen, setMcpModalOpen] = useState(false);

  // My payments state
  const [myPayments, setMyPayments] = useState<any[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(false);

  // Delete account state
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);

  const fetchMyPayments = async () => {
    setLoadingPayments(true);
    try {
      const { data } = await api.get("/api/billing/my-payments");
      setMyPayments(data);
    } catch {
      // Ignored
    } finally {
      setLoadingPayments(false);
    }
  };

  useEffect(() => {
    fetchMyPayments();
  }, []);

  const handleProfileSave = async () => {
    setProfileSaving(true);
    try {
      const { data } = await api.put("/api/auth/me", { name, email });
      updateUser(data);
      toast.success("Profile updated");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to update profile");
    } finally {
      setProfileSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      await api.delete("/api/auth/account", {
        data: {
          password: deletePassword,
          confirmation: deleteConfirm,
        },
      });
      toast.success("Account deleted");
      logout();
      navigate("/");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to delete account");
    } finally {
      setDeleting(false);
    }
  };

  const copyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    toast.success("MCP API Key copied to clipboard!");
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Top Profile Summary & Details */}
      <div className="grid grid-cols-1 xl:grid-cols-[340px_1fr] gap-6">
        <section className={`${cardClass} h-fit space-y-4`}>
          <div className="flex items-center gap-4">
            <div className="size-14 shrink-0 rounded-full bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center text-white text-xl font-bold shadow-md shadow-red-500/20">
              {user?.name?.charAt(0).toUpperCase() || "U"}
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-bold text-slate-900 truncate">{user?.name}</h2>
              <p className="text-xs text-slate-500 truncate">{user?.email}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className={labelClass}>Current Plan</p>
              <p className="mt-1 text-sm font-bold text-slate-900 uppercase">
                {user?.plan || "free"}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className={labelClass}>Billing Status</p>
              <p className="mt-1 text-xs font-semibold text-slate-900 capitalize">
                {(user?.billingStatus || "free").replace("_", " ")}
              </p>
            </div>
          </div>

          {user?.plan === "free" ? (
            <button
              type="button"
              onClick={() => {
                setTargetUpgradePlan("pro");
                setUpgradeModalOpen(true);
              }}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white rounded-xl text-xs font-bold shadow-md shadow-red-500/20 transition flex items-center justify-center gap-2"
            >
              <CrownIcon className="size-4 text-amber-300" />
              Upgrade to Pro (Easypaisa / Bank)
            </button>
          ) : (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-2.5 rounded-xl text-xs font-medium flex items-center gap-2">
              <SparklesIcon className="size-4 text-emerald-600" />
              Active Premium Member
            </div>
          )}
        </section>

        {/* Profile Settings */}
        <section className={cardClass}>
          <div className="mb-5 flex items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <BadgeCheckIcon className="size-5 text-red-500" />
              <h2 className="text-base font-bold text-slate-900">Personal Profile Settings</h2>
            </div>
            <span className="rounded-full border border-slate-200 px-2.5 py-0.5 text-xs text-slate-500">
              Account Details
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="space-y-1.5">
              <span className={labelClass}>Full Name</span>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                className={inputClass}
              />
            </label>
            <label className="space-y-1.5">
              <span className={labelClass}>Email Address</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className={inputClass}
              />
            </label>
          </div>

          <button
            onClick={handleProfileSave}
            disabled={profileSaving}
            className="mt-5 inline-flex h-10 items-center gap-2 rounded-xl bg-red-600 px-5 text-xs font-bold text-white transition hover:bg-red-500 disabled:opacity-60 shadow-md shadow-red-500/20"
          >
            <SaveIcon className="size-4" />
            {profileSaving ? "Saving..." : "Save Changes"}
          </button>
        </section>
      </div>

      {/* ChatGPT MCP Integration Banner */}
      <section className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white rounded-2xl p-6 border border-emerald-700/50 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-1.5 bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full">
            <BotIcon className="size-3.5" />
            ChatGPT Model Context Protocol (MCP)
          </div>
          <h3 className="text-xl font-bold">Connect ChatGPT to your MetScheduler</h3>
          <p className="text-xs text-emerald-100/80 leading-relaxed">
            Allow ChatGPT Desktop, Claude, or ChatGPT Web to view your social accounts, check upcoming schedules, and publish posts automatically using natural language.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {user?.mcpApiKey && (
            <button
              type="button"
              onClick={() => copyKey(user.mcpApiKey!)}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold backdrop-blur-xs transition flex items-center justify-center gap-1.5 border border-white/20"
            >
              <CopyIcon className="size-3.5" />
              Copy Personal MCP Key
            </button>
          )}

          <button
            type="button"
            onClick={() => setMcpModalOpen(true)}
            className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-bold transition shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-1.5"
          >
            <BotIcon className="size-4" />
            Connect ChatGPT (Guide & Test)
          </button>
        </div>
      </section>

      {/* Plan Upgrade & Pakistani Payment Section */}
      <section className={cardClass}>
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <WalletIcon className="size-5 text-red-500" />
              <h2 className="text-base font-bold text-slate-900">Pakistani Plan Upgrade</h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Pay in PKR via Easypaisa, JazzCash, or Bank Account. Submissions are verified manually by admin.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setTargetUpgradePlan("pro");
              setUpgradeModalOpen(true);
            }}
            className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl transition shadow-md shadow-red-500/20 flex items-center gap-1.5 self-start sm:self-auto"
          >
            <CrownIcon className="size-4 text-amber-300" />
            Upgrade Plan (Easypaisa/Bank)
          </button>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {plans.map((plan) => {
            const Icon = planIconMap[plan.id] || UserIcon;
            const isCurrent = user?.plan === plan.id;
            const isUpgrade = plan.id !== "free";

            return (
              <div
                key={plan.id}
                className={`rounded-2xl border p-5 flex flex-col justify-between transition ${
                  isCurrent
                    ? "border-red-500 bg-red-50/40 ring-2 ring-red-500/20"
                    : "border-slate-200 bg-white"
                }`}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                      <Icon className="size-5 text-red-500" />
                      <span>{plan.name}</span>
                    </div>
                    {isCurrent && (
                      <span className="text-[10px] bg-red-600 text-white font-bold px-2 py-0.5 rounded-full uppercase">
                        Current
                      </span>
                    )}
                  </div>

                  <div>
                    <span className="text-2xl font-black text-slate-900">{plan.price}</span>
                    <span className="text-xs text-slate-400"> {plan.period}</span>
                    <p className="text-xs text-slate-500 mt-1">{plan.description}</p>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    {plan.features.map((f) => (
                      <div key={f} className="flex items-center gap-2 text-xs text-slate-600">
                        <CheckIcon className="size-3.5 text-red-500 shrink-0" />
                        <span>{f}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-5 mt-4 border-t border-slate-100">
                  {isCurrent ? (
                    <span className="block text-center text-xs font-semibold text-slate-400 py-2">
                      Active Plan
                    </span>
                  ) : isUpgrade ? (
                    <button
                      type="button"
                      onClick={() => {
                        setTargetUpgradePlan(plan.id as "pro" | "business");
                        setUpgradeModalOpen(true);
                      }}
                      className="w-full py-2 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition"
                    >
                      Upgrade to {plan.name}
                    </button>
                  ) : (
                    <span className="block text-center text-xs text-slate-400 py-2">Starter</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Payment History Table */}
      <section className={cardClass}>
        <div className="mb-4 flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <FileCheckIcon className="size-5 text-red-500" />
            <h2 className="text-base font-bold text-slate-900">My Payment Verification Requests</h2>
          </div>
          <button
            type="button"
            onClick={fetchMyPayments}
            className="text-xs text-slate-500 hover:text-red-600 flex items-center gap-1 font-medium"
          >
            <RefreshCwIcon className={`size-3 ${loadingPayments ? "animate-spin" : ""}`} />
            Refresh History
          </button>
        </div>

        {myPayments.length === 0 ? (
          <div className="py-8 text-center text-slate-500 text-xs">
            No payment requests submitted yet. When you upgrade via Easypaisa or Bank Transfer, your status will appear here.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400">
                  <th className="py-2.5 px-3 font-semibold">Plan</th>
                  <th className="py-2.5 px-3 font-semibold">Method</th>
                  <th className="py-2.5 px-3 font-semibold">Amount</th>
                  <th className="py-2.5 px-3 font-semibold">Transaction ID</th>
                  <th className="py-2.5 px-3 font-semibold">Status</th>
                  <th className="py-2.5 px-3 font-semibold">Submitted At</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600">
                {myPayments.map((p) => (
                  <tr key={p._id}>
                    <td className="py-2.5 px-3 font-bold uppercase text-slate-900">{p.targetPlan}</td>
                    <td className="py-2.5 px-3 capitalize">{p.paymentMethod}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900">PKR {p.amount}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-500">{p.transactionId}</td>
                    <td className="py-2.5 px-3">
                      {p.status === "pending" && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          <ClockIcon className="size-3" /> Under Review
                        </span>
                      )}
                      {p.status === "approved" && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckIcon className="size-3" /> Approved
                        </span>
                      )}
                      {p.status === "more_info_required" && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          <ClockIcon className="size-3" /> Info Needed
                        </span>
                      )}
                      {p.status === "rejected" && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          <XCircleIcon className="size-3" /> Rejected
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-slate-400">{new Date(p.createdAt).toLocaleDateString()}</td>
                    <td className="py-2.5 px-3 text-right">
                      {p.invoice ? (
                        <button
                          type="button"
                          onClick={() => navigate(`/invoice/${p.invoice}`)}
                          className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-semibold border border-red-200 transition"
                        >
                          Invoice
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Appearance */}
      <section className={cardClass}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Theme Appearance</h2>
            <p className="text-xs text-slate-500 mt-0.5">Toggle between Light and Dark interface modes</p>
          </div>
          <button
            onClick={toggleTheme}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
          >
            {isDark ? <SunIcon className="size-4" /> : <MoonIcon className="size-4" />}
            {isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
          </button>
        </div>
      </section>

      {/* Delete Account */}
      <section className="rounded-xl border border-red-200 bg-white p-6 shadow-xs">
        <div className="mb-4 flex items-center gap-2">
          <ShieldAlertIcon className="size-5 text-red-500" />
          <h2 className="text-base font-bold text-slate-900">Delete Account</h2>
        </div>
        <p className="text-xs text-slate-500 mb-4">
          Permanently remove your MetScheduler account, scheduled posts, connected channels, and data.
        </p>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_1fr_auto] md:items-end">
          <label className="space-y-1.5">
            <span className={labelClass}>Current Password</span>
            <input
              type="password"
              value={deletePassword}
              onChange={(event) => setDeletePassword(event.target.value)}
              placeholder="••••••••"
              className={inputClass}
            />
          </label>
          <label className="space-y-1.5">
            <span className={labelClass}>Confirm by typing DELETE</span>
            <input
              value={deleteConfirm}
              onChange={(event) => setDeleteConfirm(event.target.value)}
              placeholder="Type DELETE"
              className={inputClass}
            />
          </label>
          <button
            onClick={handleDeleteAccount}
            disabled={deleting}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-red-600 px-5 text-xs font-bold text-white transition hover:bg-red-500 disabled:opacity-60 shadow-md shadow-red-500/20"
          >
            <Trash2Icon className="size-4" />
            {deleting ? "Deleting..." : "Permanently Delete"}
          </button>
        </div>
      </section>

      {/* Pakistani Payment Upgrade Modal */}
      <PakistaniPaymentModal
        isOpen={upgradeModalOpen}
        defaultPlan={targetUpgradePlan}
        onClose={() => setUpgradeModalOpen(false)}
        onSuccess={() => {
          fetchMyPayments();
          refreshUser();
        }}
      />

      {/* ChatGPT MCP Integration Modal */}
      <McpIntegrationModal
        isOpen={mcpModalOpen}
        onClose={() => setMcpModalOpen(false)}
      />
    </div>
  );
};

export default Settings;
