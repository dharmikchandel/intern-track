import type { Request, Response } from "express";
import { verifyEmailSchema } from "./email-verification.schema.js";
import { verifyEmail, resendVerificationEmail } from "./email-verification.service.js";
import type { AuthRequest } from "../../middlewares/auth.middleware.js";

export async function verify(req: Request, res: Response) {
  const parsed = verifyEmailSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  await verifyEmail(parsed.data.token);
  return res.status(200).json({ message: "Email verified." });
}

export async function resend(req: AuthRequest, res: Response) {
  await resendVerificationEmail(req.userId!);
  return res.status(200).json({ message: "Verification email sent." });
}
