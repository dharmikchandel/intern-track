import type { Response } from "express";
import type { AuthRequest } from "../../middlewares/auth.middleware.js";
import { getActivity, getFunnel, getStatusCounts } from "./analytics.service.js";

export async function statusCounts(req: AuthRequest, res: Response) {
  const result = await getStatusCounts(req.userId!);
  return res.status(200).json(result);
}

// `today` is the viewer's local calendar day, like the milestones endpoint.
export async function activity(req: AuthRequest, res: Response) {
  const today = typeof req.query.today === "string" && /^\d{4}-\d{2}-\d{2}$/.test(req.query.today) ? req.query.today : new Date().toISOString().slice(0, 10);
  return res.status(200).json(await getActivity(req.userId!, today));
}

export async function funnel(req: AuthRequest, res: Response) {
  const result = await getFunnel(req.userId!);
  return res.status(200).json(result);
}
