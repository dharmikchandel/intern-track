import { getFunnel, getStatusCounts } from "./analytics.service.js";
export async function statusCounts(req, res) {
    const result = await getStatusCounts(req.userId);
    return res.status(200).json(result);
}
export async function funnel(req, res) {
    const result = await getFunnel(req.userId);
    return res.status(200).json(result);
}
//# sourceMappingURL=analytics.controller.js.map