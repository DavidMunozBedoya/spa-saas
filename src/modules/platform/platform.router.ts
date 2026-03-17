import { Router } from "express";
import { PlatformController } from "./platform.controller.js";
import { authenticateToken } from "../../middleware/auth.js";
import { superAdminAuth } from "../../middleware/superAdmin.js";
import { validate } from "../../middleware/validate.js";
import { RegisterSpaSchema, CreatePlatformUserSchema, UpdatePlatformUserSchema } from "./platform.schema.js";

const router = Router();
const platformController = new PlatformController();

// Todas las rutas de plataforma ya tienen authenticateToken y platform:manage en app.ts
// Solo añadimos superAdminAuth como capa extra de seguridad específica
router.use(superAdminAuth);

router.get("/spas", platformController.getAllSpas);
router.post("/register", validate(RegisterSpaSchema), platformController.registerSpa);
router.patch("/spas/:id", platformController.updateSpa);
router.patch("/spas/:id/status", platformController.updateSpaStatus);
router.delete("/spas/:id", platformController.deleteSpa);
router.get("/stats", platformController.getStats);

// Rutas de Gestión de Usuarios de Plataforma
router.get("/users", platformController.getAllUsers);
router.post("/users", validate(CreatePlatformUserSchema), platformController.createPlatformUser);
router.patch("/users/:id", validate(UpdatePlatformUserSchema), platformController.updatePlatformUser);
router.delete("/users/:id", platformController.deletePlatformUser);

export default router;
