import { ReportRepository } from "./report.repository.js";

const reportRepository = new ReportRepository();

export class ReportsService {
    /**
     * Obtiene estadísticas generales del Spa en un rango de fechas.
     */
    async getDashboardStats(spaId: string, startDate: string, endDate: string, staffId?: string) {
        // 1. Total de citas en el periodo
        const totalAppointments = await reportRepository.countAppointments(spaId, startDate, endDate, staffId);

        // 2. Ingresos totales (Suma de precios de servicios en citas completadas)
        const totalRevenue = await reportRepository.sumRevenue(spaId, startDate, endDate, staffId);

        // 3. Clientes nuevos creados en el periodo (solo mostrar si no es terapeuta)
        const newClients = staffId ? 0 : await reportRepository.countNewClients(spaId, startDate, endDate);

        return {
            totalAppointments,
            totalRevenue,
            newClients
        };
    }

    /**
     * Ranking de personal por volumen de citas atendidas.
     */
    async getStaffPerformance(spaId: string, startDate: string, endDate: string) {
        return reportRepository.getStaffPerformance(spaId, startDate, endDate);
    }

    /**
     * Lista de servicios más solicitados.
     */
    async getServicePopularity(spaId: string, startDate: string, endDate: string) {
        return reportRepository.getServicePopularity(spaId, startDate, endDate);
    }
}
