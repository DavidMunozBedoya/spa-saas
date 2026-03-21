import pool from "../../config/db.js";

export class InvoiceRepository {
    /**
     * Liquida una cita, creando la factura y marcándola como completada (atómico).
     */
    async liquidateAppointment(
        spa_id: string,
        appointment_id: string,
        payment_method: string,
        notes: string,
        invoiceNumber: string
    ) {
        const client = await pool.connect();
        try {
            await client.query("BEGIN");

            // 1. Obtener datos de la cita, servicios y cliente
            const aptResult = await client.query(
                `SELECT a.id, a.spa_id, a.client_id, a.status,
                        ARRAY_AGG(s.price) as service_prices
                 FROM appointments a
                 JOIN appointment_services aserv ON a.id = aserv.appointment_id
                 JOIN services s ON aserv.service_id = s.id
                 WHERE a.id = $1 AND a.spa_id = $2
                 GROUP BY a.id`,
                [appointment_id, spa_id]
            );

            if (aptResult.rows.length === 0) {
                throw new Error("Cita no encontrada o no tiene servicios asociados");
            }

            const appointment = aptResult.rows[0];

            if (appointment.status === 'CANCELLED') {
                throw new Error("No se puede liquidar una cita cancelada");
            }

            // 2. Calcular valores (por simplificación, impuestos son 0)
            const total = appointment.service_prices.reduce((acc: number, price: number) => acc + Number(price), 0);
            const tax = 0;
            const subtotal = total;

            // 3. Crear factura
            const invoiceResult = await client.query(
                `INSERT INTO invoices (spa_id, client_id, appointment_id, invoice_number, subtotal, tax, total, payment_method, notes)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                 RETURNING id`,
                [appointment.spa_id, appointment.client_id, appointment_id, invoiceNumber, subtotal, tax, total, payment_method, notes]
            );

            // 4. Actualizar estado de la cita
            await client.query(
                "UPDATE appointments SET status = 'COMPLETED' WHERE id = $1 AND spa_id = $2",
                [appointment_id, appointment.spa_id]
            );

            await client.query("COMMIT");

            // Retornar la factura creada consultándola de nuevo con los JOINs desde findById
             return await this.findById(invoiceResult.rows[0].id, appointment.spa_id);
        } catch (error) {
            await client.query("ROLLBACK");
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Obtiene los detalles completos de una factura.
     */
    async findById(id: string, spa_id: string) {
        const result = await pool.query(
            `SELECT i.*, 
                    s.name as spa_name, s.email as spa_email, s.phone as spa_phone, s.address as spa_address, s.logo_url as spa_logo,
                    c.full_name as client_name, c.email as client_email, c.phone as client_phone
             FROM invoices i
             JOIN spas s ON i.spa_id = s.id
             JOIN clients c ON i.client_id = c.id
             WHERE i.id = $1 AND i.spa_id = $2`,
            [id, spa_id]
        );

        if (result.rows.length === 0) return null;

        const invoice = result.rows[0];

        const servicesResult = await pool.query(
            `SELECT s.name, s.price 
             FROM services s
             JOIN appointment_services aserv ON s.id = aserv.service_id
             WHERE aserv.appointment_id = $1`,
            [invoice.appointment_id]
        );

        return {
            ...invoice,
            services: servicesResult.rows
        };
    }

    /**
     * Busca facturas con filtros opcionales.
     */
    async search(filters: { spa_id: string; startDate?: string; endDate?: string; invoiceNumber?: string }) {
        let query = `
            SELECT i.*, c.full_name as client_name
            FROM invoices i
            JOIN clients c ON i.client_id = c.id
            WHERE i.spa_id = $1
        `;
        const params: any[] = [filters.spa_id];
        let paramIndex = 2;

        if (filters.startDate) {
            query += ` AND i.created_at >= $${paramIndex++}`;
            params.push(filters.startDate);
        }

        if (filters.endDate) {
            query += ` AND i.created_at <= $${paramIndex++}`;
            params.push(filters.endDate);
        }

        if (filters.invoiceNumber) {
            query += ` AND i.invoice_number ILIKE $${paramIndex++}`;
            params.push(`%${filters.invoiceNumber}%`);
        }

        query += " ORDER BY i.created_at DESC";

        const result = await pool.query(query, params);
        return result.rows;
    }
}
