import type { Response } from "express";
import type { AuthRequest } from "../../middlewares/auth.middleware.js";
import { clearRefreshCookie, setRefreshCookie } from "../auth/auth.controller.js";
import { changePasswordSchema, deleteAccountSchema, updateProfileSchema } from "./profile.schema.js";
import { changePassword, deleteAccount, getProfile, updateProfile } from "./profile.service.js";

export async function show(req: AuthRequest, res: Response) {
  return res.status(200).json(await getProfile(req.userId!));
}

export async function update(req: AuthRequest, res: Response) {
  const parsed = updateProfileSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  return res.status(200).json(await updateProfile(req.userId!, parsed.data));
}

export async function password(req: AuthRequest, res: Response) {
  const parsed = changePasswordSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { accessToken, refreshToken } = await changePassword(req.userId!, parsed.data.currentPassword, parsed.data.newPassword);
  setRefreshCookie(res, refreshToken);
  return res.status(200).json({ accessToken });
}

export async function remove(req: AuthRequest, res: Response) {
  const parsed = deleteAccountSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  await deleteAccount(req.userId!, parsed.data.password, parsed.data.confirmEmail);
  clearRefreshCookie(res);
  return res.status(204).send();
}
