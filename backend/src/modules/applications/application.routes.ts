import { Router } from "express";
import { requireAuth } from "../../middlewares/auth.middleware.ts";
import { create, getById, list, remove, update } from "./application.controller.ts";

const router = Router();

router.use(requireAuth);

router.post("/", create);
router.get("/", list);
router.get("/:id", getById);
router.patch("/:id", update);
router.delete("/:id", remove);

export default router;
