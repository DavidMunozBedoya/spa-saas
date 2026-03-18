import { Request, Response } from "express";
import { PlatformService } from "./platform.service.js";
import { hashPassword } from "../../utils/security.js";

const platformService = new PlatformService();

export class PlatformController {
    /**
     * Obtiene la lista completa de todos los Spas registrados en la plataforma.
     */
    async getAllSpas(_req: Request, res: Response) {
        try {
            const spas = await platformService.getAllSpas();
            return res.json(spas);
        } catch (error: any) {
            return res.status(500).json({ error: error.message });
        }
    }

    /**
     * Actualiza los datos comerciales de un Spa desde el panel global.
     */
    async updateSpa(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { name, email, phone, timezone } = req.body;
            const updated = await platformService.updateSpa(id as string, { name, email, phone, timezone });
            if (!updated) return res.status(404).json({ error: "Spa no encontrado" });
            return res.json(updated);
        } catch (error: any) {
            return res.status(500).json({ error: error.message });
        }
    }

    /**
     * Activa o desactiva un Spa desde el panel global.
     */
    async updateSpaStatus(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { active } = req.body;
            const updated = await platformService.updateSpaStatus(id as string, active);
            if (!updated) return res.status(404).json({ error: "Spa no encontrado" });
            return res.json(updated);
        } catch (error: any) {
            return res.status(500).json({ error: error.message });
        }
    }

    /**
     * Obtiene métricas globales de toda la infraestructura SaaS.
     */
    async getStats(_req: Request, res: Response) {
        try {
            const stats = await platformService.getGlobalStats();
            return res.json(stats);
        } catch (error: any) {
            return res.status(500).json({ error: error.message });
        }
    }

    /**
     * Registra un nuevo socio/tenant (Spa) y su administrador principal.
     */
    async registerSpa(req: Request, res: Response) {
        try {
            const { name, spaEmail, ownerName, ownerEmail, password, timezone } = req.body;

            const passwordHash = await hashPassword(password);

            const result = await platformService.registerSpaWithAdmin({
                name,
                spaEmail,
                ownerName,
                ownerEmail,
                passwordHash,
                timezone
            });

            return res.status(201).json({
                message: "Spa y Administrador registrados con éxito",
                data: result
            });
        } catch (error: any) {
            return res.status(500).json({ error: error.message });
        }
    }

    async deleteSpa(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const result = await platformService.deleteSpa(id as string);
            return res.json(result);
        } catch (error: any) {
            return res.status(500).json({ error: error.message });
        }
    }

    /**
     * Gestión de Usuarios de Plataforma
     */
    async getAllUsers(_req: Request, res: Response) {
        try {
            const users = await platformService.getAllPlatformUsers();
            return res.json(users);
        } catch (error: any) {
            return res.status(500).json({ error: error.message });
        }
    }

    async createPlatformUser(req: Request, res: Response) {
        try {
            const { email, password, spaId, fullName } = req.body;
            const passwordHash = await hashPassword(password);
            const user = await platformService.createPlatformUser({
                email,
                passwordHash,
                spaId,
                fullName
            });
            return res.status(201).json(user);
        } catch (error: any) {
            return res.status(500).json({ error: error.message });
        }
    }

    async updatePlatformUser(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { email, fullName, password, active } = req.body;

            const updateData: any = { email, fullName, active };

            if (password) {
                updateData.passwordHash = await hashPassword(password);
            }

            const updated = await platformService.updatePlatformUser(id as string, updateData);
            return res.json(updated);
        } catch (error: any) {
            return res.status(500).json({ error: error.message });
        }
    }

    async deletePlatformUser(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const result = await platformService.deletePlatformUser(id as string);
            return res.json(result);
        } catch (error: any) {
            if (error.message.includes("No se puede eliminar")) {
                return res.status(400).json({ error: error.message });
            }
            return res.status(500).json({ error: error.message });
        }
    }
}
