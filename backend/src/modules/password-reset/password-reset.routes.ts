import { Router } from "express";
import { requestReset, confirmReset } from "./password-reset.controller.js";
import { authRateLimiter } from "../../middlewares/rateLimit.middleware.js";

const router = Router();

router.post("/request", authRateLimiter, requestReset);
router.post("/confirm", authRateLimiter, confirmReset);

export default router;
