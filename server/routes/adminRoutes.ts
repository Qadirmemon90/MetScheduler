import express from "express";
import {
  approvePayment,
  deleteAdminPost,
  deleteUserAdmin,
  flushAdminCacheEndpoint,
  getAdminAccounts,
  getAdminActivityLogs,
  getAdminCacheStatusEndpoint,
  getAdminInquiries,
  getAdminInvoiceById,
  getAdminInvoices,
  getAdminOrganizations,
  getAdminPayments,
  getAdminPosts,
  getAdminStats,
  getAdminUsers,
  publishAdminPostNow,
  rejectPayment,
  requestMoreInfoPayment,
  resetUserPasswordAdmin,
  updateInquiryStatus,
  updateOrganizationStatus,
  updateUserPlan,
  updateUserRole,
  updateUserStatus,
} from "../controller/adminController.js";
import {
  getAdminSettings,
  updateAdminSettings,
} from "../controller/siteSettingsController.js";
import { protect, requireAdmin } from "../middlewares/authMiddleware.js";

const adminRouter = express.Router();

adminRouter.use(protect, requireAdmin);

// Dashboard & Stats
adminRouter.get("/stats", getAdminStats);

// Payments (Pakistani manual transfers)
adminRouter.get("/payments", getAdminPayments);
adminRouter.patch("/payments/:id/approve", approvePayment);
adminRouter.patch("/payments/:id/reject", rejectPayment);
adminRouter.patch("/payments/:id/request-info", requestMoreInfoPayment);

// Invoices
adminRouter.get("/invoices", getAdminInvoices);
adminRouter.get("/invoices/:id", getAdminInvoiceById);

// Organizations / Tenants
adminRouter.get("/organizations", getAdminOrganizations);
adminRouter.patch("/organizations/:id/status", updateOrganizationStatus);

// Users management
adminRouter.get("/users", getAdminUsers);
adminRouter.patch("/users/:id/plan", updateUserPlan);
adminRouter.patch("/users/:id/role", updateUserRole);
adminRouter.patch("/users/:id/status", updateUserStatus);
adminRouter.post("/users/:id/reset-password", resetUserPasswordAdmin);
adminRouter.delete("/users/:id", deleteUserAdmin);

// Posts & Scheduler management
adminRouter.get("/posts", getAdminPosts);
adminRouter.delete("/posts/:id", deleteAdminPost);
adminRouter.post("/posts/:id/publish-now", publishAdminPostNow);

// Connected Social Accounts
adminRouter.get("/accounts", getAdminAccounts);

// Inquiries
adminRouter.get("/inquiries", getAdminInquiries);
adminRouter.patch("/inquiries/:id", updateInquiryStatus);

// Settings, Policies & Pricing
adminRouter.get("/settings", getAdminSettings);
adminRouter.put("/settings", updateAdminSettings);

// Redis Cache Management
adminRouter.get("/cache-status", getAdminCacheStatusEndpoint);
adminRouter.post("/flush-cache", flushAdminCacheEndpoint);

// Audit & Activity Logs
adminRouter.get("/activity-logs", getAdminActivityLogs);

export default adminRouter;
