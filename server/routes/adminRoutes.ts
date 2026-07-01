import express from "express";
import {
  getAdminInquiries,
  getAdminPosts,
  getAdminStats,
  getAdminUsers,
  updateInquiryStatus,
  updateUserPlan,
} from "../controller/adminController.js";
import {
  getAdminSettings,
  updateAdminSettings,
} from "../controller/siteSettingsController.js";
import { protect, requireAdmin } from "../middlewares/authMiddleware.js";

const adminRouter = express.Router();

adminRouter.use(protect, requireAdmin);

adminRouter.get("/stats", getAdminStats);
adminRouter.get("/users", getAdminUsers);
adminRouter.get("/posts", getAdminPosts);
adminRouter.get("/inquiries", getAdminInquiries);
adminRouter.get("/settings", getAdminSettings);
adminRouter.put("/settings", updateAdminSettings);
adminRouter.patch("/inquiries/:id", updateInquiryStatus);
adminRouter.patch("/users/:id/plan", updateUserPlan);

export default adminRouter;
