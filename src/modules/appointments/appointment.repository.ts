import pool from "../../config/db.js";
import { PoolClient } from "pg";

export interface AppointmentEntity {
    id: string;
    spa_id: string;
    staff_id: string;
    client_id: string;
    start_time: Date;
    end_time: Date;
    status: "BOOKED" | "COMPLETED" | "CANCELLED";
    created_at: Date;
}

export interface ServiceEntity {
    id: string;
    spa_id: string;
    name: string;
    description: string | null;
    duration_minutes: number;
    price: string | number;
    active: boolean;
    created_at: Date;
}

export interface AppointmentWithDetails extends AppointmentEntity {
    client_name: string;
    client_email: string | null;
    identity_number: string;
    staff_name: string;
    services?: ServiceEntity[];
}

export interface ClientData {
    spa_id: string;
    full_name: string;
    identity_number: string;
    email?: string | null;
    phone?: string | null;
    birth_date?: string | null;
}

export interface AppointmentFilters {
    status?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
    staff_id?: string;
}

export class AppointmentRepository {
    async getClientByIdentity(spa_id: string, identity_number: string, client?: PoolClient): Promise<{ id: string } | null> {
        const db = client || pool;
        const res = await db.query("SELECT id FROM clients WHERE spa_id = $1 AND identity_number = $2", [spa_id, identity_number]);
        return res.rows[0] || null;
    }

    async createClient(data: ClientData, client?: PoolClient): Promise<string> {
        const db = client || pool;
        const res = await db.query(
            `INSERT INTO clients (spa_id, full_name, identity_number, email, phone, birth_date) 
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
            [data.spa_id, data.full_name, data.identity_number, data.email || null, data.phone || null, data.birth_date || null]
        );
        return res.rows[0].id;
    }

    async checkStaffOverlap(staff_id: string, start_time: string, end_time: string, exclude_id?: string, client?: PoolClient): Promise<{ id: string; staff_name: string; end_time: Date } | null> {
        const db = client || pool;
        let query = `SELECT a.id, s.full_name as staff_name, a.end_time 
             FROM appointments a
             JOIN staff s ON a.staff_id = s.id
             WHERE a.staff_id = $1 AND a.status != 'CANCELLED' AND a.start_time < $3 AND a.end_time > $2`;
        const params: any[] = [staff_id, start_time, end_time];
        if (exclude_id) {
            query += " AND a.id != $4";
            params.push(exclude_id);
        }
        query += " ORDER BY a.end_time DESC LIMIT 1";
        
        const res = await db.query(query, params);
        return res.rows[0] || null;
    }

    async checkClientOverlap(client_id: string, start_time: string, end_time: string, exclude_id?: string, client?: PoolClient): Promise<{ id: string; client_name: string; end_time: Date } | null> {
        const db = client || pool;
        let query = `SELECT a.id, c.full_name as client_name, a.end_time 
             FROM appointments a
             JOIN clients c ON a.client_id = c.id
             WHERE a.client_id = $1 AND a.status != 'CANCELLED' AND a.start_time < $3 AND a.end_time > $2`;
        const params: any[] = [client_id, start_time, end_time];
        if (exclude_id) {
            query += " AND a.id != $4";
            params.push(exclude_id);
        }
        query += " ORDER BY a.end_time DESC LIMIT 1";
        
        const res = await db.query(query, params);
        return res.rows[0] || null;
    }

    async createAppointment(data: { spa_id: string; client_id: string; staff_id: string; start_time: string; end_time: string }, service_ids: string[], client: PoolClient): Promise<AppointmentEntity & { service_ids: string[] }> {
        const res = await client.query(
            `INSERT INTO appointments (spa_id, client_id, staff_id, start_time, end_time) 
             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [data.spa_id, data.client_id, data.staff_id, data.start_time, data.end_time]
        );
        const appointmentId = res.rows[0].id;

        for (const serviceId of service_ids) {
            await client.query("INSERT INTO appointment_services (appointment_id, service_id) VALUES ($1, $2)", [appointmentId, serviceId]);
        }
        return { ...res.rows[0], service_ids };
    }

    async getBySpa(spa_id: string, filters: AppointmentFilters): Promise<{ appointments: AppointmentWithDetails[], total: number }> {
        let baseQuery = `
            FROM appointments a
            JOIN clients c ON a.client_id = c.id
            JOIN staff s ON a.staff_id = s.id
            WHERE a.spa_id = $1
        `;
        const params: any[] = [spa_id];
        let paramIdx = 2;

        if (filters.staff_id) {
            baseQuery += ` AND a.staff_id = $${paramIdx++}`;
            params.push(filters.staff_id);
        }
        if (filters.status && filters.status !== 'ALL') {
            baseQuery += ` AND a.status = $${paramIdx++}`;
            params.push(filters.status);
        }
        if (filters.startDate && filters.endDate) {
            const start = filters.startDate.includes('T') ? filters.startDate : `${filters.startDate} 00:00:00`;
            const end = filters.endDate.includes('T') ? filters.endDate : `${filters.endDate} 23:59:59`;
            baseQuery += ` AND a.start_time BETWEEN $${paramIdx++} AND $${paramIdx++}`;
            params.push(start, end);
        }

        // Se corrigió el antipatrón COUNT(*) OVER() haciendo un request dedicado y más rápido al engine de Base de Datos
        const countRes = await pool.query(`SELECT COUNT(*) as total_count ${baseQuery}`, params);
        const total = parseInt(countRes.rows[0].total_count) || 0;

        let query = `SELECT a.*, c.full_name as client_name, c.email as client_email, s.full_name as staff_name ${baseQuery} ORDER BY a.start_time ASC`;

        if (filters.limit) {
            query += ` LIMIT $${paramIdx++}`;
            params.push(filters.limit);
        }
        if (filters.offset) {
            query += ` OFFSET $${paramIdx++}`;
            params.push(filters.offset);
        }

        const res = await pool.query(query, params);
        return {
            appointments: res.rows,
            total
        };
    }

    async getById(id: string, spa_id: string): Promise<AppointmentWithDetails | null> {
        const appointment = await pool.query(
            `SELECT a.*, c.full_name as client_name, c.email as client_email, c.identity_number, s.full_name as staff_name 
             FROM appointments a
             JOIN clients c ON a.client_id = c.id
             JOIN staff s ON a.staff_id = s.id
             WHERE a.id = $1 AND a.spa_id = $2`,
            [id, spa_id]
        );
        if (appointment.rows.length === 0) return null;

        const services = await pool.query(
            `SELECT s.* FROM services s
             JOIN appointment_services aserv ON s.id = aserv.service_id
             WHERE aserv.appointment_id = $1`,
            [id]
        );

        return { ...appointment.rows[0], services: services.rows };
    }
    
    async getBaseFields(id: string, spa_id: string, client?: PoolClient): Promise<AppointmentEntity | null> {
        const db = client || pool;
        const res = await db.query("SELECT * FROM appointments WHERE id = $1 AND spa_id = $2", [id, spa_id]);
        return res.rows[0] || null;
    }

    async updateAppointment(id: string, spa_id: string, data: { staff_id?: string; start_time?: string; end_time?: string }, service_ids?: string[], client?: PoolClient): Promise<void> {
        const db = client || pool;
        const fields: string[] = [];
        const values: any[] = [];
        let i = 1;

        if (data.staff_id) { fields.push(`staff_id = $${i++}`); values.push(data.staff_id); }
        if (data.start_time) { fields.push(`start_time = $${i++}`); values.push(data.start_time); }
        if (data.end_time) { fields.push(`end_time = $${i++}`); values.push(data.end_time); }

        if (fields.length > 0) {
            await db.query(
                `UPDATE appointments SET ${fields.join(", ")} WHERE id = $${i++} AND spa_id = $${i++}`,
                [...values, id, spa_id]
            );
        }

        if (service_ids) {
            await db.query("DELETE FROM appointment_services WHERE appointment_id = $1", [id]);
            for (const serviceId of service_ids) {
                await db.query("INSERT INTO appointment_services (appointment_id, service_id) VALUES ($1, $2)", [id, serviceId]);
            }
        }
    }

    async updateStatus(id: string, spa_id: string, status: string): Promise<AppointmentEntity | null> {
        const res = await pool.query("UPDATE appointments SET status = $3 WHERE id = $1 AND spa_id = $2 RETURNING *", [id, spa_id, status]);
        return res.rows[0] || null;
    }

    async getTransaction(): Promise<PoolClient> {
        return await pool.connect();
    }
}
