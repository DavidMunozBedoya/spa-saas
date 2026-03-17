import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { PermissionService } from "../modules/users/permission.service.js";

const jwtSecret = process.env.JWT_SECRET || "supersecretkey_change_me_in_production";
const permissionService = new PermissionService();

export interface AuthRequest extends Request {
    user?: {
        userId: string;
        spaId?: string;
        roleIds?: number[];
        role?: string;
        isPlatformAdmin?: boolean;
        permissions?: string[];
    };
}

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
        return res.status(401).json({ error: "Acceso denegado (Token faltante)" });
    }

    jwt.verify(token, jwtSecret, async (err: any, user: any) => {
        if (err) {
            return res.status(403).json({ error: "Token inválido o expirado" });
        }

        // Cargar permisos dinámicamente si es un usuario de Spa
        if (user.userId && user.spaId) {
            try {
                user.permissions = await permissionService.getUserPermissions(user.userId, user.spaId);
            } catch (error) {
                console.error("Error al cargar permisos:", error);
                user.permissions = [];
            }
        }

        (req as AuthRequest).user = user;
        next();
    });
};

/**
 * Middleware para requerir un permiso específico.
 */
export const authorizePermission = (permissionCode: string) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const authReq = req as AuthRequest;
        if (!authReq.user) {
            return res.status(401).json({ error: "No autenticado" });
        }

        // Super Admin tiene todos los permisos
        if (authReq.user.isPlatformAdmin) {
            return next();
        }

        const hasPermission = authReq.user.permissions?.includes(permissionCode);

        if (!hasPermission) {
            return res.status(403).json({
                error: `Permiso insuficiente: se requiere '${permissionCode}'`
            });
        }

        next();
    };
};
