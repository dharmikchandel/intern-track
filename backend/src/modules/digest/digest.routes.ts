import { Router } from "express";
import { requireCronSecret } from "../../middlewares/cronAuth.middleware.js";
import { requireAuth } from "../../middlewares/auth.middleware.js";
import { getPrefs, runDigest, unsubscribe, updatePrefs } from "./digest.controller.js";

// Mounted at /digest
export const digestRouter = Router();
// Public: authenticated by the signed token in the link, not by a session.
digestRouter.post("/unsubscribe", unsubscribe);
digestRouter.get("/preferences", requireAuth, getPrefs);
digestRouter.patch("/preferences", requireAuth, updatePrefs);

// Mounted at /internal/digests: called by the external scheduler only.
export const internalDigestRouter = Router();
internalDigestRouter.post("/run", requireCronSecret, runDigest);
