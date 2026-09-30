import type { Request, Response } from "express";
import type { AuthRequest } from "../../middlewares/auth.middleware.js";
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

// The shared-secret check lives in requireCronSecret (see digest.routes.ts).
export async function runDigest(_req: Request, res: Response) {
  return res.status(200).json(await runWeeklyDigest());
}
