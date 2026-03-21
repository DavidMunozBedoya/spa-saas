import { Request, Response } from "express";
import { UserService } from "./user.service.js";
import { UpdateUserSchema } from "./user.schema.js";
import { PermissionService } from "./permission.service.js";
import { AuthRequest } from "../../middleware/auth.js";

const userService = new UserService();
const permissionService = new PermissionService();

export class UserController {
    /**
     * Registra un nuevo usuario en un Spa, encriptando su contraseña.
     */
    async create(req: Request, res: Response) {
        try {
            const userToken = (req as AuthRequest).user;
            const spaId = userToken?.spaId;

            // Inyectar o sobreescribir el spa_id del token por seguridad
            const userData = { ...req.body };
            if (spaId) {
                userData.spa_id = spaId;
            }

            const user = await userService.createUser(userData);
            return res.status(201).json(user);
        } catch (error: any) {
            if (error.message.includes("violates unique constraint")) {
                return res.status(400).json({ error: "El email ya está registrado" });
            }
            return res.status(500).json({ error: error.message });
        }
    }

    /**
     * Obtiene la lista de usuarios activos de un Spa, validando el aislamiento.
     */
    async getBySpa(req: Request, res: Response) {
        try {
            const { spa_id } = req.params;
            const authReq = req as AuthRequest;
            const spaIdFromToken = authReq.user?.spaId;

            if (spaIdFromToken && spa_id !== spaIdFromToken && !authReq.user?.isPlatformAdmin) {
                return res.status(403).json({ error: "No tiene permiso para acceder a los usuarios de otro Spa" });
            }

            const includeArchived = req.query.includeArchived === "true";
            const users = await userService.getBySpa(spa_id as string, includeArchived);
            return res.json(users);
        } catch (error: any) {
            return res.status(500).json({ error: error.message });
        }
    }

    /**
     * Obtiene los detalles de un usuario por su ID, filtrado por Spa.
     */
    async getById(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const authReq = req as AuthRequest;
            const spaId = authReq.user?.spaId;

            if (!spaId && !authReq.user?.isPlatformAdmin) return res.status(403).json({ error: "Contexto de Spa no encontrado" });

            const user = await userService.getById(id as string, spaId as string);
            if (!user) return res.status(404).json({ error: "Usuario no encontrado" });
            return res.json(user);
        } catch (error: any) {
            return res.status(500).json({ error: error.message });
        }
    }

    /**
     * Actualiza la información de un usuario, validando el aislamiento de Spa.
     */
    async update(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const authReq = req as AuthRequest;
            const spaId = authReq.user?.spaId;

            if (!spaId && !authReq.user?.isPlatformAdmin) return res.status(403).json({ error: "Contexto de Spa no encontrado" });

            const validatedData = UpdateUserSchema.parse(req.body);
            const updatedUser = await userService.updateUser(id as string, spaId as string, validatedData);
            if (!updatedUser) return res.status(404).json({ error: "Usuario no encontrado o no pertenece a su Spa" });
            return res.json(updatedUser);
        } catch (error: any) {
            if (error.name === "ZodError") {
                return res.status(400).json({ error: error.errors });
            }
            return res.status(500).json({ error: error.message });
        }
    }

    /**
     * Realiza el borrado lógico de un usuario, validando el aislamiento de Spa.
     */
    async delete(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const authReq = req as AuthRequest;
            const spaId = authReq.user?.spaId;

            if (!spaId && !authReq.user?.isPlatformAdmin) return res.status(403).json({ error: "Contexto de Spa no encontrado" });

            const user = await userService.softDeleteUser(id as string, spaId as string);
            if (!user) return res.status(404).json({ error: "Usuario no encontrado o no pertenece a su Spa" });
            return res.json({ message: "Credenciales de Usuario archivadas exitosamente", user });
        } catch (error: any) {
            return res.status(500).json({ error: error.message });
        }
    }

    /**
     * Reactiva o restaura el acceso de un usuario suspendido, validando el aislamiento.
     */
    async restore(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const authReq = req as AuthRequest;
            const spaId = authReq.user?.spaId;

            if (!spaId && !authReq.user?.isPlatformAdmin) return res.status(403).json({ error: "Contexto de Spa no encontrado" });

            const user = await userService.restoreUser(id as string, spaId as string);
            if (!user) return res.status(404).json({ error: "Usuario no encontrado o no pertenece a su Spa" });
            return res.json({ message: "Accesos restaurados exitosamente", user });
        } catch (error: any) {
            return res.status(500).json({ error: error.message });
        }
    }

    /**
     * Otorga un permiso específico a un usuario.
     */
    async grantPermission(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { permission_code } = req.body;
            const authReq = req as AuthRequest;
            const spaId = authReq.user?.spaId;

            if (!spaId && !authReq.user?.isPlatformAdmin) return res.status(403).json({ error: "Contexto de Spa no encontrado" });

            await permissionService.grantPermission(id as string, spaId as string, permission_code);
            return res.json({ message: `Permiso '${permission_code}' otorgado con éxito` });
        } catch (error: any) {
            return res.status(500).json({ error: error.message });
        }
    }

    /**
     * Revoca un permiso específico de un usuario.
     */
    async revokePermission(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { permission_code } = req.body;
            const authReq = req as AuthRequest;
            const spaId = authReq.user?.spaId;

            if (!spaId && !authReq.user?.isPlatformAdmin) return res.status(403).json({ error: "Contexto de Spa no encontrado" });

            await permissionService.revokePermission(id as string, spaId as string, permission_code);
            return res.json({ message: `Permiso '${permission_code}' revocado con éxito` });
        } catch (error: any) {
            return res.status(500).json({ error: error.message });
        }
    }

    /**
     * Lista todos los permisos agregados del usuario (Roles + Directos).
     */
    async getPermissions(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const authReq = req as AuthRequest;
            const spaId = authReq.user?.spaId;

            if (!spaId && !authReq.user?.isPlatformAdmin) return res.status(403).json({ error: "Contexto de Spa no encontrado" });

            const permissions = await permissionService.getUserPermissions(id as string, spaId as string);
            return res.json({ permissions });
        } catch (error: any) {
            return res.status(500).json({ error: error.message });
        }
    }

    /**
     * Lista todos los permisos definidos en el sistema.
     */
    async listAllPermissions(req: Request, res: Response) {
        try {
            const permissions = await permissionService.getAllPermissions();
            return res.json(permissions);
        } catch (error: any) {
            return res.status(500).json({ error: error.message });
        }
    }
}
