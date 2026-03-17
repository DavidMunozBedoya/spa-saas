import { z } from "zod";

export const CreateAppointmentSchema = z.object({
    client_id: z.string().uuid("ID de Cliente inválido").optional().nullable(),
    // Campos para creación automática de cliente
    client_identity: z.string().min(1, "La identificación es obligatoria").max(50).optional().nullable(),
    client_name: z.string().max(150).optional().nullable(),
    client_email: z.string().email().optional().nullable().or(z.literal("")),
    client_phone: z.string().max(20).optional().nullable().or(z.literal("")),
    client_birth_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de fecha inválido (YYYY-MM-DD)").optional().nullable().or(z.literal("")),
    staff_id: z.string().uuid("ID de Staff inválido"),
    service_ids: z.array(z.string().uuid()).min(1, "Debe seleccionar al menos un servicio"),
    start_time: z.string().datetime({ message: "Fecha de inicio inválida (ISO 8601)" }),
    end_time: z.string().datetime({ message: "Fecha de fin inválida (ISO 8601)" }),
    timezone_offset: z.number().optional().nullable(),
}).refine((data) => new Date(data.end_time) > new Date(data.start_time), {
    message: "La hora de fin debe ser posterior a la de inicio",
    path: ["end_time"],
});

export type CreateAppointmentInput = z.infer<typeof CreateAppointmentSchema> & { spa_id: string };

export const UpdateAppointmentStatusSchema = z.object({
    status: z.enum(["BOOKED", "COMPLETED", "CANCELLED"]),
});

export type UpdateAppointmentStatusInput = z.infer<typeof UpdateAppointmentStatusSchema>;

export const UpdateAppointmentSchema = z.object({
    staff_id: z.string().uuid("ID de Staff inválido").optional(),
    service_ids: z.array(z.string().uuid()).min(1, "Debe seleccionar al menos un servicio").optional(),
    start_time: z.string().datetime({ message: "Fecha de inicio inválida (ISO 8601)" }).optional(),
    end_time: z.string().datetime({ message: "Fecha de fin inválida (ISO 8601)" }).optional(),
    timezone_offset: z.number().optional().nullable(),
}).refine((data) => {
    if (data.start_time && data.end_time) {
        return new Date(data.end_time) > new Date(data.start_time);
    }
    return true;
}, {
    message: "La hora de fin debe ser posterior a la de inicio",
    path: ["end_time"],
});

export type UpdateAppointmentInput = z.infer<typeof UpdateAppointmentSchema> & { id: string; spa_id: string };
