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
