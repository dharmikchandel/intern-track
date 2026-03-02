import { prisma } from "../../config/prisma.js";
import { hashPassword, comparePassword } from "../../utils/password.js";
import { signAccessToken, signRefreshToken } from "../../utils/jwt.js";
import { AppError } from "../../utils/AppError.js";

export async function registerUser(email: string, password: string) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new AppError("Email already registered", 409, "EMAIL_EXISTS");

  const passwordHash = await hashPassword(password);

  const user = await prisma.user.create({
    data: { email, passwordHash },
    select: { id: true, email: true, createdAt: true },
  });

  const accessToken = signAccessToken({ userId: user.id });
  const refreshToken = signRefreshToken({ userId: user.id });

  return { user, accessToken, refreshToken };
}

export async function loginUser(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new AppError("Invalid credentials", 401, "INVALID_CREDENTIALS");

  const ok = await comparePassword(password, user.passwordHash);
  if (!ok) throw new AppError("Invalid credentials", 401, "INVALID_CREDENTIALS");

  const accessToken = signAccessToken({ userId: user.id });
  const refreshToken = signRefreshToken({ userId: user.id });

  return {
    user: { id: user.id, email: user.email, createdAt: user.createdAt },
    accessToken,
    refreshToken,
  };
}