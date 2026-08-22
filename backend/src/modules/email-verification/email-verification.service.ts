import { prisma } from "../../config/prisma.js";
import { env } from "../../config/env.js";
import { generateSecureToken, hashSecureToken } from "../../utils/secureToken.js";
import { sendEmail } from "../mail/mail.service.js";
import { AppError } from "../../utils/AppError.js";

const VERIFICATION_TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export async function sendVerificationEmail(userId: string, email: string) {
  const { token, tokenHash } = generateSecureToken();
  await prisma.emailVerificationToken.create({
    data: { userId, tokenHash, expiresAt: new Date(Date.now() + VERIFICATION_TOKEN_TTL_MS) },
  });

  const verifyLink = `${env.FRONTEND_URL}/verify-email?token=${token}`;
  await sendEmail({
    to: email,
    subject: "Verify your TRACKr email",
    html: `<p>Welcome to TRACKr! Please confirm your email address to finish setting up your account.</p>
           <p><a href="${verifyLink}">Click here to verify your email</a>. This link expires in 24 hours.</p>`,
  });
}

export async function verifyEmail(rawToken: string) {
  const tokenHash = hashSecureToken(rawToken);
  const stored = await prisma.emailVerificationToken.findUnique({ where: { tokenHash } });

  if (!stored || stored.usedAt || stored.expiresAt < new Date()) {
    throw new AppError("Invalid or expired verification link", 400, "INVALID_VERIFICATION_TOKEN");
  }

  await prisma.$transaction([
    prisma.user.update({ where: { id: stored.userId }, data: { emailVerifiedAt: new Date() } }),
    prisma.emailVerificationToken.update({ where: { id: stored.id }, data: { usedAt: new Date() } }),
  ]);
}

export async function resendVerificationEmail(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError("User not found", 404, "USER_NOT_FOUND");
  if (user.emailVerifiedAt) throw new AppError("Email is already verified", 400, "ALREADY_VERIFIED");

  await sendVerificationEmail(user.id, user.email);
}
