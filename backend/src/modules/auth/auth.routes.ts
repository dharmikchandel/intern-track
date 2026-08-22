import { Router } from "express";
import { register, login, refresh, logout, logoutAll } from "./auth.controller.js";
import { requireAuth } from "../../middlewares/auth.middleware.js";
import { authRateLimiter } from "../../middlewares/rateLimit.middleware.js";

const router = Router();

router.post("/register", authRateLimiter, register);
router.post("/login", authRateLimiter, login);
router.post("/refresh", authRateLimiter, refresh);
router.post("/logout", logout);
router.post("/logout-all", requireAuth, logoutAll);

export default router;
