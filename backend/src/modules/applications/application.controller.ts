import type { Request, Response } from "express";
import type { AuthRequest } from "../../middlewares/auth.middleware.js";
import {
  createApplicationSchema,
  updateApplicationSchema,
  listApplicationsQuerySchema,
} from "./application.schema.js";
import {
  createApplication,
  deleteApplication,
  getApplicationById,
  listApplications,
  updateApplication,
} from "./application.service.js";

type Params = {
  id: string;
}

export async function create(req: AuthRequest, res: Response) {
  const parsed = createApplicationSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const app = await createApplication(req.userId!, parsed.data);
  return res.status(201).json(app);
}

// Ownership/not-found failures throw AppError from the service layer and are
// handled centrally by errorHandler, so no per-route try/catch is needed.
export async function getById(req: AuthRequest & Request<Params>, res: Response) {
  const app = await getApplicationById(req.userId!, req.params.id);
  return res.status(200).json(app);
}

export async function update(req: AuthRequest & Request<Params>, res: Response) {
  const parsed = updateApplicationSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const app = await updateApplication(req.userId!, req.params.id, parsed.data);
  return res.status(200).json(app);
}

export async function remove(req: AuthRequest & Request<Params>, res: Response) {
  const result = await deleteApplication(req.userId!, req.params.id);
  return res.status(200).json(result);
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
