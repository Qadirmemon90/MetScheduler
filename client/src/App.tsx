import { useEffect } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Accounts from "./pages/Accounts";
import AIComposer from "./pages/AIComposer";
import Layout from "./components/Layout";
import Scheduler from "./pages/Scheduler";
import Settings from "./pages/Settings";
import ResetPassword from "./pages/ResetPassword";
import PolicyPage from "./pages/PolicyPage";

// Dedicated Enterprise Admin Portal
import AdminLayout from "./pages/admin/AdminLayout";
import AdminOverview from "./pages/admin/AdminOverview";
import AdminPayments from "./pages/admin/AdminPayments";
import AdminPlans from "./pages/admin/AdminPlans";
import AdminPaymentAccounts from "./pages/admin/AdminPaymentAccounts";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminPosts from "./pages/admin/AdminPosts";
import AdminAccounts from "./pages/admin/AdminAccounts";
import AdminInquiries from "./pages/admin/AdminInquiries";
import AdminPolicies from "./pages/admin/AdminPolicies";
import AdminSiteSettings from "./pages/admin/AdminSiteSettings";
import AdminCache from "./pages/admin/AdminCache";
import AdminLogs from "./pages/admin/AdminLogs";
import AdminInvoices from "./pages/admin/AdminInvoices";
import AdminOrganizations from "./pages/admin/AdminOrganizations";
import AdminLogin from "./pages/admin/AdminLogin";
import InvoiceView from "./pages/InvoiceView";

import { Toaster } from "react-hot-toast";
import { useTheme } from "./context/ThemeContext";
import { useSiteSettings } from "./context/SiteSettingsContext";

const AnalyticsRouteTracker = () => {
  const location = useLocation();
  const { settings } = useSiteSettings();

  useEffect(() => {
    if (
      settings.googleAnalyticsEnabled &&
      settings.googleAnalyticsMeasurementId &&
      window.gtag
    ) {
      window.gtag("config", settings.googleAnalyticsMeasurementId, {
        page_path: `${location.pathname}${location.search}`,
      });
    }
  }, [
    location.pathname,
    location.search,
    settings.googleAnalyticsEnabled,
    settings.googleAnalyticsMeasurementId,
  ]);

  return null;
};

export default function App() {
  const { isDark } = useTheme();

  return (
    <>
      <AnalyticsRouteTracker />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: isDark ? "#101827" : "#ffffff",
            color: isDark ? "#e5edf7" : "#0f172a",
            border: `1px solid ${isDark ? "#2d3a52" : "#e2e8f0"}`,
          },
        }}
      />
      <Routes>
        {/* Public Marketing & Auth */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/super-admin/login" element={<AdminLogin />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/privacy" element={<PolicyPage />} />
        <Route path="/terms" element={<PolicyPage />} />
        <Route path="/refund" element={<PolicyPage />} />
        <Route path="/cookies" element={<PolicyPage />} />
        <Route path="/invoice/:id" element={<InvoiceView />} />

        {/* User Application Area */}
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/accounts" element={<Accounts />} />
          <Route path="/ai-composer" element={<AIComposer />} />
          <Route path="/schedule" element={<Scheduler />} />
          <Route path="/settings" element={<Settings />} />
        </Route>

        {/* Dedicated Enterprise Super Admin Portal */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminOverview />} />
          <Route path="payments" element={<AdminPayments />} />
          <Route path="invoices" element={<AdminInvoices />} />
          <Route path="organizations" element={<AdminOrganizations />} />
          <Route path="plans" element={<AdminPlans />} />
          <Route path="payment-accounts" element={<AdminPaymentAccounts />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="posts" element={<AdminPosts />} />
          <Route path="accounts" element={<AdminAccounts />} />
          <Route path="inquiries" element={<AdminInquiries />} />
          <Route path="policies" element={<AdminPolicies />} />
          <Route path="settings" element={<AdminSiteSettings />} />
          <Route path="cache" element={<AdminCache />} />
          <Route path="logs" element={<AdminLogs />} />
        </Route>

        {/* Super Admin Route Alias */}
        <Route path="/super-admin" element={<AdminLayout />}>
          <Route index element={<AdminOverview />} />
          <Route path="dashboard" element={<AdminOverview />} />
          <Route path="payments" element={<AdminPayments />} />
          <Route path="invoices" element={<AdminInvoices />} />
          <Route path="organizations" element={<AdminOrganizations />} />
          <Route path="plans" element={<AdminPlans />} />
          <Route path="payment-accounts" element={<AdminPaymentAccounts />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="posts" element={<AdminPosts />} />
          <Route path="accounts" element={<AdminAccounts />} />
          <Route path="inquiries" element={<AdminInquiries />} />
          <Route path="policies" element={<AdminPolicies />} />
          <Route path="settings" element={<AdminSiteSettings />} />
          <Route path="cache" element={<AdminCache />} />
          <Route path="logs" element={<AdminLogs />} />
        </Route>
      </Routes>
    </>
  );
}
