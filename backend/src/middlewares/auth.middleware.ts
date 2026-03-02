import type { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/jwt.js";

export interface AuthRequest extends Request {
  userId?: string;
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing token" });
  }

  const token = auth.split(" ")[1];
  if (!token) {
  return res.status(401).json({ error: "No token provided" });
}

  try {
    const decoded = verifyAccessToken(token) as any;
    req.userId = decoded.userId;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid/expired token" });
  }
}
