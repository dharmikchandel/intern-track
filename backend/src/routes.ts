import { Router } from "express";
import authRoutes from "./modules/auth/auth.routes.js";
import analyticsRoutes from "./modules/analytics/analytics.routes.js";
import applicationRoutes from "./modules/applications/application.routes.js";
import passwordResetRoutes from "./modules/password-reset/password-reset.routes.js";
import { digestRouter, internalDigestRouter } from "./modules/digest/digest.routes.js";
import { recapRouter, publicRecapRouter } from "./modules/recap/recap.routes.js";
import emailVerificationRoutes from "./modules/email-verification/email-verification.routes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/applications", applicationRoutes);
router.use("/analytics", analyticsRoutes);
router.use("/password-reset", passwordResetRoutes);
router.use("/email-verification", emailVerificationRoutes);
router.use("/digest", digestRouter);
router.use("/recap", recapRouter);
router.use("/public/recap", publicRecapRouter);
router.use("/internal/digests", internalDigestRouter);

router.get("/health", (_req, res) => {
  return res.status(200).json({
    success: true,
    message: "OK",
    timestamp: new Date().toISOString(),
  });
});


export default router;
