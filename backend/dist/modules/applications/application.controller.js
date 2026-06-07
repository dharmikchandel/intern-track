import { createApplicationSchema, updateApplicationSchema, listApplicationsQuerySchema, } from "./application.schema.js";
import { createApplication, deleteApplication, getApplicationById, listApplications, updateApplication, } from "./application.service.js";
export async function create(req, res) {
    const parsed = createApplicationSchema.safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ error: parsed.error.flatten() });
    const app = await createApplication(req.userId, parsed.data);
    return res.status(201).json(app);
}
export async function getById(req, res) {
    try {
        const app = await getApplicationById(req.userId, req.params.id);
        return res.status(200).json(app);
    }
    catch (err) {
        if (err.message === "NOT_FOUND")
            return res.status(404).json({ error: "Application not found" });
        return res.status(500).json({ error: "Server error" });
    }
}
export async function update(req, res) {
    const parsed = updateApplicationSchema.safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ error: parsed.error.flatten() });
    try {
        const app = await updateApplication(req.userId, req.params.id, parsed.data);
        return res.status(200).json(app);
    }
    catch (err) {
        if (err.message === "NOT_FOUND")
            return res.status(404).json({ error: "Application not found" });
        return res.status(500).json({ error: "Server error" });
    }
}
export async function remove(req, res) {
    try {
        const result = await deleteApplication(req.userId, req.params.id);
        return res.status(200).json(result);
    }
    catch (err) {
        if (err.message === "NOT_FOUND")
            return res.status(404).json({ error: "Application not found" });
        return res.status(500).json({ error: "Server error" });
    }
}
export async function list(req, res) {
    const parsed = listApplicationsQuerySchema.safeParse(req.query);
    if (!parsed.success)
        return res.status(400).json({ error: parsed.error.flatten() });
    const page = parsed.data.page ?? 1;
    const limit = parsed.data.limit ?? 10;
    const result = await listApplications(req.userId, {
        ...parsed.data,
        page,
        limit,
    });
    return res.status(200).json(result);
}
//# sourceMappingURL=application.controller.js.map