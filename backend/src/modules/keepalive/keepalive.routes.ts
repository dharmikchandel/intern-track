import { Router } from "express";
import { requireCronSecret } from "../../middlewares/cronAuth.middleware.js";
import { keepalive } from "./keepalive.controller.js";

// Mounted at /internal/keepalive: called by the external scheduler only.
export const internalKeepaliveRouter = Router();
internalKeepaliveRouter.post("/", requireCronSecret, keepalive);
