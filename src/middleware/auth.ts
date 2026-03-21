import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { PermissionService } from "../modules/users/permission.service.js";

// ─── JWT Secret Validado al arrancar ───

if (!process.env.JWT_SECRET) {
    throw new Error("FATAL ERROR: JWT_SECRET environment variable is not defined");
}
const jwtSecret = process.env.JWT_SECRET;

const permissionService = new PermissionService();

// ─── Interfaz del payload decodificado del JWT ───

export interface JwtPayload {
    userId: string;
    spaId?: string;
    staffId?: string | null;
    roleIds?: number[];
    role?: string;         // "SUPER_ADMIN" para platform_users
    isPlatformAdmin?: boolean;
}

// ─── Interfaz de Request autenticado ───

export interface AuthUser extends JwtPayload {
    permissions?: string[];
}

export interface AuthRequest extends Request {
    user?: AuthUser;
}

// ─── Middleware de autenticación ───

export const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
        return res.status(401).json({ error: "Acceso denegado (Token faltante)" });
    }

    try {
        const decoded = jwt.verify(token, jwtSecret) as JwtPayload;

        const authUser: AuthUser = { ...decoded };

        // Cargar permisos dinámicamente si es un usuario de Spa
        if (decoded.userId && decoded.spaId) {
            authUser.permissions = await permissionService.getUserPermissions(decoded.userId, decoded.spaId);
        }

        (req as AuthRequest).user = authUser;
        next();
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            return res.status(401).json({ error: "Token expirado, inicia sesión nuevamente" });
        }
        if (error instanceof jwt.JsonWebTokenError) {
            return res.status(401).json({ error: "Token inválido" });
        }
        // Error inesperado (DB, permisos, etc.)
        console.error("Error crítico en autenticación:", error);
        next(error);
    }
};

// ─── Middleware de autorización por permiso ───

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
