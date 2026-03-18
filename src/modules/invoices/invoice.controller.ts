import { Request, Response } from "express";
import { InvoiceService } from "./invoice.service.js";
import { CreateInvoiceSchema } from "./invoice.schema.js";

const invoiceService = new InvoiceService();

export class InvoiceController {
    async list(req: Request, res: Response) {
        try {
            const user = (req as any).user;
            const spaId = user?.spaId || user?.spa_id;
            const { startDate, endDate, invoiceNumber } = req.query;

            const invoices = await invoiceService.searchInvoices({
                spa_id: spaId,
                startDate: startDate as string,
                endDate: endDate as string,
                invoiceNumber: invoiceNumber as string
            });

            return res.json(invoices);
        } catch (error: any) {
            return res.status(500).json({ error: error.message });
        }
    }

    async liquidate(req: Request, res: Response) {
        try {
            const user = (req as any).user;
            const spaId = user?.spaId || user?.spa_id;
            const data = CreateInvoiceSchema.parse(req.body);
            const invoice = await invoiceService.liquidateAppointment({ ...data, spa_id: spaId as string });
            return res.status(201).json(invoice);
        } catch (error: any) {
            if (error.name === "ZodError") {
                return res.status(400).json({ error: error.errors });
            }
            return res.status(500).json({ error: error.message });
        }
    }

    async getById(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const user = (req as any).user;
            const spaId = user?.spaId || user?.spa_id;
            const invoice = await invoiceService.getInvoiceById(id as string, spaId as string);
            if (!invoice) return res.status(404).json({ error: "Factura no encontrada" });
            return res.json(invoice);
        } catch (error: any) {
            return res.status(500).json({ error: error.message });
        }
    }

    async getPDF(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const user = (req as any).user;
            const spaId = user?.spaId || user?.spa_id;
            const invoice = await invoiceService.getInvoiceById(id as string, spaId as string);
            if (!invoice) return res.status(404).json({ error: "Factura no encontrada" });

            const pdfBuffer = await invoiceService.generateInvoicePDF(invoice);

            res.setHeader("Content-Type", "application/pdf");
            res.setHeader("Content-Disposition", `attachment; filename=Factura-${invoice.invoice_number}.pdf`);
            return res.send(pdfBuffer);
        } catch (error: any) {
            return res.status(500).json({ error: error.message });
        }
    }
}
