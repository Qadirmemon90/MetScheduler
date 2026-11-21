import { Request, Response } from "express";
import {
  defaultPlans,
  defaultPaymentMethods,
  defaultPolicies,
  SiteSettings,
} from "../models/SiteSettings.js";
import { delCachePattern } from "../config/redis.js";

const allowedPlanIds = ["free", "pro", "business"];

const plainPlan = (plan: any) => {
  const raw = typeof plan?.toObject === "function" ? plan.toObject() : plan || {};
  return {
    id: raw.id,
    name: raw.name,
    price: raw.price,
    period: raw.period,
    description: raw.description,
    features: Array.isArray(raw.features) ? [...raw.features] : [],
    cta: raw.cta,
    highlight: Boolean(raw.highlight),
    enabled: raw.enabled !== false,
  };
};

const ensureAllPlans = (plans: any[] = []) => {
  const planMap = new Map(
    plans.map((plan) => {
      const normalized = plainPlan(plan);
      return [normalized.id, normalized];
    }),
  );
  return defaultPlans.map((fallback) => ({
    ...fallback,
    ...(planMap.get(fallback.id) || {}),
    id: fallback.id,
  }));
};

export const getOrCreateSettings = async () => {
  let settings = await SiteSettings.findOne();

  if (!settings) {
    settings = await SiteSettings.create({
      plans: defaultPlans,
      paymentMethods: defaultPaymentMethods,
      policies: defaultPolicies,
    });
  }

  let needsSave = false;

  if (!settings.plans?.length || settings.plans.length < defaultPlans.length) {
    settings.plans = ensureAllPlans(settings.plans as any) as any;
    needsSave = true;
  }

  if (!settings.paymentMethods || Object.keys(settings.paymentMethods).length === 0) {
    settings.paymentMethods = defaultPaymentMethods;
    needsSave = true;
  }

  if (!settings.policies || Object.keys(settings.policies).length === 0) {
    settings.policies = defaultPolicies;
    needsSave = true;
  }

  if (needsSave) {
    await settings.save();
  }

  return settings;
};

const publicSettingsPayload = (settings: any) => ({
  siteName: settings.siteName || "MetScheduler",
  tagline: settings.tagline || "AI-Powered Social Media Scheduler & Content Engine",
  googleAnalyticsEnabled: Boolean(settings.googleAnalyticsEnabled),
  googleAnalyticsMeasurementId: settings.googleAnalyticsMeasurementId || "",
  maintenanceMode: Boolean(settings.maintenanceMode),
  vendorName: settings.vendorName,
  vendorEmail: settings.vendorEmail,
  vendorPhone: settings.vendorPhone,
  vendorWhatsapp: settings.vendorWhatsapp,
  supportEmail: settings.supportEmail,
  plans: ensureAllPlans(settings.plans).filter((plan) => plan.enabled),
  paymentMethods: settings.paymentMethods || defaultPaymentMethods,
  policies: settings.policies || defaultPolicies,
});

const sanitizePlans = (plans: any[] = []) =>
  ensureAllPlans(plans)
    .filter((plan) => allowedPlanIds.includes(plan.id))
    .map((plan) => ({
      id: plan.id,
      name: String(plan.name || "").trim() || plan.id,
      price: String(plan.price || "").trim() || "$0",
      period: String(plan.period || "").trim(),
      description: String(plan.description || "").trim(),
      features: Array.isArray(plan.features)
        ? plan.features
            .map((feature: unknown) => String(feature || "").trim())
            .filter(Boolean)
        : [],
      cta: String(plan.cta || "").trim(),
      highlight: Boolean(plan.highlight),
      enabled: plan.enabled !== false,
    }));

export const getPublicSettings = async (
  _req: Request,
  res: Response,
): Promise<void> => {
  try {
    const settings = await getOrCreateSettings();
    res.json(publicSettingsPayload(settings));
  } catch (error: any) {
    res.status(500).json({ message: error?.message || "Server error" });
  }
};

export const getPublicPolicies = async (
  _req: Request,
  res: Response,
): Promise<void> => {
  try {
    const settings = await getOrCreateSettings();
    res.json(settings.policies || defaultPolicies);
  } catch (error: any) {
    res.status(500).json({ message: error?.message || "Server error" });
  }
};

export const getAdminSettings = async (
  _req: Request,
  res: Response,
): Promise<void> => {
  try {
    const settings = await getOrCreateSettings();
    res.json(settings);
  } catch (error: any) {
    res.status(500).json({ message: error?.message || "Server error" });
  }
};

export const updateAdminSettings = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const settings = await getOrCreateSettings();
    const {
      siteName,
      tagline,
      googleAnalyticsEnabled,
      googleAnalyticsMeasurementId,
      maintenanceMode,
      vendorName,
      vendorEmail,
      vendorPhone,
      vendorWhatsapp,
      supportEmail,
      publicApiNote,
      plans,
      paymentMethods,
      policies,
    } = req.body;

    if (siteName !== undefined) settings.siteName = String(siteName).trim();
    if (tagline !== undefined) settings.tagline = String(tagline).trim();
    if (maintenanceMode !== undefined) settings.maintenanceMode = Boolean(maintenanceMode);
    if (googleAnalyticsEnabled !== undefined)
      settings.googleAnalyticsEnabled = Boolean(googleAnalyticsEnabled);
    if (googleAnalyticsMeasurementId !== undefined)
      settings.googleAnalyticsMeasurementId = String(googleAnalyticsMeasurementId).trim();
    if (vendorName !== undefined) settings.vendorName = String(vendorName).trim();
    if (vendorEmail !== undefined) settings.vendorEmail = String(vendorEmail).trim();
    if (vendorPhone !== undefined) settings.vendorPhone = String(vendorPhone).trim();
    if (vendorWhatsapp !== undefined) settings.vendorWhatsapp = String(vendorWhatsapp).trim();
    if (supportEmail !== undefined) settings.supportEmail = String(supportEmail).trim();
    if (publicApiNote !== undefined) settings.publicApiNote = String(publicApiNote).trim();

    if (plans) {
      settings.plans = sanitizePlans(plans) as any;
    }

    if (paymentMethods) {
      settings.paymentMethods = {
        ...(settings.paymentMethods || defaultPaymentMethods),
        ...paymentMethods,
      };
      settings.markModified("paymentMethods");
    }

    if (policies) {
      settings.policies = {
        ...(settings.policies || defaultPolicies),
        ...policies,
      };
      settings.markModified("policies");
    }

    await settings.save();

    // Invalidate Redis cache
    await delCachePattern("cache:*");

    res.json(settings);
  } catch (error: any) {
    res.status(500).json({ message: error?.message || "Server error" });
  }
};
