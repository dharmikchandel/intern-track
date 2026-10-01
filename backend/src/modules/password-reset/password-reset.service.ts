import { prisma } from "../../config/prisma.js";
import { env } from "../../config/env.js";
import { hashPassword } from "../../utils/password.js";
import { generateSecureToken, hashSecureToken } from "../../utils/secureToken.js";
import { sendEmail } from "../mail/mail.service.js";
import { AppError } from "../../utils/AppError.js";

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

// Always succeeds from the caller's point of view whether or not the email
// is registered — a different response for "no such user" would let this
// endpoint be used to enumerate registered emails.
export async function requestPasswordReset(email: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return;

  const { token, tokenHash } = generateSecureToken();
  await prisma.passwordResetToken.create({
    data: { userId: user.id, tokenHash, expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS) },
  });

  const resetLink = `${env.FRONTEND_URL}/reset-password?token=${token}`;
  await sendEmail({
    to: user.email,
    subject: "Reset your TRACKr password",
    html: `<p>Someone requested a password reset for your TRACKr account.</p>
           <p><a href="${resetLink}">Click here to reset your password</a>. This link expires in 1 hour.</p>
           <p>If you didn't request this, you can safely ignore this email — your password won't change.</p>`,
  });
}

export async function confirmPasswordReset(rawToken: string, newPassword: string) {
  const tokenHash = hashSecureToken(rawToken);
  const stored = await prisma.passwordResetToken.findUnique({ where: { tokenHash } });

  if (!stored || stored.usedAt || stored.expiresAt < new Date()) {
    throw new AppError("Invalid or expired reset link", 400, "INVALID_RESET_TOKEN");
  }

  const passwordHash = await hashPassword(newPassword);

  await prisma.$transaction([
    prisma.user.update({ where: { id: stored.userId }, data: { passwordHash } }),
    prisma.passwordResetToken.update({ where: { id: stored.id }, data: { usedAt: new Date() } }),
    // A password reset means "this account may have been compromised" —
    // every existing session should die, not just get left valid. Deleted, not
    // marked revoked: an old device presenting a revoked token would otherwise
    // trip theft detection and kill the session the user starts after the reset
    // (see logoutAllSessions).
    prisma.refreshToken.deleteMany({ where: { userId: stored.userId } }),
  ]);
}
