import express from "express";
import { getPublicPolicies, getPublicSettings, } from "../controller/siteSettingsController.js";
import { cacheMiddleware } from "../middlewares/cacheMiddleware.js";
const siteSettingsRouter = express.Router();
siteSettingsRouter.get("/public", cacheMiddleware(120, "site_public"), getPublicSettings);
siteSettingsRouter.get("/policies", cacheMiddleware(300, "site_policies"), getPublicPolicies);
export default siteSettingsRouter;
