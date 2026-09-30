import { Router } from "express";
import { requireAuth } from "../../middlewares/auth.middleware.js";
import { milestones } from "./milestones.controller.js";

const router = Router();

router.use(requireAuth);
router.get("/", milestones);

export default router;
