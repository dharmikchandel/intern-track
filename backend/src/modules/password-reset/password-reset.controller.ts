import type { Request, Response } from "express";
import { requestPasswordResetSchema, confirmPasswordResetSchema } from "./password-reset.schema.js";
import { requestPasswordReset, confirmPasswordReset } from "./password-reset.service.js";

export async function requestReset(req: Request, res: Response) {
  const parsed = requestPasswordResetSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  await requestPasswordReset(parsed.data.email);
  return res.status(200).json({ message: "If that email is registered, a reset link has been sent." });
}

export async function confirmReset(req: Request, res: Response) {
  const parsed = confirmPasswordResetSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  await confirmPasswordReset(parsed.data.token, parsed.data.password);
  return res.status(200).json({ message: "Password updated. Please log in again." });
}
