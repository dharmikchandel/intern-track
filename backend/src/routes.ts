import { Router } from "express";
import authRoutes from "./modules/auth/auth.routes.js";
import analyticsRoutes from "./modules/analytics/analytics.routes.js";
import applicationRoutes from "./modules/applications/application.routes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/applications", applicationRoutes);
router.use("/analytics", analyticsRoutes);

router.get("/health", (_req, res) => {
  return res.status(200).json({
    success: true,
    message: "OK",
    timestamp: new Date().toISOString(),
  });
});


export default router;
