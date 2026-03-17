import { z } from "zod";

const BaseClientSchema = z.object({
    full_name: z.string().min(3, "El nombre debe tener al menos 3 caracteres").max(150),
    identity_number: z.string().min(5, "La identificación debe tener al menos 5 caracteres").max(50).regex(/^\d+$/, "El número de identificación debe contener solo números").optional().nullable(),
    email: z.string().email("Email inválido").optional().nullable(),
    phone: z.string().min(7, "El teléfono debe tener al menos 7 dígitos").max(20).optional().nullable(),
    birth_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de fecha inválido (YYYY-MM-DD)").optional().nullable(),
});

export const CreateClientSchema = BaseClientSchema;
export type CreateClientInput = z.infer<typeof CreateClientSchema> & { spa_id: string };

export const UpdateClientSchema = BaseClientSchema.partial();

export type UpdateClientInput = z.infer<typeof UpdateClientSchema>;
