import type { Request, Response } from "express";
import type { AuthRequest } from "../../middlewares/auth.middleware.ts";
import {
  createApplicationSchema,
  updateApplicationSchema,
  listApplicationsQuerySchema,
} from "./application.schema.ts";
import {
  createApplication,
  deleteApplication,
  getApplicationById,
  listApplications,
  updateApplication,
} from "./application.service.ts";

type Params = {
  id: string;
}

export async function create(req: AuthRequest, res: Response) {
  const parsed = createApplicationSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const app = await createApplication(req.userId!, parsed.data);
  return res.status(201).json(app);
}

export async function getById(req: AuthRequest & Request<Params>, res: Response) {
  try {
    const app = await getApplicationById(req.userId!, req.params.id);
    return res.status(200).json(app);
  } catch (err: any) {
    if (err.message === "NOT_FOUND") return res.status(404).json({ error: "Application not found" });
    return res.status(500).json({ error: "Server error" });
  }
}

export async function update(req: AuthRequest & Request<Params>, res: Response) {
  const parsed = updateApplicationSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  try {
    const app = await updateApplication(req.userId!, req.params.id, parsed.data);
    return res.status(200).json(app);
  } catch (err: any) {
    if (err.message === "NOT_FOUND") return res.status(404).json({ error: "Application not found" });
    return res.status(500).json({ error: "Server error" });
  }
}

export async function remove(req: AuthRequest & Request<Params>, res: Response) {
  try {
    const result = await deleteApplication(req.userId!, req.params.id);
    return res.status(200).json(result);
  } catch (err: any) {
    if (err.message === "NOT_FOUND") return res.status(404).json({ error: "Application not found" });
    return res.status(500).json({ error: "Server error" });
  }
}

export async function list(req: AuthRequest, res: Response) {
  const parsed = listApplicationsQuerySchema.safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const page = parsed.data.page ?? 1;
  const limit = parsed.data.limit ?? 10;

  const result = await listApplications(req.userId!, {
    ...parsed.data,
    page,
    limit,
  });

  return res.status(200).json(result);
}
