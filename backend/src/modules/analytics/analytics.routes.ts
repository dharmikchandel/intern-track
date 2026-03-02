import { Router } from "express";
import { requireAuth } from "../../middlewares/auth.middleware.js";
import { funnel, statusCounts } from "./analytics.controller.js";

const router = Router();

router.use(requireAuth);

router.get("/status-counts", statusCounts);
router.get("/funnel", funnel);

export default router;
