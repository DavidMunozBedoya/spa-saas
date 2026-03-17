import { Router } from "express";
import { SpaController } from "./spa.controller.js";
import { validate } from "../../middleware/validate.js";
import { CreateSpaSchema, UpdateSpaSchema } from "./spa.schema.js";
import { authenticateToken, authorizePermission } from "../../middleware/auth.js";

const router = Router();
const spaController = new SpaController();

// Rutas de administración de plataforma (SuperAdmin)
router.post("/", authenticateToken, authorizePermission("platform:manage"), validate(CreateSpaSchema), spaController.create);
router.get("/", authenticateToken, authorizePermission("platform:manage"), spaController.getAll);

// Rutas de configuración de perfil (propias del Spa logueado)
router.get("/settings", authenticateToken, spaController.getSettings);
router.patch("/settings", authenticateToken, authorizePermission("spa:config"), validate(UpdateSpaSchema), spaController.updateSettings);

// Operaciones específicas por ID (SuperAdmin o acceso muy restringido)
router.get("/:id", authenticateToken, authorizePermission("platform:manage"), spaController.getById);
router.patch("/:id", authenticateToken, authorizePermission("platform:manage"), validate(UpdateSpaSchema), spaController.update);
router.delete("/:id", authenticateToken, authorizePermission("platform:manage"), spaController.delete);
router.patch("/:id/reactivate", authenticateToken, authorizePermission("platform:manage"), spaController.reactivate);

export default router;
