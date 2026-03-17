import { z } from "zod";
import { passwordValidation } from "../../utils/common.schema.js";

export const LoginSchema = z.object({
    email: z.string().email("Email inválido"),
    password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
});

export type LoginInput = z.infer<typeof LoginSchema>;

export const RecoveryRequestSchema = z.object({
    email: z.string().email("Email inválido"),
});

export const PasswordResetSchema = z.object({
    token: z.string().min(1, "Token requerido"),
    password: passwordValidation,
});

export type RecoveryRequestInput = z.infer<typeof RecoveryRequestSchema>;
export type PasswordResetInput = z.infer<typeof PasswordResetSchema>;
