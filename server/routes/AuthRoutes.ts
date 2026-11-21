import { Router } from "express";
import {
  deleteAccount,
  forgotPassword,
  getMe,
  loginUser,
  registerUser,
  resetPassword,
  updateProfile,
} from "../controller/AuthController.js";
import { protect } from "../middlewares/authMiddleware.js";
import {
  forgotPasswordRateLimiter,
  loginRateLimiter,
} from "../middlewares/rateLimiter.js";

const authRouter = Router();

authRouter.post("/register", registerUser);
authRouter.post("/login", loginRateLimiter, loginUser);
authRouter.post("/forgot-password", forgotPasswordRateLimiter, forgotPassword);
authRouter.post("/reset-password", resetPassword);
authRouter.get("/me", protect, getMe);
authRouter.put("/me", protect, updateProfile);
authRouter.delete("/account", protect, deleteAccount);

export default authRouter;
