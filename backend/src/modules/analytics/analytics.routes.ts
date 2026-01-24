import { Router } from "express";
import { requireAuth } from "../../middlewares/auth.middleware.ts";
import { funnel, statusCounts } from "./analytics.controller.ts";

const router = Router();

router.use(requireAuth);

router.get("/status-counts", statusCounts);
router.get("/funnel", funnel);

export default router;
