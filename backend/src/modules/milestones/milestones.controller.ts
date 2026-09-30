import type { Response } from "express";
import type { AuthRequest } from "../../middlewares/auth.middleware.js";
import { AppError } from "../../utils/AppError.js";
import { getMilestones } from "./milestones.service.js";
import { resolveToday } from "./milestones.stats.js";

export async function milestones(req: AuthRequest, res: Response) {
  const raw = typeof req.query.today === "string" ? req.query.today : undefined;
  const today = resolveToday(raw, new Date());
  if (!today) throw new AppError("today must be a valid date (YYYY-MM-DD) within a day of the server's date", 400, "INVALID_DAY");

  return res.status(200).json(await getMilestones(req.userId!, today));
}
