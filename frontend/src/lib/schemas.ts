import { z } from "zod";

// --- CLIENT SCHEMAS ---
export const clientSchema = z.object({
    full_name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
    identity_number: z.string().min(5, "Identificación inválida"),
    email: z.string().email("Correo electrónico inválido").optional().nullable().or(z.literal("")),
    phone: z.string().min(7, "El teléfono debe tener al menos 7 dígitos").optional().nullable().or(z.literal("")),
});

// --- APPOINTMENT SCHEMAS ---
export const appointmentSchema = z.object({
    client_id: z.string().uuid("ID de Cliente inválido").optional().nullable(),
    // Campos para creación automática de cliente
    client_identity: z.string().min(1, "La identificación es obligatoria").max(50, "Identificación demasiado larga").optional().nullable().or(z.literal("")),
    client_name: z.string().min(1, "El nombre es obligatorio para nuevos clientes").max(150, "Nombre demasiado largo").optional().nullable().or(z.literal("")),
    client_email: z.string().email("Formato de correo inválido").optional().nullable().or(z.literal("")),
    client_phone: z.string().max(20, "Teléfono demasiado largo").optional().nullable().or(z.literal("")),
    client_birth_date: z.string().optional().nullable().or(z.literal("")),

    staff_id: z.string().uuid("Por favor, seleccione un profesional"),
    service_ids: z.array(z.string().uuid()).min(1, "Debe seleccionar al menos un servicio"),
    start_time: z.string().min(1, "La fecha y hora de inicio son requeridas"),
    end_time: z.string().min(1, "La fecha de fin es requerida"),
    timezone_offset: z.number().optional().nullable(),
}).refine((data) => {
    // La identificación es obligatoria para nuevos clientes (cuando no hay client_id)
    if (!data.client_id && (!data.client_identity || data.client_identity === "")) {
        return false;
    }
    return true;
}, {
    message: "Por favor, ingrese la identificación del cliente",
    path: ["client_identity"],
}).refine((data) => {
    // Si es cliente nuevo (no tiene ID), el nombre es obligatorio
    if (!data.client_id && (!data.client_name || data.client_name === "")) {
        return false;
    }
    return true;
}, {
    message: "El nombre completo es obligatorio para registrar al nuevo cliente",
    path: ["client_name"],
}).refine((data) => {
    if (data.start_time && data.end_time) {
        const start = new Date(data.start_time);
        const end = new Date(data.end_time);
        return end.getTime() > start.getTime();
    }
    return true;
}, {
    message: "La hora de fin debe ser posterior a la de inicio",
    path: ["end_time"],
});

export type AppointmentFormValues = z.infer<typeof appointmentSchema>;

// --- SERVICE SCHEMAS ---
export const serviceSchema = z.object({
    name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
    description: z.string().optional(),
    price: z.number().min(0, "El precio no puede ser negativo"),
    duration_minutes: z.number().min(1, "La duración mínima es de 1 minuto"),
});
