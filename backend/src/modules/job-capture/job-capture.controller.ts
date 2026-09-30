import type { Response } from "express";
import { z } from "zod";
import type { AuthRequest } from "../../middlewares/auth.middleware.js";
import { parseJobUrl } from "./job-capture.service.js";

const parseUrlSchema = z.object({ url: z.string().min(1).max(2048) });

export async function parseUrl(req: AuthRequest, res: Response) {
  const parsed = parseUrlSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Enter a valid http or https link", code: "INVALID_URL" });

  return res.status(200).json(await parseJobUrl(parsed.data.url));
}
