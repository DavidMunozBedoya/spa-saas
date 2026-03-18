import { Request, Response } from "express";
import { StaffService } from "./staff.service.js";
// No needed import for schema here

const staffService = new StaffService();

export class StaffController {
    /**
     * Registra un nuevo miembro del personal.
     */
    async create(req: Request, res: Response) {
        try {
            // Extraer spaId con fallback para evitar undefined
            const user = (req as any).user;
            const spaId = user?.spaId || user?.spa_id;

            const staff = await staffService.createStaff({ ...req.body, spa_id: spaId as string });
            return res.status(201).json(staff);
        } catch (error: any) {
            return res.status(500).json({ error: error.message });
        }
    }

    // Listar solo los terapeutas
    async getTherapists(req: Request, res: Response) {
        try {
            const user = (req as any).user;
            const spaId = user?.spaId || user?.spa_id;
            const hasViewAll = user?.permissions?.includes("staff:view-all");

            if (!hasViewAll && user?.staffId) {
                const member = await staffService.getById(user.staffId as string, spaId as string);
                return res.json(member ? [member] : []);
            }

            const therapists = await staffService.getTherapists(spaId as string);
            return res.json(therapists);
        } catch (error: any) {
            return res.status(500).json({ error: error.message });
        }
    }

    /**
     * Lista todos los miembros del personal de un Spa específico.
     */
    async getBySpa(req: Request, res: Response) {
        try {
            const user = (req as any).user;
            const spaId = user?.spaId || user?.spa_id;
            const includeInactive = req.query.includeInactive === "true";
            const hasViewAll = user?.permissions?.includes("staff:view-all");

            const filterId = !hasViewAll ? (user?.staffId as string) : undefined;

            const staff = await staffService.getBySpa(spaId as string, includeInactive, filterId);
            return res.json(staff);
        } catch (error: any) {
            return res.status(500).json({ error: error.message });
        }
    }

    /**
     * Obtiene los detalles de un miembro del personal por su ID.
     */
    async getById(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const user = (req as any).user;
            const spaId = user?.spaId || user?.spa_id;
            const member = await staffService.getById(id as string, spaId as string);
            if (!member) return res.status(404).json({ error: "Miembro del personal no encontrado" });
            return res.json(member);
        } catch (error: any) {
            return res.status(500).json({ error: error.message });
        }
    }

    /**
     * Actualiza los datos de un miembro del personal.
     */
    async update(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const user = (req as any).user;
            const spaId = user?.spaId || user?.spa_id;
            const updated = await staffService.updateStaff(id as string, spaId as string, req.body);
            return res.json(updated);
        } catch (error: any) {
            return res.status(500).json({ error: error.message });
        }
    }

    /**
     * Realiza un borrado lógico de un miembro del personal.
     */
    async delete(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const user = (req as any).user;
            const spaId = user?.spaId || user?.spa_id;
            const member = await staffService.softDeleteStaff(id as string, spaId as string);
            if (!member) return res.status(404).json({ error: "Miembro del personal no encontrado" });
            return res.json({ message: "Miembro del personal eliminado lógicamente", member });
        } catch (error: any) {
            return res.status(500).json({ error: error.message });
        }
    }

    /**
     * Reactiva un miembro del personal.
     */
    async reactivate(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const user = (req as any).user;
            const spaId = user?.spaId || user?.spa_id;
            const member = await staffService.reactivateStaff(id as string, spaId as string);
            if (!member) return res.status(404).json({ error: "Miembro del personal no encontrado" });
            return res.json({ message: "Miembro del personal reactivado exitosamente", member });
        } catch (error: any) {
            return res.status(500).json({ error: error.message });
        }
    }
}
