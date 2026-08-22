import { prisma } from "../../config/prisma.js";
import { hashPassword, comparePassword } from "../../utils/password.js";
import { signAccessToken } from "../../utils/jwt.js";
import { generateRefreshToken, hashRefreshToken, REFRESH_TOKEN_TTL_MS } from "../../utils/refreshToken.js";
import { AppError } from "../../utils/AppError.js";
import { sendVerificationEmail } from "../email-verification/email-verification.service.js";

const USER_SELECT = { id: true, email: true, createdAt: true, emailVerifiedAt: true } as const;

// The frontend only needs to know verified-or-not, not the timestamp.
function toPublicUser(user: { id: string; email: string; createdAt: Date; emailVerifiedAt: Date | null }) {
  return {
    id: user.id,
    email: user.email,
    createdAt: user.createdAt,
    emailVerified: !!user.emailVerifiedAt,
  };
}

async function issueSession(userId: string) {
  const accessToken = signAccessToken({ userId });
  const { token: refreshToken, tokenHash } = generateRefreshToken();

  await prisma.refreshToken.create({
    data: {
      userId,
      tokenHash,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
    },
  });

  return { accessToken, refreshToken };
}

export async function registerUser(email: string, password: string) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new AppError("Email already registered", 409, "EMAIL_EXISTS");

  const passwordHash = await hashPassword(password);

  const user = await prisma.user.create({
    data: { email, passwordHash },
    select: USER_SELECT,
  });

  const { accessToken, refreshToken } = await issueSession(user.id);

  // Best-effort: a broken mail provider shouldn't fail registration itself —
  // the user can always hit /email-verification/resend afterwards.
  sendVerificationEmail(user.id, user.email).catch((err) => {
    console.error("⚠️ Failed to send verification email on register:", (err as Error).message);
  });

  return { user: toPublicUser(user), accessToken, refreshToken };
}

export async function loginUser(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new AppError("Invalid credentials", 401, "INVALID_CREDENTIALS");

  const ok = await comparePassword(password, user.passwordHash);
  if (!ok) throw new AppError("Invalid credentials", 401, "INVALID_CREDENTIALS");

  const { accessToken, refreshToken } = await issueSession(user.id);

  return {
    user: toPublicUser(user),
    accessToken,
    refreshToken,
  };
}

// Rotation: every refresh consumes the presented token and issues a new one.
// If a token that's already revoked gets presented again, that's a strong
// signal it was stolen and used by someone else after the legitimate client
// already rotated past it — the right response is to kill every session for
// that user, not just this one.
export async function refreshSession(rawToken: string) {
  const tokenHash = hashRefreshToken(rawToken);
  const stored = await prisma.refreshToken.findUnique({ where: { tokenHash } });

  if (!stored) throw new AppError("Invalid refresh token", 401, "INVALID_REFRESH_TOKEN");

  if (stored.revokedAt) {
    await prisma.refreshToken.updateMany({
      where: { userId: stored.userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    throw new AppError("Refresh token reuse detected", 401, "REFRESH_TOKEN_REUSE");
  }

  if (stored.expiresAt < new Date()) {
    throw new AppError("Refresh token expired", 401, "REFRESH_TOKEN_EXPIRED");
  }

  const user = await prisma.user.findUnique({
    where: { id: stored.userId },
    select: USER_SELECT,
  });
  if (!user) throw new AppError("Invalid refresh token", 401, "INVALID_REFRESH_TOKEN");

  await prisma.refreshToken.update({
    where: { id: stored.id },
    data: { revokedAt: new Date() },
  });

  const { accessToken, refreshToken } = await issueSession(user.id);

  return { user: toPublicUser(user), accessToken, refreshToken };
}

export async function logoutSession(rawToken: string) {
  const tokenHash = hashRefreshToken(rawToken);
  // Idempotent: logging out with an already-revoked/unknown token is a no-op,
  // not an error — the caller's goal (no active session) is already true.
  await prisma.refreshToken.updateMany({
    where: { tokenHash, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function logoutAllSessions(userId: string) {
  await prisma.refreshToken.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}
