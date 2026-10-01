import { prisma } from "../../config/prisma.js";
import { AppError } from "../../utils/AppError.js";
import { comparePassword, hashPassword } from "../../utils/password.js";
import { issueSession, toPublicUser, USER_SELECT } from "../auth/auth.service.js";
import type { UpdateProfileInput } from "./profile.schema.js";

// The user's saved timezone, or null (treated as UTC). Used where "today" decides
// results, such as the follow-up due filter.
export async function getUserTimezone(userId: string): Promise<string | null> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { timezone: true } });
  return user?.timezone ?? null;
}

export async function getProfile(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: USER_SELECT });
  if (!user) throw new AppError("User not found", 404, "NOT_FOUND");
  return toPublicUser(user);
}

export async function updateProfile(userId: string, input: UpdateProfileInput) {
  const data: { displayName?: string | null; timezone?: string } = {};
  if (input.displayName !== undefined) data.displayName = input.displayName === null || input.displayName === "" ? null : input.displayName;
  if (input.timezone !== undefined) data.timezone = input.timezone;

  const user = await prisma.user.update({ where: { id: userId }, data, select: USER_SELECT });
  return toPublicUser(user);
}

// Changing the password ends every other session (a stolen session should not
// survive it) and hands this device a fresh one so the user is not logged out.
export async function changePassword(userId: string, currentPassword: string, newPassword: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { passwordHash: true } });
  if (!user) throw new AppError("User not found", 404, "NOT_FOUND");

  const ok = await comparePassword(currentPassword, user.passwordHash);
  if (!ok) throw new AppError("Current password is incorrect", 400, "WRONG_PASSWORD");
  if (await comparePassword(newPassword, user.passwordHash)) {
    throw new AppError("Choose a password you have not used here before", 400, "SAME_PASSWORD");
  }

  const passwordHash = await hashPassword(newPassword);
  await prisma.$transaction([
    prisma.user.update({ where: { id: userId }, data: { passwordHash } }),
    // Deleted, not revoked: see logoutAllSessions for why.
    prisma.refreshToken.deleteMany({ where: { userId } }),
  ]);
  return issueSession(userId);
}

// Everything the user owns (applications, activity, share links, tokens) goes
// with them: every relation is onDelete: Cascade.
export async function deleteAccount(userId: string, password: string, confirmEmail: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true, passwordHash: true } });
  if (!user) throw new AppError("User not found", 404, "NOT_FOUND");

  if (confirmEmail.trim().toLowerCase() !== user.email.toLowerCase()) {
    throw new AppError("The email you typed does not match your account", 400, "EMAIL_MISMATCH");
  }
  const ok = await comparePassword(password, user.passwordHash);
  if (!ok) throw new AppError("Password is incorrect", 400, "WRONG_PASSWORD");

  await prisma.user.delete({ where: { id: userId } });
}
