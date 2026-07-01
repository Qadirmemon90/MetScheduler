/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import {
  BadgeCheckIcon,
  Building2Icon,
  CheckIcon,
  CrownIcon,
  MoonIcon,
  SaveIcon,
  ShieldAlertIcon,
  SunIcon,
  Trash2Icon,
  UserIcon,
} from "lucide-react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { useSiteSettings } from "../context/SiteSettingsContext";
import { useTheme } from "../context/ThemeContext";
import { paidPlanIds } from "../data/plans";
import type { PlanId } from "../data/plans";

const planIconMap = {
  free: UserIcon,
  pro: CrownIcon,
  business: Building2Icon,
};

const planLabelMap = {
  free: "Starter",
  pro: "Popular",
  business: "Team",
};

const cardClass = "rounded-lg border border-slate-200 bg-white p-5";
const inputClass =
  "w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-red-300 focus:bg-white";
const labelClass = "text-[11px] font-medium uppercase tracking-wide text-slate-500";

const Settings = () => {
  const { user, updateUser, refreshUser, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { plans } = useSiteSettings();
  const paidPlans = plans.filter((plan) => paidPlanIds.includes(plan.id));
  const navigate = useNavigate();

  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [profileSaving, setProfileSaving] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanId>("pro");
  const [vendorPhone, setVendorPhone] = useState("");
  const [vendorCompany, setVendorCompany] = useState("");
  const [vendorMessage, setVendorMessage] = useState("");
  const [contactingVendor, setContactingVendor] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);

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

  const handleVendorContact = async () => {
    setContactingVendor(true);
    try {
      await api.post("/api/billing/contact-vendor", {
        plan: selectedPlan,
        phone: vendorPhone,
        company: vendorCompany,
        message: vendorMessage,
      });
      await refreshUser();
      setVendorPhone("");
      setVendorCompany("");
      setVendorMessage("");
      toast.success("Vendor contact request sent");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to contact vendor");
    } finally {
      setContactingVendor(false);
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

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <div className="grid grid-cols-1 xl:grid-cols-[340px_1fr] gap-5">
        <section className={`${cardClass} h-fit`}>
          <div className="flex items-center gap-4">
            <div className="size-14 shrink-0 rounded-full bg-linear-to-br from-red-500 to-pink-500 flex items-center justify-center text-white text-xl font-semibold">
              {user?.name?.charAt(0).toUpperCase() || "U"}
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-slate-900 truncate">{user?.name}</h2>
              <p className="text-sm text-slate-500 truncate">{user?.email}</p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className={labelClass}>Plan</p>
              <p className="mt-1 text-sm font-medium text-slate-900 capitalize">
                {user?.plan || "free"}
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className={labelClass}>Billing</p>
              <p className="mt-1 text-sm font-medium text-slate-900 capitalize">
                {(user?.billingStatus || "free").replace("_", " ")}
              </p>
            </div>
          </div>
        </section>

        <section className={cardClass}>
          <div className="mb-5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <BadgeCheckIcon className="size-5 text-red-500" />
              <h2 className="text-base font-semibold text-slate-900">Profile Settings</h2>
            </div>
            <span className="rounded-full border border-slate-200 px-2.5 py-1 text-xs text-slate-500">
              Account details
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="space-y-2">
              <span className={labelClass}>Name</span>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                className={inputClass}
              />
            </label>
            <label className="space-y-2">
              <span className={labelClass}>Email</span>
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
            className="mt-5 inline-flex h-10 items-center gap-2 rounded-lg bg-red-500 px-4 text-sm font-medium text-white transition hover:bg-red-600 disabled:opacity-60"
          >
            <SaveIcon className="size-4" />
            {profileSaving ? "Saving..." : "Save Profile"}
          </button>
        </section>
      </div>

      <section className={cardClass}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Appearance</h2>
            <p className="mt-1 text-sm text-slate-500">Current theme: {isDark ? "Dark" : "Light"}</p>
          </div>
          <button
            onClick={toggleTheme}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            {isDark ? <SunIcon className="size-4" /> : <MoonIcon className="size-4" />}
            {isDark ? "Light Mode" : "Dark Mode"}
          </button>
        </div>
      </section>

      <section className={cardClass}>
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <CrownIcon className="size-5 text-red-500" />
            <h2 className="text-base font-semibold text-slate-900">Plan Upgrade</h2>
          </div>
          <p className="text-sm text-slate-500">
            Select a plan and send your requirement to the vendor.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {plans.map((plan) => {
            const Icon = planIconMap[plan.id] || UserIcon;
            const active = user?.plan === plan.id;
            const selectable = plan.id !== "free";
            const selected = selectedPlan === plan.id;

            return (
              <button
                key={plan.id}
                type="button"
                disabled={!selectable}
                onClick={() => selectable && setSelectedPlan(plan.id)}
                className={`min-h-[190px] text-left rounded-lg border p-4 transition ${
                  active || selected
                    ? "border-red-200 bg-red-50 shadow-sm"
                    : "border-slate-200 hover:border-red-200"
                } ${!selectable ? "cursor-default" : ""}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Icon className="size-5 text-red-500" />
                    <span className="font-semibold text-slate-900">{plan.name}</span>
                  </div>
                  <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[11px] text-slate-500">
                    {active ? "Current" : planLabelMap[plan.id]}
                  </span>
                </div>
                <p className="mt-3 text-xl font-semibold text-slate-900">
                  {plan.price}
                  {plan.period && <span className="text-sm text-slate-400"> {plan.period}</span>}
                </p>
                <div className="mt-4 space-y-2.5">
                  {plan.features.map((feature) => (
                    <p key={feature} className="flex items-center gap-2 text-sm text-slate-500">
                      <CheckIcon className="size-4 shrink-0 text-red-500" />
                      <span>{feature}</span>
                    </p>
                  ))}
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 lg:grid-cols-[180px_1fr_1fr_auto] lg:items-end">
          <label className="space-y-2">
            <span className={labelClass}>Request Plan</span>
            <select
              value={selectedPlan}
              onChange={(event) => setSelectedPlan(event.target.value as PlanId)}
              className={inputClass}
            >
              {paidPlans.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.name}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-2">
            <span className={labelClass}>Phone / WhatsApp</span>
            <input
              value={vendorPhone}
              onChange={(event) => setVendorPhone(event.target.value)}
              placeholder="+92 300 0000000"
              className={inputClass}
            />
          </label>
          <label className="space-y-2">
            <span className={labelClass}>Company</span>
            <input
              value={vendorCompany}
              onChange={(event) => setVendorCompany(event.target.value)}
              placeholder="Brand or company"
              className={inputClass}
            />
          </label>
        </div>

        <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-[1fr_auto] lg:items-end">
          <label className="space-y-2">
            <span className={labelClass}>Requirement</span>
            <textarea
              value={vendorMessage}
              onChange={(event) => setVendorMessage(event.target.value)}
              rows={2}
              placeholder="Tell the vendor what you need..."
              className={`${inputClass} min-h-[42px] resize-none`}
            />
          </label>
          <button
            onClick={handleVendorContact}
            disabled={contactingVendor}
            className="inline-flex h-10 items-center justify-center rounded-lg bg-red-500 px-5 text-sm font-medium text-white transition hover:bg-red-600 disabled:opacity-60"
          >
            {contactingVendor ? "Sending..." : "Contact Vendor"}
          </button>
        </div>
      </section>

      <section className="rounded-lg border border-red-100 bg-white p-5">
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlertIcon className="size-5 text-red-500" />
            <h2 className="text-base font-semibold text-slate-900">Delete Account</h2>
          </div>
          <p className="max-w-xl text-sm text-slate-500">
            This permanently removes your account, connected accounts, activity logs, and scheduled posts.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_1fr_auto] md:items-end">
          <label className="space-y-2">
            <span className={labelClass}>Password</span>
            <input
              type="password"
              value={deletePassword}
              onChange={(event) => setDeletePassword(event.target.value)}
              placeholder="Password"
              className={inputClass}
            />
          </label>
          <label className="space-y-2">
            <span className={labelClass}>Confirmation</span>
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
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-red-500 px-4 text-sm font-medium text-white transition hover:bg-red-600 disabled:opacity-60"
          >
            <Trash2Icon className="size-4" />
            {deleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </section>
    </div>
  );
};

export default Settings;
