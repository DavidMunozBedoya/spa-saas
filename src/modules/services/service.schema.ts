import { z } from "zod";

const BaseServiceSchema = z.object({
    name: z.string().min(3, "El nombre debe tener al menos 3 caracteres").max(150),
    description: z.string().optional().nullable(),
    duration_minutes: z.number().int().positive("La duración debe ser un número positivo"),
    price: z.number().positive("El precio debe ser un número positivo"),
});

export const CreateServiceSchema = BaseServiceSchema;
export type CreateServiceInput = z.infer<typeof CreateServiceSchema> & { spa_id: string };

export const UpdateServiceSchema = BaseServiceSchema.partial();

export type UpdateServiceInput = z.infer<typeof UpdateServiceSchema>;
