import { Response, NextFunction } from "express";
import { AuthRequest } from "./auth.js";

export const superAdminAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !req.user.isPlatformAdmin || req.user.role !== 'SUPER_ADMIN') {
        return res.status(403).json({ error: "Acceso denegado: Se requiere rol de SuperAdmin de la plataforma" });
    }
    next();
};
