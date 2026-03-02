import type { Response } from "express";
import type { AuthRequest } from "../../middlewares/auth.middleware.js";
import { getFunnel, getStatusCounts } from "./analytics.service.js";

export async function statusCounts(req: AuthRequest, res: Response) {
  const result = await getStatusCounts(req.userId!);
  return res.status(200).json(result);
}

export async function funnel(req: AuthRequest, res: Response) {
  const result = await getFunnel(req.userId!);
  return res.status(200).json(result);
}
