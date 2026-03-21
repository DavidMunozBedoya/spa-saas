import { Request, Response } from "express";
import { AuthRequest } from "../../middleware/auth.js";
import { ServiceService } from "./service.service.js";
import { CreateServiceSchema, UpdateServiceSchema } from "./service.schema.js";

const serviceService = new ServiceService();

export class ServiceController {
    /**
     * Registra un nuevo servicio ofrecido por el Spa.
     */
    async create(req: Request, res: Response) {
        try {
            const user = (req as AuthRequest).user;
            const spaId = user?.spaId;
            const service = await serviceService.createService({ ...req.body, spa_id: spaId as string });
            return res.status(201).json(service);
        } catch (error: any) {
            return res.status(500).json({ error: error.message });
        }
    }

    /**
     * Obtiene el catálogo de servicios de un Spa. Incluye archivados si se especifica en la query.
     */
    async getBySpa(req: Request, res: Response) {
        try {
            const user = (req as AuthRequest).user;
            const spaId = user?.spaId;
            const includeArchived = req.query.includeArchived === "true";
            const services = await serviceService.getBySpa(spaId as string, includeArchived);
            return res.json(services);
        } catch (error: any) {
            return res.status(500).json({ error: error.message });
        }
    }

    /**
     * Obtiene los detalles de un servicio específico.
     */
    async getById(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const user = (req as AuthRequest).user;
            const spaId = user?.spaId;
            const service = await serviceService.getById(id as string, spaId as string);
            if (!service) return res.status(404).json({ error: "Servicio no encontrado" });
            return res.json(service);
        } catch (error: any) {
            return res.status(500).json({ error: error.message });
        }
    }

    /**
     * Actualiza un servicio (precio, duración, descripción, etc.).
     */
    async update(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const user = (req as AuthRequest).user;
            const spaId = user?.spaId;
            const updated = await serviceService.updateService(id as string, spaId as string, req.body);
            if (!updated) return res.status(404).json({ error: "Servicio no encontrado" });

            return res.json(updated);
        } catch (error: any) {
            return res.status(500).json({ error: error.message });
        }
    }

    /**
     * Archiva (elimina lógicamente) un servicio.
     */
    async delete(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const user = (req as AuthRequest).user;
            const spaId = user?.spaId;
            const service = await serviceService.softDeleteService(id as string, spaId as string);
            if (!service) return res.status(404).json({ error: "Servicio no encontrado" });
            return res.json({ message: "Servicio archivado exitosamente", service });
        } catch (error: any) {
            return res.status(500).json({ error: error.message });
        }
    }

    /**
     * Restaura un servicio archivado.
     */
    async restore(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const user = (req as AuthRequest).user;
            const spaId = user?.spaId;
            const service = await serviceService.restoreService(id as string, spaId as string);
            if (!service) return res.status(404).json({ error: "Servicio no encontrado" });
            return res.json({ message: "Servicio restaurado exitosamente", service });
        } catch (error: any) {
            return res.status(500).json({ error: error.message });
        }
    }
}
