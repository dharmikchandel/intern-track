import { Router } from "express";
import { requireAuth } from "../../middlewares/auth.middleware.js";
import { authRateLimiter } from "../../middlewares/rateLimit.middleware.js";
import { password, remove, show, update } from "./profile.controller.js";

// Mounted at /profile
const router = Router();

router.use(requireAuth);

router.get("/", show);
router.patch("/", update);
// Password-guarded, so they share the strict auth limiter.
router.post("/password", authRateLimiter, password);
router.delete("/", authRateLimiter, remove);

export default router;
