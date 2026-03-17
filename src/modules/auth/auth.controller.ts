import { Request, Response } from "express";
import { AuthService } from "./auth.service.js";
import { AuthRecoveryService } from "./auth.recovery.service.js";

const authService = new AuthService();
const authRecoveryService = new AuthRecoveryService();

export class AuthController {
    /**
     * Maneja el inicio de sesión para usuarios de Spas (Staff/Admins/Owners).
     */
    async login(req: Request, res: Response) {
        try {
            const result = await authService.login(req.body);
            return res.json(result);
        } catch (error: any) {
            return res.status(401).json({ error: error.message });
        }
    }

    /**
     * Maneja el inicio de sesión para administradores globales de la plataforma.
     */
    async platformLogin(req: Request, res: Response) {
        try {
            const result = await authService.platformLogin(req.body);
            return res.json(result);
        } catch (error: any) {
            return res.status(401).json({ error: error.message });
        }
    }

    /**
     * Inicia el proceso de recuperación de contraseña.
     */
    async requestPasswordReset(req: Request, res: Response) {
        try {
            const { email } = req.body;
            const result = await authRecoveryService.requestReset(email);
            return res.json(result);
        } catch (error: any) {
            return res.status(500).json({ error: error.message });
        }
    }

    /**
     * Completa el cambio de contraseña usando el token de recuperación.
     */
    async resetPassword(req: Request, res: Response) {
        try {
            const { token, password } = req.body;
            const result = await authRecoveryService.resetPassword(token, password);
            return res.json(result);
        } catch (error: any) {
            return res.status(400).json({ error: error.message });
        }
    }
}
