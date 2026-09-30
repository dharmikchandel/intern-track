import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import type { AuthRequest } from "./auth.middleware.js";

export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // 200 requests per IP per window
  standardHeaders: true,
  legacyHeaders: false,
});

// Tighter limit for credential-guessing-prone routes (login, register,
// refresh) — 200 req/15min from apiRateLimiter is fine for normal app use
// but far too permissive for brute-forcing a password or hammering /refresh.
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many auth attempts, please try again later." },
});

// URL capture makes the server fetch third-party pages, so it gets its own,
// much tighter budget, counted per signed-in user (not per IP) so one user
// can't burn it for others behind the same proxy.
export const parseUrlRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => (req as AuthRequest).userId ?? ipKeyGenerator(req.ip ?? ""),
  message: { error: "Too many link lookups, please try again later.", code: "RATE_LIMITED" },
});

// The public recap page is reachable without logging in, so it is limited per
// IP. Generous enough for a link going round a group chat, tight enough that
// the endpoint can't be hammered or used to probe for slugs.
export const publicRecapRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please slow down.", code: "RATE_LIMITED" },
});

// Import parses up to 1 MB and writes up to 2,000 rows; export scans the user's
// whole table. Both are one-off actions for a person, so a modest per-user
// budget (a preview and a confirm are two calls) is plenty.
export const bulkDataRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => (req as AuthRequest).userId ?? ipKeyGenerator(req.ip ?? ""),
  message: { error: "Too many import/export requests, please try again later.", code: "RATE_LIMITED" },
});
