import pool from "../../config/db.js";

export class ReportRepository {
    /**
     * Cuenta total de citas en un rango de fechas.
     */
    async countAppointments(spaId: string, startDate: string, endDate: string, staffId?: string): Promise<number> {
        const query = staffId 
            ? "SELECT COUNT(*) FROM appointments WHERE spa_id = $1 AND start_time BETWEEN $2 AND $3 AND staff_id = $4"
            : "SELECT COUNT(*) FROM appointments WHERE spa_id = $1 AND start_time BETWEEN $2 AND $3";
        const params = staffId ? [spaId, startDate, endDate, staffId] : [spaId, startDate, endDate];
        const result = await pool.query(query, params);
        return parseInt(result.rows[0].count);
    }

    /**
     * Calcula los ingresos generados por citas completadas en un periodo.
     */
    async sumRevenue(spaId: string, startDate: string, endDate: string, staffId?: string): Promise<number> {
        const query = `
            SELECT SUM(s.price) as total_revenue
            FROM appointments a
            JOIN appointment_services as2 ON a.id = as2.appointment_id
            JOIN services s ON as2.service_id = s.id
            WHERE a.spa_id = $1 
              AND a.status = 'COMPLETED'
              AND a.start_time BETWEEN $2 AND $3
              ${staffId ? 'AND a.staff_id = $4' : ''}
        `;
        const params = staffId ? [spaId, startDate, endDate, staffId] : [spaId, startDate, endDate];
        const result = await pool.query(query, params);
        return parseFloat(result.rows[0].total_revenue || "0");
    }

    /**
     * Cuenta los nuevos clientes creados durante el periodo en el Spa.
     */
    async countNewClients(spaId: string, startDate: string, endDate: string): Promise<number> {
        const result = await pool.query(
            "SELECT COUNT(*) FROM clients WHERE spa_id = $1 AND created_at BETWEEN $2 AND $3",
            [spaId, startDate, endDate]
        );
        return parseInt(result.rows[0].count);
    }

    /**
     * Obtiene métricas de rendimiento por miembro del staff (Terapeutas) vinculadas a citas.
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
     * Obtiene el listado de servicios agrupados por su popularidad en citas.
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
