import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import api from "../api/axios";
import { defaultPricingPlans } from "../data/plans";
import type { PricingPlan } from "../data/plans";

type PublicSiteSettings = {
  googleAnalyticsEnabled: boolean;
  googleAnalyticsMeasurementId: string;
  vendorName: string;
  vendorEmail: string;
  vendorPhone: string;
  vendorWhatsapp: string;
  supportEmail: string;
  plans: PricingPlan[];
};

type SiteSettingsContextType = {
  settings: PublicSiteSettings;
  plans: PricingPlan[];
  refreshSettings: () => Promise<void>;
};

const defaultSettings: PublicSiteSettings = {
  googleAnalyticsEnabled: false,
  googleAnalyticsMeasurementId: "",
  vendorName: "Vendor Team",
  vendorEmail: "",
  vendorPhone: "",
  vendorWhatsapp: "",
  supportEmail: "",
  plans: defaultPricingPlans,
};

const SiteSettingsContext = createContext<SiteSettingsContextType | undefined>(
  undefined,
);

const loadGoogleAnalytics = (measurementId: string) => {
  if (!measurementId || !/^G-[A-Z0-9]+$/i.test(measurementId)) return;

  const scriptId = "google-analytics-script";
  const existing = document.getElementById(scriptId) as HTMLScriptElement | null;

  if (existing?.dataset.measurementId === measurementId) return;
  existing?.remove();

  const script = document.createElement("script");
  script.id = scriptId;
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  script.dataset.measurementId = measurementId;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  window.gtag =
    window.gtag ||
    function gtag() {
      window.dataLayer.push(Array.from(arguments));
    };
  window.gtag("js", new Date());
  window.gtag("config", measurementId);
};

export const SiteSettingsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [settings, setSettings] = useState<PublicSiteSettings>(defaultSettings);

  const refreshSettings = async () => {
    try {
      const { data } = await api.get("/api/site-settings/public");
      setSettings({
        ...defaultSettings,
        ...data,
        plans: data?.plans?.length ? data.plans : defaultPricingPlans,
      });
    } catch {
      setSettings(defaultSettings);
    }
  };

  useEffect(() => {
    refreshSettings();
  }, []);

  useEffect(() => {
    if (settings.googleAnalyticsEnabled) {
      loadGoogleAnalytics(settings.googleAnalyticsMeasurementId);
    }
  }, [settings.googleAnalyticsEnabled, settings.googleAnalyticsMeasurementId]);

  const value = useMemo(
    () => ({
      settings,
      plans: settings.plans?.length ? settings.plans : defaultPricingPlans,
      refreshSettings,
    }),
    [settings],
  );

  return React.createElement(SiteSettingsContext.Provider, { value }, children);
};

export const useSiteSettings = () => {
  const context = useContext(SiteSettingsContext);
  if (!context) {
    throw new Error("useSiteSettings must be used within SiteSettingsProvider");
  }
  return context;
};

declare global {
  interface Window {
    dataLayer: unknown[][];
    gtag?: (...args: unknown[]) => void;
  }
}
