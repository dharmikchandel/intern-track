import { Router } from "express";
import { requireAuth } from "../../middlewares/auth.middleware.js";
import { publicRecapRateLimiter } from "../../middlewares/rateLimit.middleware.js";
import { create, list, preview, publicRecap, revoke } from "./recap.controller.js";

// Mounted at /recap (signed-in owner)
export const recapRouter = Router();
recapRouter.use(requireAuth);
recapRouter.get("/preview", preview);
recapRouter.get("/shares", list);
recapRouter.post("/shares", create);
recapRouter.delete("/shares/:id", revoke);

// Mounted at /public/recap (anyone with the link)
export const publicRecapRouter = Router();
publicRecapRouter.get("/:slug", publicRecapRateLimiter, publicRecap);
