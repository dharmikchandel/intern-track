import type { Request, Response } from "express";
import { registerSchema, loginSchema } from "./auth.schema.js";
import { registerUser, loginUser } from "./auth.service.js";

export async function register(req: Request, res: Response) {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  try {
    const result = await registerUser(parsed.data.email, parsed.data.password);
    return res.status(201).json(result);
  } catch (err: any) {
    if (err.message === "EMAIL_ALREADY_EXISTS") {
      return res.status(409).json({ error: "Email already registered" });
    }
    return res.status(500).json({ error: "Server error" });
  }
}

export async function login(req: Request, res: Response) {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  try {
    const result = await loginUser(parsed.data.email, parsed.data.password);
    return res.status(200).json(result);
  } catch (err: any) {
    if (err.message === "INVALID_CREDENTIALS") {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    return res.status(500).json({ error: "Server error" });
  }
}
