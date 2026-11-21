import express from "express";
import {
  contactVendor,
  getInvoiceById,
  getMyInvoices,
  getMyPayments,
  getPaymentMethods,
  publicContactVendor,
  submitPaymentProof,
} from "../controller/billingController.js";
import { protect } from "../middlewares/authMiddleware.js";
import { uploadSingleImage } from "../middlewares/uploadMiddleware.js";
import { cacheMiddleware } from "../middlewares/cacheMiddleware.js";

const billingRouter = express.Router();

billingRouter.get("/methods", cacheMiddleware(60, "billing_methods"), getPaymentMethods);
billingRouter.post("/submit-payment", protect, uploadSingleImage, submitPaymentProof);
billingRouter.get("/my-payments", protect, getMyPayments);
billingRouter.get("/invoices", protect, getMyInvoices);
billingRouter.get("/invoices/:id", protect, getInvoiceById);

// Legacy contact inquiry endpoints
billingRouter.post("/public-contact-vendor", publicContactVendor);
billingRouter.post("/contact-vendor", protect, contactVendor);

export default billingRouter;
