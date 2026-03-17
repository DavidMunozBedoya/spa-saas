import { Request, Response } from "express";
import { AppointmentService } from "./appointment.service.js";
import { UpdateAppointmentStatusSchema, UpdateAppointmentSchema } from "./appointment.schema.js";

const appointmentService = new AppointmentService();

export class AppointmentController {
    /**
     * Agenda una nueva cita, validando solapamientos con el mismo personal.
     */
    async create(req: Request, res: Response) {
        try {
            const user = (req as any).user;
            const spaId = user?.spaId || user?.spa_id;
            const appointment = await appointmentService.createAppointment({ ...req.body, spa_id: spaId as string });
            return res.status(201).json(appointment);
        } catch (error: any) {
            return res.status(500).json({ error: error.message });
        }
    }

    /**
     * Lista todas las citas de un Spa, incluyendo nombres de clientes y personal.
     * Soporta filtros por status, startDate y endDate vía query params.
     */
    async getBySpa(req: Request, res: Response) {
        try {
            const user = (req as any).user;
            const spaId = user?.spaId || user?.spa_id;
            const { status, startDate, endDate, limit, page } = req.query;

            const pageSize = parseInt(limit as string) || 20;
            const currentPage = parseInt(page as string) || 1;
            const offset = (currentPage - 1) * pageSize;

            const result = await appointmentService.getBySpa(spaId as string, {
                status: status as string,
                startDate: startDate as string,
                endDate: endDate as string,
                limit: pageSize,
                offset
            });
            return res.json(result);
        } catch (error: any) {
            return res.status(500).json({ error: error.message });
        }
    }

    /**
     * Obtiene los detalles de una cita y sus servicios relacionados.
     */
    async getById(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const user = (req as any).user;
            const spaId = user?.spaId || user?.spa_id;
            const appointment = await appointmentService.getById(id as string, spaId as string);
            if (!appointment) return res.status(404).json({ error: "Cita no encontrada" });
            return res.json(appointment);
        } catch (error: any) {
            return res.status(500).json({ error: error.message });
        }
    }

    /**
     * Cambia el estado de una cita (BOOKED, COMPLETED, CANCELLED).
     */
    async updateStatus(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const user = (req as any).user;
            const spaId = user?.spaId || user?.spa_id;
            const { status } = UpdateAppointmentStatusSchema.parse(req.body);
            const updated = await appointmentService.updateStatus(id as string, spaId as string, status);
            if (!updated) return res.status(404).json({ error: "Cita no encontrada" });
            return res.json(updated);
        } catch (error: any) {
            if (error.name === "ZodError") {
                return res.status(400).json({ error: error.errors });
            }
            return res.status(500).json({ error: error.message });
        }
    }

    /**
     * Actualiza una cita completa.
     */
    async update(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const user = (req as any).user;
            const spaId = user?.spaId || user?.spa_id;
            const data = UpdateAppointmentSchema.parse(req.body);

            const updated = await appointmentService.updateAppointment({ ...data, id: id as string, spa_id: spaId as string });
            if (!updated) return res.status(404).json({ error: "Cita no encontrada" });
            return res.json(updated);
        } catch (error: any) {
            if (error.name === "ZodError") {
                return res.status(400).json({ error: error.errors });
            }
            return res.status(500).json({ error: error.message });
        }
    }
}
