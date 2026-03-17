import { z } from "zod";
import { passwordValidation } from "../../utils/common.schema.js";

export const CreateUserSchema = z.object({
    spa_id: z.string().uuid("ID de Spa inválido"),
    role_ids: z.array(z.number().int().positive()).min(1, "Debe asignar al menos un rol"),
    full_name: z.string().min(3, "El nombre debe tener al menos 3 caracteres").max(150),
    email: z.string().email("Email inválido"),
    password: passwordValidation,
    staff_id: z.string().uuid().optional().nullable(),
});

export type CreateUserInput = z.infer<typeof CreateUserSchema>;

export const UpdateUserSchema = z.object({
    full_name: z.string().min(3).max(150).optional(),
    email: z.string().email().optional(),
    password: passwordValidation.optional(),
    role_ids: z.array(z.number().int().positive()).min(1).optional(),
    staff_id: z.string().uuid().optional().nullable(),
    active: z.boolean().optional(),
});

export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;
