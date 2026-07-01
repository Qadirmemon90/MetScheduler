import { useEffect } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Accounts from "./pages/Accounts";
import AIComposer from "./pages/AIComposer";

import AdminDashboard from "./pages/AdminDashboard";
import Layout from "./components/Layout";
import Scheduler from "./pages/Scheduler";
import Settings from "./pages/Settings";
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
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />

        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/accounts" element={<Accounts />} />
          <Route path="/ai-composer" element={<AIComposer />} />
          <Route path="/schedule" element={<Scheduler />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/admin" element={<AdminDashboard />} />
        </Route>
      </Routes>
    </>
  );
}
