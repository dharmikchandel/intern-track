import type { Request, Response } from "express";
import { registerSchema, loginSchema } from "./auth.schema.js";
import { registerUser, loginUser } from "./auth.service.js";

export async function register(req: Request, res: Response) {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  // registerUser throws AppError on failure; Express 5 forwards the
  // rejection to errorHandler automatically, which already knows how to
  // turn it into the right status code.
  const result = await registerUser(parsed.data.email, parsed.data.password);
  return res.status(201).json(result);
}

export async function login(req: Request, res: Response) {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const result = await loginUser(parsed.data.email, parsed.data.password);
  return res.status(200).json(result);
}
