import { Router } from "express";
import { verify, resend } from "./email-verification.controller.js";
import { requireAuth } from "../../middlewares/auth.middleware.js";
import { authRateLimiter } from "../../middlewares/rateLimit.middleware.js";

const router = Router();

router.post("/verify", authRateLimiter, verify);
router.post("/resend", requireAuth, authRateLimiter, resend);

export default router;
