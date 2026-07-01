/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useState } from "react";
import {
  AlertCircleIcon,
  BarChart3Icon,
  CalendarClockIcon,
  CheckCircleIcon,
  CreditCardIcon,
  GaugeIcon,
  KeyRoundIcon,
  MessageSquareIcon,
  SaveIcon,
  SettingsIcon,
  UsersIcon,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../api/axios";
import { useSiteSettings } from "../context/SiteSettingsContext";
import { defaultPricingPlans } from "../data/plans";

const tabs = [
  { id: "overview", label: "Overview", icon: GaugeIcon },
  { id: "queries", label: "Queries", icon: MessageSquareIcon },
  { id: "users", label: "Users", icon: UsersIcon },
  { id: "posts", label: "Posts", icon: CalendarClockIcon },
  { id: "settings", label: "Settings", icon: KeyRoundIcon },
];

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-red-300 focus:bg-white";
const labelClass = "text-[11px] font-medium uppercase tracking-wide text-slate-500";
const cardClass = "rounded-lg border border-slate-200 bg-white";

const normalizeSettings = (data: any) => {
  const existingPlans = Array.isArray(data?.plans) ? data.plans : [];
  const plans = defaultPricingPlans.map((fallback) => ({
    ...fallback,
    ...(existingPlans.find((plan: any) => plan.id === fallback.id) || {}),
    id: fallback.id,
  }));

  return {
    googleAnalyticsEnabled: false,
    googleAnalyticsMeasurementId: "",
    vendorName: "Vendor Team",
    vendorEmail: "",
    vendorPhone: "",
    vendorWhatsapp: "",
    supportEmail: "",
    publicApiNote:
      "Only public tracking IDs should be stored here. Keep secret API keys in server .env.",
    ...data,
    plans,
  };
};

const statusClass = (status?: string) => {
  if (status === "published" || status === "contacted") {
    return "bg-emerald-50 text-emerald-700 border-emerald-100";
  }
  if (status === "failed") return "bg-red-50 text-red-700 border-red-100";
  if (status === "scheduled" || status === "new") {
    return "bg-amber-50 text-amber-700 border-amber-100";
  }
  return "bg-slate-50 text-slate-600 border-slate-100";
};

const formatDate = (date?: string) => {
  if (!date) return "-";
  return new Date(date).toLocaleString();
};

const AdminDashboard = () => {
  const { refreshSettings } = useSiteSettings();
  const [activeTab, setActiveTab] = useState("overview");
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [settingsForm, setSettingsForm] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [blocked, setBlocked] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  const fetchAdminData = async () => {
    try {
      const [statsRes, usersRes, postsRes, inquiriesRes, settingsRes] =
        await Promise.all([
          api.get("/api/admin/stats"),
          api.get("/api/admin/users"),
          api.get("/api/admin/posts"),
          api.get("/api/admin/inquiries"),
          api.get("/api/admin/settings"),
        ]);
      setStats(statsRes.data);
      setUsers(usersRes.data);
      setPosts(postsRes.data);
      setInquiries(inquiriesRes.data);
      setSettingsForm(normalizeSettings(settingsRes.data));
      setBlocked(false);
    } catch (error: any) {
      if (error?.response?.status === 403) {
        setBlocked(true);
      } else {
        toast.error(error?.response?.data?.message || "Failed to load admin dashboard");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const updateInquiryStatus = async (id: string, status: string) => {
    try {
      const { data } = await api.patch(`/api/admin/inquiries/${id}`, { status });
      setInquiries((current) =>
        current.map((inquiry) => (inquiry._id === id ? data : inquiry)),
      );
      toast.success("Inquiry updated");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to update inquiry");
    }
  };

  const updateUserPlan = async (id: string, plan: string) => {
    try {
      const billingStatus = plan === "free" ? "free" : "active";
      const { data } = await api.patch(`/api/admin/users/${id}/plan`, {
        plan,
        billingStatus,
      });
      setUsers((current) => current.map((user) => (user._id === id ? data : user)));
      toast.success("User plan updated");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to update user plan");
    }
  };

  const updateSetting = (field: string, value: unknown) => {
    setSettingsForm((current: any) => ({ ...current, [field]: value }));
  };

  const updatePlan = (index: number, field: string, value: unknown) => {
    setSettingsForm((current: any) => ({
      ...current,
      plans: current.plans.map((plan: any, planIndex: number) =>
        planIndex === index ? { ...plan, [field]: value } : plan,
      ),
    }));
  };

  const updatePlanFeatures = (index: number, value: string) => {
    updatePlan(
      index,
      "features",
      value
        .split("\n")
        .map((feature) => feature.trim())
        .filter(Boolean),
    );
  };

  const saveSettings = async () => {
    setSavingSettings(true);
    try {
      const { data } = await api.put("/api/admin/settings", settingsForm);
      setSettingsForm(normalizeSettings(data));
      await refreshSettings();
      toast.success("Admin settings saved");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to save settings");
    } finally {
      setSavingSettings(false);
    }
  };

  const analytics = useMemo(() => {
    const planDistribution = defaultPricingPlans.map((plan) => ({
      label: plan.name,
      value: users.filter((user) => (user.plan || "free") === plan.id).length,
    }));
    const postStatus = ["scheduled", "published", "failed"].map((status) => ({
      label: status,
      value: posts.filter((post) => post.status === status).length,
    }));
    const inquiryStatus = ["new", "contacted", "closed"].map((status) => ({
      label: status,
      value: inquiries.filter((inquiry) => inquiry.status === status).length,
    }));

    return { planDistribution, postStatus, inquiryStatus };
  }, [inquiries, posts, users]);

  if (loading) {
    return (
      <div className="flex h-80 items-center justify-center">
        <div className="size-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (blocked) {
    return (
      <div className="max-w-xl bg-white border border-slate-200 rounded-lg p-6">
        <AlertCircleIcon className="size-8 text-red-500 mb-4" />
        <h2 className="text-xl text-slate-900">Admin access required</h2>
        <p className="text-sm text-slate-500 mt-2">
          Your account is not marked as admin.
        </p>
      </div>
    );
  }

  const statCards = [
    { label: "Users", value: stats?.totalUsers || 0, icon: UsersIcon },
    { label: "Connected Accounts", value: stats?.connectedAccounts || 0, icon: BarChart3Icon },
    { label: "Scheduled", value: stats?.scheduledPosts || 0, icon: CalendarClockIcon },
    { label: "Published", value: stats?.publishedPosts || 0, icon: CheckCircleIcon },
    { label: "Failed", value: stats?.failedPosts || 0, icon: AlertCircleIcon },
    { label: "Vendor Queries", value: stats?.openInquiries || 0, icon: CreditCardIcon },
  ];

  const renderBars = (items: { label: string; value: number }[]) => {
    const max = Math.max(...items.map((item) => item.value), 1);
    return (
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.label}>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="capitalize text-slate-600">{item.label}</span>
              <span className="font-medium text-slate-900">{item.value}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-red-500"
                style={{ width: `${(item.value / max) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <section className={`${cardClass} p-5`}>
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-red-500">
              Admin Control Panel
            </p>
            <h2 className="mt-1 text-2xl font-semibold text-slate-900">
              Analytics, users, queries, and public site settings
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`inline-flex h-10 items-center gap-2 rounded-lg border px-3 text-sm font-medium transition ${
                    active
                      ? "border-red-200 bg-red-50 text-red-600"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <Icon className="size-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {activeTab === "overview" && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {statCards.map((card) => {
              const Icon = card.icon;
              return (
                <div key={card.label} className={`${cardClass} p-4`}>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-slate-500">{card.label}</p>
                    <Icon className="size-5 text-red-500" />
                  </div>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">{card.value}</p>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
            <section className={`${cardClass} p-5`}>
              <h3 className="font-semibold text-slate-900">Plan Analytics</h3>
              <p className="mt-1 text-sm text-slate-500">Users grouped by current plan.</p>
              <div className="mt-5">{renderBars(analytics.planDistribution)}</div>
            </section>

            <section className={`${cardClass} p-5`}>
              <h3 className="font-semibold text-slate-900">Post Analytics</h3>
              <p className="mt-1 text-sm text-slate-500">Scheduled, published, and failed posts.</p>
              <div className="mt-5">{renderBars(analytics.postStatus)}</div>
            </section>

            <section className={`${cardClass} p-5`}>
              <h3 className="font-semibold text-slate-900">Google Analytics</h3>
              <p className="mt-1 text-sm text-slate-500">Tracking is controlled from Settings.</p>
              <div className="mt-5 space-y-3">
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <p className={labelClass}>Status</p>
                  <p className="mt-1 text-sm font-medium text-slate-900">
                    {settingsForm?.googleAnalyticsEnabled ? "Enabled" : "Disabled"}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <p className={labelClass}>Measurement ID</p>
                  <p className="mt-1 text-sm font-medium text-slate-900">
                    {settingsForm?.googleAnalyticsMeasurementId || "Not set"}
                  </p>
                </div>
              </div>
            </section>
          </div>
        </div>
      )}

      {activeTab === "queries" && (
        <section className={`${cardClass} overflow-hidden`}>
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="font-semibold text-slate-900">Vendor Queries</h2>
            <p className="mt-1 text-sm text-slate-500">
              Contact Vendor requests from Home and Profile Settings.
            </p>
          </div>
          <div className="divide-y divide-slate-100">
            {inquiries.length === 0 ? (
              <p className="p-5 text-sm text-slate-400">No vendor queries yet</p>
            ) : (
              inquiries.map((inquiry) => (
                <div key={inquiry._id} className="p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-slate-900">{inquiry.name}</h3>
                        <span className="rounded-full border border-slate-200 px-2 py-0.5 text-xs capitalize text-slate-500">
                          {inquiry.source || "home"}
                        </span>
                        <span className={`rounded-full border px-2 py-0.5 text-xs capitalize ${statusClass(inquiry.status)}`}>
                          {inquiry.status}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-slate-500">{inquiry.email}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        {[inquiry.phone, inquiry.company].filter(Boolean).join(" · ") || "No extra contact detail"}
                      </p>
                      <p className="mt-2 text-sm text-slate-600 capitalize">Plan: {inquiry.plan}</p>
                      {inquiry.message && (
                        <p className="mt-3 max-w-3xl text-sm text-slate-600">{inquiry.message}</p>
                      )}
                      <p className="mt-3 text-xs text-slate-400">{formatDate(inquiry.createdAt)}</p>
                    </div>
                    <select
                      value={inquiry.status}
                      onChange={(event) => updateInquiryStatus(inquiry._id, event.target.value)}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-red-300"
                    >
                      <option value="new">New</option>
                      <option value="contacted">Contacted</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      )}

      {activeTab === "users" && (
        <section className={`${cardClass} overflow-hidden`}>
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">Users</h2>
            <span className="text-sm text-slate-400">{users.length} total</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="text-left px-5 py-3">User</th>
                  <th className="text-left px-5 py-3">Role</th>
                  <th className="text-left px-5 py-3">Plan</th>
                  <th className="text-left px-5 py-3">Billing</th>
                  <th className="text-left px-5 py-3">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((user) => (
                  <tr key={user._id}>
                    <td className="px-5 py-3">
                      <p className="text-slate-900">{user.name}</p>
                      <p className="text-xs text-slate-400">{user.email}</p>
                    </td>
                    <td className="px-5 py-3 capitalize text-slate-600">{user.role || "user"}</td>
                    <td className="px-5 py-3">
                      <select
                        value={user.plan || "free"}
                        onChange={(event) => updateUserPlan(user._id, event.target.value)}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-red-300"
                      >
                        <option value="free">Free</option>
                        <option value="pro">Pro</option>
                        <option value="business">Business</option>
                      </select>
                    </td>
                    <td className="px-5 py-3 capitalize text-slate-600">
                      {(user.billingStatus || "free").replace("_", " ")}
                    </td>
                    <td className="px-5 py-3 text-slate-500">{formatDate(user.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {activeTab === "posts" && (
        <section className={`${cardClass} overflow-hidden`}>
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900">Post Logs</h2>
            <p className="mt-1 text-sm text-slate-500">Recent scheduled and published content.</p>
          </div>
          <div className="divide-y divide-slate-100">
            {posts.length === 0 ? (
              <p className="p-5 text-sm text-slate-400">No posts yet</p>
            ) : (
              posts.map((post) => (
                <div key={post._id} className="p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-900">
                        {post.user?.name || "Unknown user"}
                      </p>
                      <p className="text-xs text-slate-400">{post.user?.email}</p>
                    </div>
                    <span className={`shrink-0 rounded-full border px-2 py-1 text-xs capitalize ${statusClass(post.status)}`}>
                      {post.status}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-500 line-clamp-2">{post.content}</p>
                  {post.failureReason && (
                    <p className="mt-2 text-xs text-red-600 line-clamp-2">
                      {post.failureReason}
                    </p>
                  )}
                  <p className="mt-3 text-xs text-slate-400">{formatDate(post.createdAt)}</p>
                </div>
              ))
            )}
          </div>
        </section>
      )}

      {activeTab === "settings" && settingsForm && (
        <div className="space-y-5">
          <section className={`${cardClass} p-5`}>
            <div className="mb-5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <SettingsIcon className="size-5 text-red-500" />
                <h2 className="font-semibold text-slate-900">Google Analytics & Public Keys</h2>
              </div>
              <button
                onClick={saveSettings}
                disabled={savingSettings}
                className="inline-flex h-10 items-center gap-2 rounded-lg bg-red-500 px-4 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-60"
              >
                <SaveIcon className="size-4" />
                {savingSettings ? "Saving..." : "Save"}
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[160px_1fr_1fr]">
              <label className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
                <input
                  type="checkbox"
                  checked={settingsForm.googleAnalyticsEnabled}
                  onChange={(event) =>
                    updateSetting("googleAnalyticsEnabled", event.target.checked)
                  }
                  className="size-4 accent-red-500"
                />
                <span className="text-sm font-medium text-slate-700">GA Enabled</span>
              </label>
              <label className="space-y-2">
                <span className={labelClass}>Google Analytics Measurement ID</span>
                <input
                  value={settingsForm.googleAnalyticsMeasurementId}
                  onChange={(event) =>
                    updateSetting("googleAnalyticsMeasurementId", event.target.value)
                  }
                  placeholder="G-XXXXXXXXXX"
                  className={inputClass}
                />
              </label>
              <label className="space-y-2">
                <span className={labelClass}>Support Email</span>
                <input
                  value={settingsForm.supportEmail}
                  onChange={(event) => updateSetting("supportEmail", event.target.value)}
                  placeholder="support@example.com"
                  className={inputClass}
                />
              </label>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              <label className="space-y-2">
                <span className={labelClass}>Vendor Name</span>
                <input
                  value={settingsForm.vendorName}
                  onChange={(event) => updateSetting("vendorName", event.target.value)}
                  className={inputClass}
                />
              </label>
              <label className="space-y-2">
                <span className={labelClass}>Vendor Email</span>
                <input
                  value={settingsForm.vendorEmail}
                  onChange={(event) => updateSetting("vendorEmail", event.target.value)}
                  className={inputClass}
                />
              </label>
              <label className="space-y-2">
                <span className={labelClass}>Vendor Phone</span>
                <input
                  value={settingsForm.vendorPhone}
                  onChange={(event) => updateSetting("vendorPhone", event.target.value)}
                  className={inputClass}
                />
              </label>
              <label className="space-y-2">
                <span className={labelClass}>Vendor WhatsApp</span>
                <input
                  value={settingsForm.vendorWhatsapp}
                  onChange={(event) => updateSetting("vendorWhatsapp", event.target.value)}
                  className={inputClass}
                />
              </label>
            </div>

            <label className="mt-4 block space-y-2">
              <span className={labelClass}>Public Key Note</span>
              <textarea
                value={settingsForm.publicApiNote}
                onChange={(event) => updateSetting("publicApiNote", event.target.value)}
                rows={2}
                className={`${inputClass} resize-none`}
              />
            </label>
          </section>

          <section className={`${cardClass} p-5`}>
            <div className="mb-5">
              <h2 className="font-semibold text-slate-900">Plans</h2>
              <p className="mt-1 text-sm text-slate-500">
                These plans appear on Home and Profile Settings.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
              {settingsForm.plans.map((plan: any, index: number) => (
                <div key={plan.id} className="rounded-lg border border-slate-200 p-4">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <h3 className="font-semibold capitalize text-slate-900">{plan.id}</h3>
                    <div className="flex items-center gap-3 text-sm text-slate-500">
                      <label className="flex items-center gap-1.5">
                        <input
                          type="checkbox"
                          checked={plan.highlight}
                          onChange={(event) => updatePlan(index, "highlight", event.target.checked)}
                          className="size-4 accent-red-500"
                        />
                        Highlight
                      </label>
                      <label className="flex items-center gap-1.5">
                        <input
                          type="checkbox"
                          checked={plan.enabled !== false}
                          onChange={(event) => updatePlan(index, "enabled", event.target.checked)}
                          className="size-4 accent-red-500"
                        />
                        Enabled
                      </label>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="space-y-2">
                      <span className={labelClass}>Plan Name</span>
                      <input
                        value={plan.name}
                        onChange={(event) => updatePlan(index, "name", event.target.value)}
                        className={inputClass}
                      />
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <label className="space-y-2">
                        <span className={labelClass}>Price</span>
                        <input
                          value={plan.price}
                          onChange={(event) => updatePlan(index, "price", event.target.value)}
                          className={inputClass}
                        />
                      </label>
                      <label className="space-y-2">
                        <span className={labelClass}>Period</span>
                        <input
                          value={plan.period || ""}
                          onChange={(event) => updatePlan(index, "period", event.target.value)}
                          placeholder="/month"
                          className={inputClass}
                        />
                      </label>
                    </div>
                    <label className="space-y-2">
                      <span className={labelClass}>CTA</span>
                      <input
                        value={plan.cta}
                        onChange={(event) => updatePlan(index, "cta", event.target.value)}
                        className={inputClass}
                      />
                    </label>
                    <label className="space-y-2">
                      <span className={labelClass}>Description</span>
                      <textarea
                        value={plan.description}
                        onChange={(event) => updatePlan(index, "description", event.target.value)}
                        rows={2}
                        className={`${inputClass} resize-none`}
                      />
                    </label>
                    <label className="space-y-2">
                      <span className={labelClass}>Features</span>
                      <textarea
                        value={(plan.features || []).join("\n")}
                        onChange={(event) => updatePlanFeatures(index, event.target.value)}
                        rows={5}
                        className={`${inputClass} resize-none`}
                      />
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
