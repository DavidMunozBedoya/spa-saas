import { z } from "zod";

const BaseStaffSchema = z.object({
    full_name: z.string().min(3, "El nombre debe tener al menos 3 caracteres").max(150),
    identification_number: z.string().min(4, "Número de identificación requerido").max(100).regex(/^\d+$/, "El número de identificación debe contener solo números"),
    email: z.string().email("Email inválido").optional().nullable(),
    phone: z.string().max(50).optional().nullable(),
    active: z.boolean().default(true),
});

export const CreateStaffSchema = BaseStaffSchema;
export type CreateStaffInput = z.infer<typeof CreateStaffSchema> & { spa_id: string };

export const UpdateStaffSchema = BaseStaffSchema.partial();
export type UpdateStaffInput = z.infer<typeof UpdateStaffSchema>;
