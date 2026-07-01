import express from "express";
import {
  contactVendor,
  publicContactVendor,
} from "../controller/billingController.js";
import { protect } from "../middlewares/authMiddleware.js";

const billingRouter = express.Router();

billingRouter.post("/public-contact-vendor", publicContactVendor);
billingRouter.post("/contact-vendor", protect, contactVendor);

export default billingRouter;
