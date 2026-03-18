import pool from "../../config/db.js";

export class ReportsService {
    /**
     * Obtiene estadísticas generales del Spa en un rango de fechas.
     */
    async getDashboardStats(spaId: string, startDate: string, endDate: string, staffId?: string) {
        // 1. Total de citas en el periodo
        const appointmentsQuery = staffId 
            ? "SELECT COUNT(*) FROM appointments WHERE spa_id = $1 AND start_time BETWEEN $2 AND $3 AND staff_id = $4"
            : "SELECT COUNT(*) FROM appointments WHERE spa_id = $1 AND start_time BETWEEN $2 AND $3";
        const appointmentsParams = staffId ? [spaId, startDate, endDate, staffId] : [spaId, startDate, endDate];
        const appointmentsCount = await pool.query(appointmentsQuery, appointmentsParams);

        // 2. Ingresos totales (Suma de precios de servicios en citas completadas)
        const revenueQuery = `
            SELECT SUM(s.price) as total_revenue
            FROM appointments a
            JOIN appointment_services as2 ON a.id = as2.appointment_id
            JOIN services s ON as2.service_id = s.id
            WHERE a.spa_id = $1 
              AND a.status = 'COMPLETED'
              AND a.start_time BETWEEN $2 AND $3
              ${staffId ? 'AND a.staff_id = $4' : ''}
        `;
        const revenueParams = staffId ? [spaId, startDate, endDate, staffId] : [spaId, startDate, endDate];
        const revenueRes = await pool.query(revenueQuery, revenueParams);

        // 3. Clientes nuevos creados en el periodo (Esto sigue siendo a nivel Spa generalmente, pero podríamos filtrarlo por quién los creó si tuviéramos ese dato)
        // Por ahora lo dejamos a nivel Spa o 0 para terapeutas si queremos más restricción.
        const newClientsCount = await pool.query(
            "SELECT COUNT(*) FROM clients WHERE spa_id = $1 AND created_at BETWEEN $2 AND $3",
            [spaId, startDate, endDate]
        );

        return {
            totalAppointments: parseInt(appointmentsCount.rows[0].count),
            totalRevenue: parseFloat(revenueRes.rows[0].total_revenue || "0"),
            newClients: staffId ? 0 : parseInt(newClientsCount.rows[0].count) // Ocultar nuevos clientes globales a terapeutas
        };
    }

    /**
     * Ranking de personal por volumen de citas atendidas.
     */
    async getStaffPerformance(spaId: string, startDate: string, endDate: string) {
        const result = await pool.query(
            `SELECT st.full_name, COUNT(a.id) as total_appointments, 
                    COUNT(CASE WHEN a.status = 'COMPLETED' THEN 1 END) as completed_appointments
             FROM staff st
             JOIN users u ON st.id = u.staff_id
             JOIN user_roles ur ON u.id = ur.user_id
             JOIN roles r ON ur.role_id = r.id
             LEFT JOIN appointments a ON st.id = a.staff_id AND a.start_time BETWEEN $2 AND $3
             WHERE st.spa_id = $1 
               AND st.active = true 
               AND r.name = 'Terapeuta'
             GROUP BY st.id, st.full_name
             ORDER BY total_appointments DESC`,
            [spaId, startDate, endDate]
        );

        return result.rows.map(row => ({
            name: row.full_name,
            total: parseInt(row.total_appointments),
            completed: parseInt(row.completed_appointments)
        }));
    }

    /**
     * Lista de servicios más solicitados.
     */
    async getServicePopularity(spaId: string, startDate: string, endDate: string) {
        const result = await pool.query(
            `SELECT s.name, COUNT(as2.appointment_id) as demand_count
             FROM services s
             JOIN appointment_services as2 ON s.id = as2.service_id
             JOIN appointments a ON as2.appointment_id = a.id
             WHERE s.spa_id = $1 
               AND a.start_time BETWEEN $2 AND $3
             GROUP BY s.id, s.name
             ORDER BY demand_count DESC`,
            [spaId, startDate, endDate]
        );

        return result.rows.map(row => ({
            service: row.name,
            count: parseInt(row.demand_count)
        }));
    }
}
