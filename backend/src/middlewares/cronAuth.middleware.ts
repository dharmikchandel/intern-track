import crypto from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import { env } from "../config/env.js";

// Hash both sides first so timingSafeEqual always gets equal-length buffers
// and the comparison time doesn't leak how much of the secret matched.
export function secretMatches(given: string | undefined, expected: string) {
  const digest = (v: string) => crypto.createHash("sha256").update(v).digest();
  return crypto.timingSafeEqual(digest(given ?? ""), digest(expected));
}

// Guards the /internal/* routes that external schedulers call. Not configured
// = the endpoint doesn't exist (404), rather than "exists but locked".
export function requireCronSecret(req: Request, res: Response, next: NextFunction) {
  if (!env.CRON_SECRET) return res.status(404).json({ error: "Not found" });
  if (!secretMatches(req.header("x-cron-secret"), env.CRON_SECRET)) {
    return res.status(401).json({ error: "Invalid cron secret" });
  }
  return next();
}
