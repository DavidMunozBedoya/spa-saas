import { Router } from "express";
import { UserController } from "./user.controller.js";
import { validate } from "../../middleware/validate.js";
import { CreateUserSchema, UpdateUserSchema } from "./user.schema.js";

import { authenticateToken, authorizePermission } from "../../middleware/auth.js";

const router = Router();
const userController = new UserController();

// Catálogo de Permisos (Solo Spa Admins o SuperAdmins)
router.get("/permissions/list", authenticateToken, userController.listAllPermissions);

// Gestión de Usuarios (Requiere permiso users:manage)
router.post("/", authorizePermission("users:manage"), validate(CreateUserSchema), userController.create);
router.get("/spa/:spa_id", authorizePermission("users:manage"), userController.getBySpa);
router.get("/:id", authorizePermission("users:manage"), userController.getById);
router.patch("/:id", authorizePermission("users:manage"), validate(UpdateUserSchema), userController.update);
router.delete("/:id", authorizePermission("users:manage"), userController.delete);
router.patch("/:id/restore", authorizePermission("users:manage"), userController.restore);

// Gestión de Permisos Dinámicos
router.get("/:id/permissions", authorizePermission("users:manage"), userController.getPermissions);
router.post("/:id/permissions/grant", authorizePermission("users:manage"), userController.grantPermission);
router.post("/:id/permissions/revoke", authorizePermission("users:manage"), userController.revokePermission);

export default router;
