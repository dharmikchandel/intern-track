import type { Request, Response } from "express";
import { registerSchema, loginSchema } from "./auth.schema.js";
import {
  registerUser,
  loginUser,
  refreshSession,
  logoutSession,
  logoutAllSessions,
} from "./auth.service.js";
import { REFRESH_TOKEN_TTL_MS } from "../../utils/refreshToken.js";
import type { AuthRequest } from "../../middlewares/auth.middleware.js";
import { AppError } from "../../utils/AppError.js";

const REFRESH_COOKIE_NAME = "refreshToken";

// Cross-site in production (frontend on Vercel, backend on Render — different
// domains) needs SameSite=None + Secure, which browsers only honor over
// HTTPS. Locally frontend/backend share a scheme+host (just different
// ports), so Lax + no Secure is what actually works over http://localhost.
function refreshCookieOptions() {
  const isProd = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: (isProd ? "none" : "lax") as "none" | "lax",
    path: "/api/v1/auth",
    maxAge: REFRESH_TOKEN_TTL_MS,
  };
}

export function setRefreshCookie(res: Response, token: string) {
  res.cookie(REFRESH_COOKIE_NAME, token, refreshCookieOptions());
}

export function clearRefreshCookie(res: Response) {
  const options = refreshCookieOptions();
  res.clearCookie(REFRESH_COOKIE_NAME, options);
}

export async function register(req: Request, res: Response) {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { user, accessToken, refreshToken } = await registerUser(parsed.data.email, parsed.data.password);
  setRefreshCookie(res, refreshToken);
  return res.status(201).json({ user, accessToken });
}

export async function login(req: Request, res: Response) {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { user, accessToken, refreshToken } = await loginUser(parsed.data.email, parsed.data.password);
  setRefreshCookie(res, refreshToken);
  return res.status(200).json({ user, accessToken });
}

export async function refresh(req: Request, res: Response) {
  const rawToken = req.cookies?.[REFRESH_COOKIE_NAME];
  if (!rawToken) throw new AppError("Missing refresh token", 401, "MISSING_REFRESH_TOKEN");

  try {
    const { user, accessToken, refreshToken } = await refreshSession(rawToken);
    setRefreshCookie(res, refreshToken);
    return res.status(200).json({ user, accessToken });
  } catch (err) {
    // Whatever went wrong with the presented token (expired, reused,
    // unknown), the client no longer has a usable session — drop the
    // cookie so it doesn't keep retrying with a dead token.
    clearRefreshCookie(res);
    throw err;
  }
}

export async function logout(req: Request, res: Response) {
  const rawToken = req.cookies?.[REFRESH_COOKIE_NAME];
  if (rawToken) await logoutSession(rawToken);
  clearRefreshCookie(res);
  return res.status(204).send();
}

export async function logoutAll(req: AuthRequest, res: Response) {
  await logoutAllSessions(req.userId!);
  clearRefreshCookie(res);
  return res.status(204).send();
}
