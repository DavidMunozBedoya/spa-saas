import { Request, Response } from "express";
import { AuthRequest } from "../../middleware/auth.js";
import { ClientService } from "./client.service.js";
import { UpdateClientSchema } from "./client.schema.js";

const clientService = new ClientService();

export class ClientController {
    /**
     * Registra un nuevo cliente en el sistema.
     */
    async create(req: Request, res: Response) {
        try {
            const user = (req as AuthRequest).user;
            const spaId = user?.spaId;
            const client = await clientService.createClient({ ...req.body, spa_id: spaId });
            return res.status(201).json(client);
        } catch (error: any) {
            return res.status(400).json({ error: error.message });
        }
    }

    /**
     * Lista todos los clientes de un Spa.
     */
    async getBySpa(req: Request, res: Response) {
        try {
            const user = (req as AuthRequest).user;
            const spaId = user?.spaId;
            const includeArchived = req.query.includeArchived === "true";
            const clients = await clientService.getBySpa(spaId as string, includeArchived);
            return res.json(clients);
        } catch (error: any) {
            return res.status(500).json({ error: error.message });
        }
    }

    /**
     * Busca un cliente por identificación (DNI/Cédula).
     */
    async findByIdentity(req: Request, res: Response) {
        try {
            const { identity } = req.query;
            const user = (req as AuthRequest).user;
            const spaId = user?.spaId;

            if (!identity) return res.status(400).json({ error: "Se requiere el número de identificación" });

            const client = await clientService.findByIdentity(spaId as string, identity as string);
            if (!client) return res.status(404).json({ error: "Cliente no encontrado" });

            return res.json(client);
        } catch (error: any) {
            return res.status(500).json({ error: error.message });
        }
    }

    /**
     * Obtiene los datos de un cliente por su ID (protegido por Spa).
     */
    async getById(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const user = (req as AuthRequest).user;
            const spaId = user?.spaId;
            const client = await clientService.getById(id as string, spaId as string);
            if (!client) return res.status(404).json({ error: "Cliente no encontrado" });
            return res.json(client);
        } catch (error: any) {
            return res.status(500).json({ error: error.message });
        }
    }

    /**
     * Actualiza la ficha de un cliente.
     */
    async update(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const user = (req as AuthRequest).user;
            const spaId = user?.spaId;
            const validatedData = UpdateClientSchema.parse(req.body);
            const updated = await clientService.updateClient(id as string, spaId as string, validatedData);
            if (!updated) return res.status(404).json({ error: "Cliente no encontrado" });
            return res.json(updated);
        } catch (error: any) {
            if (error.name === "ZodError") {
                return res.status(400).json({ error: error.errors });
            }
            return res.status(500).json({ error: error.message });
        }
    }

    /**
     * Archiva un cliente (borrado lógico).
     */
    async delete(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const user = (req as AuthRequest).user;
            const spaId = user?.spaId;
            const client = await clientService.softDeleteClient(id as string, spaId as string);
            if (!client) return res.status(404).json({ error: "Cliente no encontrado" });
            return res.json({ message: "Cliente archivado exitosamente", client });
        } catch (error: any) {
            return res.status(500).json({ error: error.message });
        }
    }

    /**
     * Restaura un cliente archivado.
     */
    async restore(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const user = (req as AuthRequest).user;
            const spaId = user?.spaId;
            const client = await clientService.restoreClient(id as string, spaId as string);
            if (!client) return res.status(404).json({ error: "Cliente no encontrado" });
            return res.json({ message: "Cliente restaurado exitosamente", client });
        } catch (error: any) {
            return res.status(500).json({ error: error.message });
        }
    }
}
