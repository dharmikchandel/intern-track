import crypto from "node:crypto";
import type { Request, Response } from "express";
import type { AuthRequest } from "../../middlewares/auth.middleware.js";
import { env } from "../../config/env.js";
import { preferencesSchema, unsubscribeSchema } from "./digest.schema.js";
import { getPreferences, runWeeklyDigest, setPreferences, unsubscribeWithToken } from "./digest.service.js";

export async function unsubscribe(req: Request, res: Response) {
  const parsed = unsubscribeSchema.safeParse({ token: req.query.token ?? req.body?.token });
  if (!parsed.success) return res.status(400).json({ error: "Invalid unsubscribe link", code: "INVALID_UNSUBSCRIBE_TOKEN" });

  return res.status(200).json(await unsubscribeWithToken(parsed.data.token));
}

export async function getPrefs(req: AuthRequest, res: Response) {
  return res.status(200).json(await getPreferences(req.userId!));
}

export async function updatePrefs(req: AuthRequest, res: Response) {
  const parsed = preferencesSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  return res.status(200).json(await setPreferences(req.userId!, parsed.data.emailDigestEnabled));
}

// Hash both sides first so timingSafeEqual always gets equal-length buffers
// and the comparison time doesn't leak how much of the secret matched.
function secretMatches(given: string | undefined, expected: string) {
  const digest = (v: string) => crypto.createHash("sha256").update(v).digest();
  return crypto.timingSafeEqual(digest(given ?? ""), digest(expected));
}

export async function runDigest(req: Request, res: Response) {
  // Not configured = the endpoint doesn't exist, rather than "exists but locked".
  if (!env.CRON_SECRET) return res.status(404).json({ error: "Not found" });

  if (!secretMatches(req.header("x-cron-secret"), env.CRON_SECRET)) {
    return res.status(401).json({ error: "Invalid cron secret" });
  }

  return res.status(200).json(await runWeeklyDigest());
}
