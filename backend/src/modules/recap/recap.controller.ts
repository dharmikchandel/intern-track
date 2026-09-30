import type { Request, Response } from "express";
import type { AuthRequest } from "../../middlewares/auth.middleware.js";
import { periodSchema } from "./recap.schema.js";
import { parsePeriod } from "./recap.stats.js";
import { createShare, getPublicRecap, listShares, previewRecap, revokeShare } from "./recap.service.js";

type IdParams = { id: string };

function readPeriod(source: unknown) {
  const parsed = periodSchema.safeParse(source);
  if (!parsed.success) return null;
  return parsePeriod(parsed.data.periodStart, parsed.data.periodEnd);
}

const invalidPeriod = (res: Response) =>
  res.status(400).json({ error: "Choose a valid start and end date", code: "INVALID_PERIOD" });

export async function preview(req: AuthRequest, res: Response) {
  const period = readPeriod(req.query);
  if (!period) return invalidPeriod(res);
  return res.status(200).json(await previewRecap(req.userId!, period));
}

export async function create(req: AuthRequest, res: Response) {
  const period = readPeriod(req.body);
  if (!period) return invalidPeriod(res);
  return res.status(201).json(await createShare(req.userId!, period));
}

export async function list(req: AuthRequest, res: Response) {
  return res.status(200).json({ items: await listShares(req.userId!) });
}

export async function revoke(req: AuthRequest & Request<IdParams>, res: Response) {
  return res.status(200).json(await revokeShare(req.userId!, req.params.id));
}

// Public, unauthenticated. `no-cache` (not max-age): browsers must revalidate
// every time, so turning a link off takes effect immediately instead of after a
// cache window. The response is one indexed row read and Express adds an ETag,
// so repeat views are cheap 304s. noindex keeps share links out of search results.
export async function publicRecap(req: Request<{ slug: string }>, res: Response) {
  const recap = await getPublicRecap(req.params.slug);
  res.set("Cache-Control", "no-cache");
  res.set("X-Robots-Tag", "noindex, nofollow");
  return res.status(200).json(recap);
}
