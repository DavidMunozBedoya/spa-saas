import { Request, Response } from "express";
import { AuthRequest } from "../../middleware/auth.js";
import { ReportsService } from "./reports.service.js";

const reportsService = new ReportsService();

export class ReportsController {
    /**
     * Endpoint para las estadísticas del dashboard principal del Spa.
     */
    async getStats(req: Request, res: Response) {
        try {
            const user = (req as AuthRequest).user;
            const spaId = user?.spaId;
            const { startDate, endDate } = req.query;

            // Valores por defecto (últimos 30 días si no se especifican)
            const start = (startDate as string) || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
            const end = (endDate as string) || new Date().toISOString();

            // Si el usuario es terapeuta (tiene staffId asociado), filtramos por su ID
            const staffId = user?.staffId;
            const isTherapist = user?.roleIds?.includes(3);
            
            const stats = await reportsService.getDashboardStats(
                spaId as string, 
                start, 
                end, 
                isTherapist ? staffId as string : undefined
            );
            return res.json(stats);
        } catch (error: any) {
            return res.status(500).json({ error: error.message });
        }
    }

    /**
     * Endpoint para comparar el rendimiento entre miembros del staff.
     */
    async getStaffReport(req: Request, res: Response) {
        try {
            const user = (req as AuthRequest).user;
            const spaId = user?.spaId;
            const { startDate, endDate } = req.query;

            const start = (startDate as string) || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
            const end = (endDate as string) || new Date().toISOString();

            const report = await reportsService.getStaffPerformance(spaId as string, start, end);
            return res.json(report);
        } catch (error: any) {
            return res.status(500).json({ error: error.message });
        }
    }

    /**
     * Endpoint para ver la demanda de servicios.
     */
    async getServiceReport(req: Request, res: Response) {
        try {
            const user = (req as AuthRequest).user;
            const spaId = user?.spaId;
            const { startDate, endDate } = req.query;

            const start = (startDate as string) || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
            const end = (endDate as string) || new Date().toISOString();

            const report = await reportsService.getServicePopularity(spaId as string, start, end);
            return res.json(report);
        } catch (error: any) {
            return res.status(500).json({ error: error.message });
        }
    }
}
