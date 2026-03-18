import pool from "../../config/db.js";
import { CreateAppointmentInput, UpdateAppointmentInput } from "./appointment.schema.js";

export class AppointmentService {
    /**
     * Crea una cita dentro de una transacción. Verifica solapamientos de tiempo para el staff.
     */
    async createAppointment(data: CreateAppointmentInput) {
        const {
            spa_id, client_id, staff_id, service_ids, start_time, end_time,
            client_identity, client_name, client_email, client_phone,
            client_birth_date,
            timezone_offset = 0
        } = data;

        const client = await pool.connect();
        try {
            await client.query("BEGIN");

            let resolvedClientId = client_id;

            // Lógica de Identificación Inteligente: Buscar o Crear Cliente
            if (!resolvedClientId && client_identity) {
                const existingClient = await client.query(
                    "SELECT id FROM clients WHERE spa_id = $1 AND identity_number = $2",
                    [spa_id, client_identity]
                );

                if (existingClient.rows.length > 0) {
                    resolvedClientId = existingClient.rows[0].id;
                } else if (client_name) {
                    try {
                        // Crear cliente automáticamente si no existe (la identidad es obligatoria para búsqueda)
                        const newClient = await client.query(
                            `INSERT INTO clients (spa_id, full_name, identity_number, email, phone, birth_date) 
                             VALUES ($1, $2, $3, $4, $5, $6) 
                             RETURNING id`,
                            [spa_id, client_name, client_identity, client_email || null, client_phone || null, client_birth_date || null]
                        );
                        resolvedClientId = newClient.rows[0].id;
                    } catch (err: any) {
                        if (err.code === '23505') {
                            if (err.constraint?.includes('identity_number')) {
                                throw new Error("Esta identificación ya está registrada para otro cliente.");
                            }
                        }
                        throw err;
                    }
                }
            }

            if (!resolvedClientId) {
                throw new Error("Se requiere la identificación y el nombre completo para registrar a un nuevo cliente.");
            }

            // 0. Verificar solapamiento de horarios para el mismo staff
            const staffOverlap = await client.query(
                `SELECT a.id, s.full_name as staff_name, a.end_time 
                 FROM appointments a
                 JOIN staff s ON a.staff_id = s.id
                 WHERE a.staff_id = $1 
                 AND a.status != 'CANCELLED'
                 AND a.start_time < $3 
                 AND a.end_time > $2
                 ORDER BY a.end_time DESC LIMIT 1`,
                [staff_id, start_time, end_time]
            );

            if (staffOverlap.rows.length > 0) {
                const endTime = new Date(staffOverlap.rows[0].end_time);
                // Adjust to user's local time using the offset (offset is in minutes, e.g., -300 for -5h)
                const offset = timezone_offset ?? 0;
                const localEnd = new Date(endTime.getTime() + (offset * 60000));
                const formattedEnd = localEnd.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

                throw new Error(`¡ATENCIÓN! El profesional ${staffOverlap.rows[0].staff_name} ya tiene una cita en este rango. Por favor, intenta agendar después de las ${formattedEnd}.`);
            }

            // 0.1 Verificar solapamiento para el mismo cliente
            const clientOverlap = await client.query(
                `SELECT a.id, c.full_name as client_name, a.end_time 
                 FROM appointments a
                 JOIN clients c ON a.client_id = c.id
                 WHERE a.client_id = $1 
                 AND a.status != 'CANCELLED'
                 AND a.start_time < $3 
                 AND a.end_time > $2
                 ORDER BY a.end_time DESC LIMIT 1`,
                [resolvedClientId, start_time, end_time]
            );

            if (clientOverlap.rows.length > 0) {
                const endTime = new Date(clientOverlap.rows[0].end_time);
                const offset = timezone_offset ?? 0;
                const localEnd = new Date(endTime.getTime() + (offset * 60000));
                const formattedEnd = localEnd.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

                throw new Error(`¡ATENCIÓN! El cliente ${clientOverlap.rows[0].client_name} tiene otra reserva que interfiere con este horario. Debe agendarse después de las ${formattedEnd}.`);
            }

            // 1. Insertar la cita principal
            const appointmentResult = await client.query(
                `INSERT INTO appointments (spa_id, client_id, staff_id, start_time, end_time) 
                 VALUES ($1, $2, $3, $4, $5) 
                 RETURNING *`,
                [spa_id, resolvedClientId, staff_id, start_time, end_time]
            );

            const appointmentId = appointmentResult.rows[0].id;

            // 2. Insertar los servicios relacionados
            for (const serviceId of service_ids) {
                await client.query(
                    `INSERT INTO appointment_services (appointment_id, service_id) 
                   VALUES ($1, $2)`,
                    [appointmentId, serviceId]
                );
            }

            await client.query("COMMIT");
            return { ...appointmentResult.rows[0], service_ids };
        } catch (error) {
            await client.query("ROLLBACK");
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Obtiene todas las citas de un Spa con información de cliente y personal.
     */
    async getBySpa(spa_id: string, filters?: { status?: string, startDate?: string, endDate?: string, limit?: number, offset?: number, staff_id?: string }) {
        let query = `
            SELECT a.*, c.full_name as client_name, c.email as client_email, s.full_name as staff_name,
                   COUNT(*) OVER() as total_count
            FROM appointments a
            JOIN clients c ON a.client_id = c.id
            JOIN staff s ON a.staff_id = s.id
            WHERE a.spa_id = $1
        `;

        const params: any[] = [spa_id];
        let paramIdx = 2;

        if (filters?.staff_id) {
            query += ` AND a.staff_id = $${paramIdx++}`;
            params.push(filters.staff_id);
        }

        if (filters?.status && filters.status !== 'ALL') {
            query += ` AND a.status = $${paramIdx++}`;
            params.push(filters.status);
        }

        if (filters?.startDate && filters?.endDate) {
            // Expandir a rango completo de día si vienen solo fechas YYYY-MM-DD
            const start = filters.startDate.includes('T') ? filters.startDate : `${filters.startDate} 00:00:00`;
            const end = filters.endDate.includes('T') ? filters.endDate : `${filters.endDate} 23:59:59`;

            query += ` AND a.start_time BETWEEN $${paramIdx++} AND $${paramIdx++}`;
            params.push(start, end);
        }

        query += ` ORDER BY a.start_time ASC`;

        if (filters?.limit) {
            query += ` LIMIT $${paramIdx++}`;
            params.push(filters.limit);
        }

        if (filters?.offset) {
            query += ` OFFSET $${paramIdx++}`;
            params.push(filters.offset);
        }

        const result = await pool.query(query, params);
        const total = result.rows.length > 0 ? parseInt(result.rows[0].total_count) || 0 : 0;

        return {
            appointments: result.rows.map(row => {
                const { total_count, ...appointment } = row;
                return appointment;
            }),
            pagination: {
                total,
                limit: filters?.limit || result.rows.length,
                offset: filters?.offset || 0
            }
        };
    }

    /**
     * Obtiene los detalles de una cita específica, incluyendo sus servicios.
     */
    async getById(id: string, spa_id: string) {
        const appointment = await pool.query(
            `SELECT a.*, c.full_name as client_name, c.email as client_email, s.full_name as staff_name 
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

        return {
            ...appointment.rows[0],
            services: services.rows,
        };
    }

    /**
     * Actualiza una cita completa (personal, servicios, tiempos).
     */
    async updateAppointment(data: UpdateAppointmentInput) {
        const { id, spa_id, staff_id, service_ids, start_time, end_time, timezone_offset = 0 } = data;

        const dbClient = await pool.connect();
        try {
            await dbClient.query("BEGIN");

            // 1. Verificar existencia y pertenencia
            const existing = await dbClient.query(
                "SELECT * FROM appointments WHERE id = $1 AND spa_id = $2",
                [id, spa_id]
            );
            if (existing.rows.length === 0) throw new Error("Cita no encontrada");

            // 2. Si cambian tiempos o staff, verificar solapamientos (excluyendo esta cita)
            const finalStaffId = staff_id || existing.rows[0].staff_id;
            const finalStartTime = start_time || existing.rows[0].start_time;
            const finalEndTime = end_time || existing.rows[0].end_time;

            if (staff_id || start_time || end_time) {
                const finalClientId = existing.rows[0].client_id;

                // 2.1 Verificar solapamiento para el staff
                const staffOverlap = await dbClient.query(
                    `SELECT a.id, s.full_name as staff_name, a.end_time 
                     FROM appointments a
                     JOIN staff s ON a.staff_id = s.id
                     WHERE a.staff_id = $1 
                     AND a.id != $4
                     AND a.status != 'CANCELLED'
                     AND a.start_time < $3 
                     AND a.end_time > $2
                     ORDER BY a.end_time DESC LIMIT 1`,
                    [finalStaffId, finalStartTime, finalEndTime, id]
                );

                if (staffOverlap.rows.length > 0) {
                    const endTime = new Date(staffOverlap.rows[0].end_time);
                    const offset = timezone_offset ?? 0;
                    const localEnd = new Date(endTime.getTime() + (offset * 60000));
                    const formattedEnd = localEnd.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
                    throw new Error(`¡ATENCIÓN! El profesional ${staffOverlap.rows[0].staff_name} ya tiene una cita en este rango. Disponible después de las ${formattedEnd}.`);
                }

                // 2.2 Verificar solapamiento para el cliente
                const clientOverlap = await dbClient.query(
                    `SELECT a.id, c.full_name as client_name, a.end_time 
                     FROM appointments a
                     JOIN clients c ON a.client_id = c.id
                     WHERE a.client_id = $1 
                     AND a.id != $4
                     AND a.status != 'CANCELLED'
                     AND a.start_time < $3 
                     AND a.end_time > $2
                     ORDER BY a.end_time DESC LIMIT 1`,
                    [finalClientId, finalStartTime, finalEndTime, id]
                );

                if (clientOverlap.rows.length > 0) {
                    const endTime = new Date(clientOverlap.rows[0].end_time);
                    const offset = timezone_offset ?? 0;
                    const localEnd = new Date(endTime.getTime() + (offset * 60000));
                    const formattedEnd = localEnd.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
                    throw new Error(`¡ATENCIÓN! El cliente ${clientOverlap.rows[0].client_name} tiene otra reserva que interfiere con este horario. Debe agendarse después de las ${formattedEnd}.`);
                }
            }

            // 3. Actualizar campos básicos
            const fields: string[] = [];
            const values: any[] = [];
            let i = 1;

            if (staff_id) { fields.push(`staff_id = $${i++}`); values.push(staff_id); }
            if (start_time) { fields.push(`start_time = $${i++}`); values.push(start_time); }
            if (end_time) { fields.push(`end_time = $${i++}`); values.push(end_time); }

            if (fields.length > 0) {
                await dbClient.query(
                    `UPDATE appointments SET ${fields.join(", ")} WHERE id = $${i++} AND spa_id = $${i++}`,
                    [...values, id, spa_id]
                );
            }

            // 4. Actualizar servicios si se proporcionan
            if (service_ids) {
                await dbClient.query("DELETE FROM appointment_services WHERE appointment_id = $1", [id]);
                for (const serviceId of service_ids) {
                    await dbClient.query(
                        "INSERT INTO appointment_services (appointment_id, service_id) VALUES ($1, $2)",
                        [id, serviceId]
                    );
                }
            }

            await dbClient.query("COMMIT");
            return this.getById(id, spa_id);
        } catch (error) {
            await dbClient.query("ROLLBACK");
            throw error;
        } finally {
            dbClient.release();
        }
    }

    /**
     * Actualiza el estado de una cita.
     */
    async updateStatus(id: string, spa_id: string, status: string) {
        const result = await pool.query(
            "UPDATE appointments SET status = $3 WHERE id = $1 AND spa_id = $2 RETURNING *",
            [id, spa_id, status]
        );
        return result.rows[0];
    }
}
