import type { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError.js";

export function errorHandler(err: any, _req: Request, res: Response, next: NextFunction) {
  // Once a response has started (e.g. a streamed download that failed midway)
  // a JSON error can't be sent; let Express close the connection instead.
  if (res.headersSent) return next(err);

  if (err instanceof AppError) {
    // Expected, client-facing errors (404/401/409/...) aren't worth an
    // error-level log line each time; only unexpected failures are.
    // Setting res.err hands it to pino-http's own request-finish log line
    // instead of writing a second, separate one here.
    if (err.statusCode >= 500) res.err = err;
    return res.status(err.statusCode).json({ error: err.message, code: err.code });
  }

  // Client mistakes raised by Express's own body parsers (malformed JSON,
  // a body over the size limit): answer with their 4xx instead of a 500.
  if (err?.expose === true && typeof err.status === "number" && err.status >= 400 && err.status < 500) {
    const code = err.type === "entity.too.large" ? "PAYLOAD_TOO_LARGE" : "BAD_REQUEST";
    const message = err.type === "entity.too.large" ? "The request body is too large" : "The request body could not be read";
    return res.status(err.status).json({ error: message, code });
  }

  res.err = err;
  return res.status(500).json({ error: "Internal server error", code: "INTERNAL_ERROR" });
}
