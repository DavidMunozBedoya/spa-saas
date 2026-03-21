import { Request, Response } from "express";
import { AuthRequest } from "../../middleware/auth.js";
import { SpaService } from "./spa.service.js";
import { CreateSpaSchema, UpdateSpaSchema } from "./spa.schema.js";

const spaService = new SpaService();

export class SpaController {
    /**
     * Crea un nuevo Spa.
     */
    async create(req: Request, res: Response) {
        try {
            const spa = await spaService.createSpa(req.body);
            return res.status(201).json(spa);
        } catch (error: any) {
            return res.status(500).json({ error: error.message });
        }
    }

    /**
     * Obtiene todos los Spas activos.
     */
    async getAll(req: Request, res: Response) {
        try {
            const spas = await spaService.getAllSpas();
            return res.json(spas);
        } catch (error: any) {
            return res.status(500).json({ error: error.message });
        }
    }

    /**
     * Obtiene un Spa por su ID.
     */
    async getById(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const spa = await spaService.getSpaById(id as string);
            if (!spa) return res.status(404).json({ error: "Spa no encontrado" });
            return res.json(spa);
        } catch (error: any) {
            return res.status(500).json({ error: error.message });
        }
    }

    /**
     * Actualiza la información de un Spa.
     */
    async update(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const validatedData = UpdateSpaSchema.parse(req.body);
            const updated = await spaService.updateSpa(id as string, validatedData);
            if (!updated) return res.status(404).json({ error: "Spa no encontrado" });
            return res.json(updated);
        } catch (error: any) {
            if (error.name === "ZodError") {
                return res.status(400).json({ error: error.errors });
            }
            return res.status(500).json({ error: error.message });
        }
    }

    /**
     * Realiza un borrado lógico de un Spa.
     */
    async delete(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const spa = await spaService.softDeleteSpa(id as string);
            if (!spa) return res.status(404).json({ error: "Spa no encontrado" });
            return res.json({ message: "Spa eliminado lógicamente", spa });
        } catch (error: any) {
            return res.status(500).json({ error: error.message });
        }
    }

    /**
     * Obtiene la configuración completa del Spa del usuario autenticado.
     */
    async getSettings(req: Request, res: Response) {
        try {
            const user = (req as AuthRequest).user;
            const spaId = user?.spaId;
            const spa = await spaService.getSpaById(spaId as string);
            if (!spa) return res.status(404).json({ error: "Spa no encontrado" });
            return res.json(spa);
        } catch (error: any) {
            return res.status(500).json({ error: error.message });
        }
    }

    /**
     * Actualiza la configuración del Spa del usuario autenticado.
     */
    async updateSettings(req: Request, res: Response) {
        try {
            const user = (req as AuthRequest).user;
            const spaId = user?.spaId;
            const validatedData = UpdateSpaSchema.parse(req.body);
            const updated = await spaService.updateSpa(spaId as string, validatedData);
            return res.json(updated);
        } catch (error: any) {
            if (error.name === "ZodError") {
                return res.status(400).json({ error: error.errors });
            }
            return res.status(500).json({ error: error.message });
        }
    }

    /**
     * Reactiva un Spa.
     */
    async reactivate(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const spa = await spaService.reactivateSpa(id as string);
            if (!spa) return res.status(404).json({ error: "Spa no encontrado" });
            return res.json({ message: "Spa reactivado exitosamente", spa });
        } catch (error: any) {
            return res.status(500).json({ error: error.message });
        }
    }
}
