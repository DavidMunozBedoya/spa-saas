import { Router } from "express";
import { AuthController } from "./auth.controller.js";
import { validate } from "../../middleware/validate.js";
import { LoginSchema, RecoveryRequestSchema, PasswordResetSchema } from "./auth.schema.js";

const router = Router();
const authController = new AuthController();

router.post("/login", validate(LoginSchema), authController.login);
router.post("/platform/login", validate(LoginSchema), authController.platformLogin);

// Rutas de Recuperación
router.post("/recovery/request", validate(RecoveryRequestSchema), authController.requestPasswordReset);
router.post("/recovery/reset", validate(PasswordResetSchema), authController.resetPassword);

export default router;
