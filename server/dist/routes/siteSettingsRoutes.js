import express from "express";
import { getPublicSettings } from "../controller/siteSettingsController.js";
const siteSettingsRouter = express.Router();
siteSettingsRouter.get("/public", getPublicSettings);
export default siteSettingsRouter;
