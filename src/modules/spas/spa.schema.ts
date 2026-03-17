import { z } from "zod";

export const CreateSpaSchema = z.object({
    name: z.string().min(3, "El nombre debe tener al menos 3 caracteres").max(150),
    email: z.string().email("Email inválido").optional().nullable(),
    phone: z.string().max(50).optional().nullable(),
    timezone: z.string().default("UTC"),
});

export type CreateSpaInput = z.infer<typeof CreateSpaSchema>;

export const UpdateSpaSchema = z.object({
    name: z.string().min(3, "El nombre debe tener al menos 3 caracteres").max(150, "El nombre es demasiado largo").optional(),
    email: z.string().email("Formato de email inválido").optional().nullable(),
    phone: z.string().max(50, "El teléfono es demasiado largo").optional().nullable(),
    timezone: z.string().optional().default("UTC"),
    address: z.string().min(5, "La dirección es muy corta o requerida").optional().nullable(),
    logo_url: z.string().refine((s: string) => s.startsWith('http') || s.startsWith('data:image/'), { message: "El logo debe ser una URL válida o imagen" }).optional().nullable(),
    website: z.union([z.string().url("URL de sitio web inválida"), z.literal(""), z.null()]).optional(),
    facebook_url: z.union([z.string().url("URL de Facebook inválida"), z.literal(""), z.null()]).optional(),
    instagram_url: z.union([z.string().url("URL de Instagram inválida"), z.literal(""), z.null()]).optional(),
    description: z.string().max(500, "La descripción es demasiado larga").optional().nullable(),
    opening_hours: z.any().optional(),
});

export type UpdateSpaInput = z.infer<typeof UpdateSpaSchema>;
