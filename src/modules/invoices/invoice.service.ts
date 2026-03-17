import pool from "../../config/db.js";
import { CreateInvoiceInput } from "./invoice.schema.js";
import PDFDocument from "pdfkit";
import axios from "axios";

export class InvoiceService {
    /**
     * Liquida una cita: Calcula totales, crea la factura y marca la cita como COMPLETADA.
     */
    async liquidateAppointment(data: CreateInvoiceInput) {
        const { appointment_id, payment_method, notes, tax_rate } = data;

        const client = await pool.connect();
        try {
            await client.query("BEGIN");

            // 1. Obtener datos de la cita, servicios y cliente (validando spa_id)
            const aptResult = await client.query(
                `SELECT a.id, a.spa_id, a.client_id, a.status,
                        ARRAY_AGG(s.price) as service_prices
                 FROM appointments a
                 JOIN appointment_services aserv ON a.id = aserv.appointment_id
                 JOIN services s ON aserv.service_id = s.id
                 WHERE a.id = $1 AND a.spa_id = $2
                 GROUP BY a.id`,
                [appointment_id, data.spa_id]
            );

            if (aptResult.rows.length === 0) {
                throw new Error("Cita no encontrada o no tiene servicios asociados");
            }

            const appointment = aptResult.rows[0];

            if (appointment.status === 'CANCELLED') {
                throw new Error("No se puede liquidar una cita cancelada");
            }

            // 2. Calcular valores
            const total = appointment.service_prices.reduce((acc: number, price: number) => acc + Number(price), 0);
            const tax = 0;
            const subtotal = total;

            // 3. Generar número de factura
            const invoiceNumber = `FAC-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

            // 4. Crear factura
            const invoiceResult = await client.query(
                `INSERT INTO invoices (spa_id, client_id, appointment_id, invoice_number, subtotal, tax, total, payment_method, notes)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                 RETURNING *`,
                [appointment.spa_id, appointment.client_id, appointment_id, invoiceNumber, subtotal, tax, total, payment_method, notes]
            );

            // 5. Actualizar estado de la cita
            await client.query(
                "UPDATE appointments SET status = 'COMPLETED' WHERE id = $1 AND spa_id = $2",
                [appointment_id, appointment.spa_id]
            );

            await client.query("COMMIT");

            return this.getInvoiceById(invoiceResult.rows[0].id, appointment.spa_id);
        } catch (error) {
            await client.query("ROLLBACK");
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Genera un búfer PDF con el diseño de la factura.
     */
    async generateInvoicePDF(invoice: any): Promise<Buffer> {
        return new Promise(async (resolve, reject) => {
            const doc = new PDFDocument({ margin: 50 });
            const buffers: Buffer[] = [];

            doc.on("data", buffers.push.bind(buffers));
            doc.on("end", () => resolve(Buffer.concat(buffers)));
            doc.on("error", reject);

            // --- Encabezado con Logo ---
            try {
                if (invoice.spa_logo) {
                    try {
                        if (invoice.spa_logo.startsWith("data:")) {
                            // Extraer el búfer directamente de la cadena Base64
                            const base64Data = invoice.spa_logo.split(",")[1];
                            const logoBuffer = Buffer.from(base64Data, "base64");
                            doc.image(logoBuffer, 50, 45, { width: 80 });
                        } else {
                            // Si es una URL externa, descargar con axios
                            console.log("[DEBUG] Descargando logo desde URL exterior:", invoice.spa_logo);
                            const response = await axios.get(invoice.spa_logo, { responseType: 'arraybuffer', timeout: 5000 });
                            const logoBuffer = Buffer.from(response.data, 'binary');
                            doc.image(logoBuffer, 50, 45, { width: 80 });
                        }
                    } catch (logoError) {
                        console.error("[DEBUG] No se pudo cargar el logo del Spa:", logoError);
                    }
                }

                doc.font("Helvetica-Bold").fontSize(20).text(invoice.spa_name, { align: "right" });

                doc.font("Helvetica").fontSize(10)
                    .text(invoice.spa_address || "", { align: "right" })
                    .text(invoice.spa_phone || "", { align: "right" })
                    .text(invoice.spa_email || "", { align: "right" })
                    .moveDown();

                const lineY = doc.y > 150 ? doc.y : 150;
                doc.moveTo(50, lineY).lineTo(550, lineY).stroke();

                // --- Datos de la Factura ---
                doc.moveDown();
                doc.font("Helvetica-Bold").fontSize(16).text(`FACTURA: ${invoice.invoice_number}`);
                doc.font("Helvetica").fontSize(10)
                    .text(`Fecha: ${new Date(invoice.created_at).toLocaleString()}`)
                    .text(`Método de Pago: ${invoice.payment_method || "N/A"}`)
                    .moveDown();

                // Resto del documento...
                // --- Datos del Cliente ---
                doc.moveDown();
                doc.font("Helvetica-Bold").fontSize(12).text("CLIENTE:");
                doc.font("Helvetica").fontSize(10)
                    .text(invoice.client_name)
                    .text(invoice.client_phone || "")
                    .text(invoice.client_email || "")
                    .moveDown();

                // --- Tabla de Servicios ---
                const tableTop = doc.y + 20 > 300 ? doc.y + 20 : 300;
                doc.font("Helvetica-Bold").fontSize(10).text("SERVICIO", 50, tableTop);
                doc.text("PRECIO", 450, tableTop, { align: "right" });

                doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

                let position = tableTop + 30;
                const formatCurrency = (val: number) => {
                    return new Intl.NumberFormat('es-CO', {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0
                    }).format(val);
                };

                doc.font("Helvetica");
                invoice.services.forEach((s: any) => {
                    doc.text(s.name, 50, position);
                    doc.text(`$${formatCurrency(Number(s.price))}`, 450, position, { align: "right" });
                    position += 20;
                });

                doc.moveTo(50, position + 5).lineTo(550, position + 5).stroke();

                // --- Totales ---
                position += 20;
                doc.font("Helvetica-Bold").fontSize(12).text("TOTAL:", 350, position);
                doc.text(`$${formatCurrency(Number(invoice.total))}`, 450, position, { align: "right" });

                // --- Pie de página ---
                doc.font("Helvetica").fontSize(8)
                    .text("Gracias por su visita.", 50, 700, { align: "center", width: 500 });

                doc.end();
            } catch (err) {
                reject(err);
            }
        });
    }

    /**
     * Obtiene los detalles completos de una factura para el formato de factura solicitado.
     */
    async getInvoiceById(id: string, spa_id: string) {
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

        // Obtener servicios detallados de la factura (a través de la cita)
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
    async searchInvoices(filters: { spa_id: string; startDate?: string; endDate?: string; invoiceNumber?: string }) {
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
