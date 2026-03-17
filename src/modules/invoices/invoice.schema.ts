import { z } from "zod";

export const CreateInvoiceSchema = z.object({
    appointment_id: z.string().uuid("ID de cita inválido"),
    payment_method: z.string().max(50).optional(),
    notes: z.string().optional(),
    tax_rate: z.number().min(0).max(1).default(0), // Porcentaje de impuestos (0.19 para 19%, por ejemplo)
});

export type CreateInvoiceInput = z.infer<typeof CreateInvoiceSchema> & { spa_id: string };
