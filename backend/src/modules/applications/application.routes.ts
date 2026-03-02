import { Router } from "express";
import { requireAuth } from "../../middlewares/auth.middleware.js";
import { create, getById, list, remove, update } from "./application.controller.js";

const router = Router();

router.use(requireAuth);

router.post("/", create);
router.get("/", list);
router.get("/:id", getById);
router.patch("/:id", update);
router.delete("/:id", remove);

export default router;
