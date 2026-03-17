import { z } from "zod";
import { passwordValidation } from "../../utils/common.schema.js";

export const RegisterSpaSchema = z.object({
    name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
    spaEmail: z.string().email("Correo de Spa inválido"),
    ownerName: z.string().min(2, "El nombre del propietario es requerido"),
    ownerEmail: z.string().email("Correo del propietario inválido"),
    password: passwordValidation,
    timezone: z.string().optional(),
});

export type RegisterSpaInput = z.infer<typeof RegisterSpaSchema>;

export const CreatePlatformUserSchema = z.object({
    email: z.string().email("Correo electrónico inválido"),
    password: passwordValidation,
    spaId: z.string().uuid("ID de Spa inválido"),
    fullName: z.string().min(2, "El nombre completo es requerido"),
});

export const UpdatePlatformUserSchema = z.object({
    email: z.string().email("Correo electrónico inválido").optional(),
    fullName: z.string().min(2, "El nombre completo es demasiado corto").optional(),
    password: passwordValidation.optional(),
    active: z.boolean().optional(),
    role: z.string().optional(),
});
