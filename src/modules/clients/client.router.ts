import { Router } from "express";
import { ClientController } from "./client.controller.js";
import { validate } from "../../middleware/validate.js";
import { CreateClientSchema, UpdateClientSchema } from "./client.schema.js";
import { authenticateToken, authorizePermission } from "../../middleware/auth.js";

const router = Router();
const clientController = new ClientController();

router.use(authenticateToken);

router.post("/", authorizePermission("clients:manage"), validate(CreateClientSchema), clientController.create);
router.get("/", authorizePermission("clients:view"), clientController.getBySpa);
router.get("/search", authorizePermission("clients:view"), clientController.findByIdentity);
router.get("/:id", authorizePermission("clients:view"), clientController.getById);
router.patch("/:id", authorizePermission("clients:manage"), validate(UpdateClientSchema), clientController.update);
router.delete("/:id", authorizePermission("clients:manage"), clientController.delete);

export default router;
