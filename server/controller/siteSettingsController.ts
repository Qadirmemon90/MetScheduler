import { Response } from "express";
import { defaultPlans, SiteSettings } from "../models/SiteSettings.js";

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
  const planMap = new Map(plans.map((plan) => {
    const normalized = plainPlan(plan);
    return [normalized.id, normalized];
  }));
  return defaultPlans.map((fallback) => ({
    ...fallback,
    ...(planMap.get(fallback.id) || {}),
    id: fallback.id,
  }));
};

const getOrCreateSettings = async () => {
  let settings = await SiteSettings.findOne();

  if (!settings) {
    settings = await SiteSettings.create({ plans: defaultPlans });
  }

  if (!settings.plans?.length || settings.plans.length < defaultPlans.length) {
    settings.plans = ensureAllPlans(settings.plans as any) as any;
    await settings.save();
  }

  return settings;
};

const publicSettingsPayload = (settings: any) => ({
  googleAnalyticsEnabled: settings.googleAnalyticsEnabled,
  googleAnalyticsMeasurementId: settings.googleAnalyticsMeasurementId,
  vendorName: settings.vendorName,
  vendorEmail: settings.vendorEmail,
  vendorPhone: settings.vendorPhone,
  vendorWhatsapp: settings.vendorWhatsapp,
  supportEmail: settings.supportEmail,
  plans: ensureAllPlans(settings.plans).filter((plan) => plan.enabled),
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
  _req: any,
  res: Response,
): Promise<void> => {
  try {
    const settings = await getOrCreateSettings();
    res.json(publicSettingsPayload(settings));
  } catch (error: any) {
    res.status(500).json({ message: error?.message || "Server error" });
  }
};

export const getAdminSettings = async (
  _req: any,
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
  req: any,
  res: Response,
): Promise<void> => {
  try {
    const settings = await getOrCreateSettings();
    const {
      googleAnalyticsEnabled,
      googleAnalyticsMeasurementId,
      vendorName,
      vendorEmail,
      vendorPhone,
      vendorWhatsapp,
      supportEmail,
      publicApiNote,
      plans,
    } = req.body;

    settings.googleAnalyticsEnabled = Boolean(googleAnalyticsEnabled);
    settings.googleAnalyticsMeasurementId = String(
      googleAnalyticsMeasurementId || "",
    ).trim();
    settings.vendorName = String(vendorName || "").trim();
    settings.vendorEmail = String(vendorEmail || "").trim();
    settings.vendorPhone = String(vendorPhone || "").trim();
    settings.vendorWhatsapp = String(vendorWhatsapp || "").trim();
    settings.supportEmail = String(supportEmail || "").trim();
    settings.publicApiNote = String(publicApiNote || "").trim();
    settings.plans = sanitizePlans(plans) as any;

    await settings.save();
    res.json(settings);
  } catch (error: any) {
    res.status(500).json({ message: error?.message || "Server error" });
  }
};
