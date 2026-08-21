import type { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError.js";

export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    // Expected, client-facing errors (404/401/409/...) aren't worth an
    // error-level log line each time; only unexpected failures are.
    if (err.statusCode >= 500) console.error("❌ ERROR:", err);
    return res.status(err.statusCode).json({ error: err.message, code: err.code });
  }

  console.error("❌ ERROR:", err);
  return res.status(500).json({ error: "Internal server error", code: "INTERNAL_ERROR" });
}
