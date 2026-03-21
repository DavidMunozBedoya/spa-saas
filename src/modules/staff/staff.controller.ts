import { Request, Response } from "express";
import { AuthRequest } from "../../middleware/auth.js";
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
            const user = (req as AuthRequest).user;
            const spaId = user?.spaId;

            const staff = await staffService.createStaff({ ...req.body, spa_id: spaId as string });
            return res.status(201).json(staff);
        } catch (error: any) {
            return res.status(500).json({ error: error.message });
        }
    }

    // Listar solo los terapeutas
    async getTherapists(req: Request, res: Response) {
        try {
            const user = (req as AuthRequest).user;
            const spaId = user?.spaId;
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
     * Lista todos los miembros del personal de un Spa específico (incluye archivados si se solicita).
     */
    async getBySpa(req: Request, res: Response) {
        try {
            const user = (req as AuthRequest).user;
            const spaId = user?.spaId;
            const includeArchived = req.query.includeArchived === "true";
            const hasViewAll = user?.permissions?.includes("staff:view-all");

            const filterId = !hasViewAll ? (user?.staffId as string) : undefined;

            const staff = await staffService.getBySpa(spaId as string, includeArchived, filterId);
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
            const user = (req as AuthRequest).user;
            const spaId = user?.spaId;
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
            const user = (req as AuthRequest).user;
            const spaId = user?.spaId;
            const updated = await staffService.updateStaff(id as string, spaId as string, req.body);
            return res.json(updated);
        } catch (error: any) {
            return res.status(500).json({ error: error.message });
        }
    }

    /**
     * Archiva (borrado lógico) de un miembro del personal.
     */
    async delete(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const user = (req as AuthRequest).user;
            const spaId = user?.spaId;
            const member = await staffService.softDeleteStaff(id as string, spaId as string);
            if (!member) return res.status(404).json({ error: "Miembro del personal no encontrado" });
            return res.json({ message: "Personal archivado exitosamente", member });
        } catch (error: any) {
            return res.status(500).json({ error: error.message });
        }
    }

    /**
     * Restaura un miembro del personal archivado.
     */
    async restore(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const user = (req as AuthRequest).user;
            const spaId = user?.spaId;
            const member = await staffService.restoreStaff(id as string, spaId as string);
            if (!member) return res.status(404).json({ error: "Miembro del personal no encontrado" });
            return res.json({ message: "Personal restaurado exitosamente", member });
        } catch (error: any) {
            return res.status(500).json({ error: error.message });
        }
    }
}
