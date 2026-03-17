import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";

export const validate = (schema: ZodSchema) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            await schema.parseAsync(req.body);
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                return res.status(400).json({
                    message: "Error de validación",
                    errors: error.issues.map((e) => ({
                        path: e.path.join("."),
                        message: e.message,
                    })),
                });
            }
            return res.status(500).json({ message: "Error interno del servidor" });
        }
    };
};
