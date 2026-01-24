import { Router } from "express";
import authRoutes from "./modules/auth/auth.routes.ts";
import analyticsRoutes from "./modules/analytics/analytics.routes.ts";
import applicationRoutes from "./modules/applications/application.routes.ts";

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
