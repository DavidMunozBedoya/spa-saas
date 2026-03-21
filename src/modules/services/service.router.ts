import { Router } from "express";
import { ServiceController } from "./service.controller.js";
import { validate } from "../../middleware/validate.js";
import { CreateServiceSchema, UpdateServiceSchema } from "./service.schema.js";
import { authorizePermission } from "../../middleware/auth.js";

const router = Router();
const serviceController = new ServiceController();

router.post("/", authorizePermission("services:manage"), validate(CreateServiceSchema), serviceController.create);
router.get("/", authorizePermission("services:view"), serviceController.getBySpa);
router.get("/:id", authorizePermission("services:view"), serviceController.getById);
router.patch("/:id", authorizePermission("services:manage"), validate(UpdateServiceSchema), serviceController.update);
router.patch("/:id/restore", authorizePermission("services:manage"), serviceController.restore);
router.delete("/:id", authorizePermission("services:manage"), serviceController.delete);

export default router;
