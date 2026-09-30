import express, { Router } from "express";
import { requireAuth } from "../../middlewares/auth.middleware.js";
import { bulkDataRateLimiter, parseUrlRateLimiter } from "../../middlewares/rateLimit.middleware.js";
import { parseUrl } from "../job-capture/job-capture.controller.js";
import { exportCsv, importCsv, MAX_CSV_BYTES } from "../csv/csv.controller.js";
import { activity, board, create, getById, list, remove, update } from "./application.controller.js";

const router = Router();

router.use(requireAuth);

router.post("/", create);
router.post("/parse-url", parseUrlRateLimiter, parseUrl);
router.get("/", list);
// Must be registered before "/:id" or "board"/"export" are read as application ids.
router.get("/board", board);
router.get("/export", bulkDataRateLimiter, exportCsv);
// The body is the raw CSV text (not JSON), capped at 1 MB for this route only.
router.post("/import", bulkDataRateLimiter, express.text({ type: ["text/csv", "text/plain"], limit: MAX_CSV_BYTES }), importCsv);
router.get("/:id", getById);
router.get("/:id/activity", activity);
router.patch("/:id", update);
router.delete("/:id", remove);

export default router;
