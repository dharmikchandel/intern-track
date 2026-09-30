import { Router } from "express";
import { requireAuth } from "../../middlewares/auth.middleware.js";
import { parseUrlRateLimiter } from "../../middlewares/rateLimit.middleware.js";
import { parseUrl } from "../job-capture/job-capture.controller.js";
import { activity, board, create, getById, list, remove, update } from "./application.controller.js";

const router = Router();

router.use(requireAuth);

router.post("/", create);
router.post("/parse-url", parseUrlRateLimiter, parseUrl);
router.get("/", list);
// Must be registered before "/:id" or "board" is read as an application id.
router.get("/board", board);
router.get("/:id", getById);
router.get("/:id/activity", activity);
router.patch("/:id", update);
router.delete("/:id", remove);

export default router;
