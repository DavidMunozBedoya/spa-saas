import { CreateInvoiceInput } from "./invoice.schema.js";
import PDFDocument from "pdfkit";
import axios from "axios";
import { InvoiceRepository } from "./invoice.repository.js";

const invoiceRepository = new InvoiceRepository();

export class InvoiceService {
    /**
     * Liquida una cita: Calcula totales, crea la factura en el repositorio y marca la cita como COMPLETADA.
     */
    async liquidateAppointment(data: CreateInvoiceInput & { spa_id: string }) {
        const { appointment_id, payment_method, notes, spa_id } = data;

        // Generar número de factura en la capa de negocio
        const invoiceNumber = `FAC-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

        return invoiceRepository.liquidateAppointment(
            spa_id,
            appointment_id,
            payment_method || "",
            notes || "",
            invoiceNumber
        );
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
        return invoiceRepository.findById(id, spa_id);
    }

    /**
     * Busca facturas con filtros opcionales.
     */
    async searchInvoices(filters: { spa_id: string; startDate?: string; endDate?: string; invoiceNumber?: string }) {
        return invoiceRepository.search(filters);
    }
}
