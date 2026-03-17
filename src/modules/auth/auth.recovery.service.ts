import pool from "../../config/db.js";
import { hashPassword } from "../../utils/security.js";
import crypto from "crypto";

export class AuthRecoveryService {

    /**
     * Genera un token de recuperación y lo asocia al usuario si existe.
     */
    async requestReset(email: string) {
        // 1. Buscar usuario en ambas tablas
        let userId: string | null = null;
        let platformUserId: string | null = null;
        let fullName = "";

        const userRes = await pool.query("SELECT id, full_name FROM users WHERE email = $1 AND active = true", [email]);
        if (userRes.rows.length > 0) {
            userId = userRes.rows[0].id;
            fullName = userRes.rows[0].full_name;
        } else {
            const platformRes = await pool.query("SELECT id, email FROM platform_users WHERE email = $1 AND active = true", [email]);
            if (platformRes.rows.length > 0) {
                platformUserId = platformRes.rows[0].id;
                fullName = "Administrador de Plataforma";
            }
        }

        if (!userId && !platformUserId) {
            return { message: "Si el correo está registrado, recibirás instrucciones en breve." };
        }

        // 1.5 Rate Limiting: Máximo 3 solicitudes por hora
        const rateLimitRes = await pool.query(
            `SELECT COUNT(*) FROM password_resets 
             WHERE (user_id = $1 OR platform_user_id = $2) 
             AND created_at > NOW() - INTERVAL '1 hour'`,
            [userId, platformUserId]
        );

        if (parseInt(rateLimitRes.rows[0].count) >= 3) {
            console.warn(`[SECURITY] Rate limit excedido para: ${email}`);
            return { message: "Si el correo está registrado, recibirás instrucciones en breve." };
        }

        // 2. Generar Token
        const token = crypto.randomBytes(32).toString('hex');
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 1); // 1 hora de validez

        // 3. Guardar en DB
        await pool.query(
            `INSERT INTO password_resets (user_id, platform_user_id, token_hash, expires_at) 
             VALUES ($1, $2, $3, $4)`,
            [userId, platformUserId, tokenHash, expiresAt]
        );

        // 4. Enviar Email Real (No bloqueante)
        this.sendResetEmail(email, fullName, token).catch(err => console.error("Error enviando email de recuperación:", err));

        return { message: "Instrucciones enviadas al correo electrónico." };
    }

    /**
     * Envía el correo de recuperación con el enlace dinámico.
     */
    private async sendResetEmail(email: string, userName: string, token: string) {
        try {
            const { EmailService } = await import("../notifications/email.service.js");
            const emailService = new EmailService();

            const resetUrl = `http://localhost:3000/reset-password?token=${token}`;
            const html = emailService.generatePasswordResetTemplate({ userName, resetUrl });

            await emailService.sendEmail({
                to: email,
                subject: "Recuperación de Contraseña - Sistema Spa",
                html
            });
        } catch (error) {
            console.error("Error en servicio de correo (Recuperación):", error);
        }
    }

    /**
     * Restablece la contraseña usando un token válido.
     */
    async resetPassword(token: string, newPassword: string) {
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

        // 1. Validar token
        const resetRes = await pool.query(
            `SELECT * FROM password_resets 
             WHERE token_hash = $1 AND used = false AND expires_at > NOW()`,
            [tokenHash]
        );

        if (resetRes.rows.length === 0) {
            throw new Error("Token inválido, expirado o ya utilizado.");
        }

        const resetAttempt = resetRes.rows[0];
        const hashedPassword = await hashPassword(newPassword);

        // 2. Actualizar contraseña según el tipo de usuario
        if (resetAttempt.user_id) {
            await pool.query("UPDATE users SET password_hash = $1 WHERE id = $2", [hashedPassword, resetAttempt.user_id]);
        } else if (resetAttempt.platform_user_id) {
            await pool.query("UPDATE platform_users SET password_hash = $1 WHERE id = $2", [hashedPassword, resetAttempt.platform_user_id]);
        }

        // 3. Marcar TODOS los tokens de este usuario como usados (Invalidación Global)
        await pool.query(
            "UPDATE password_resets SET used = true WHERE (user_id = $1 OR platform_user_id = $2)", 
            [resetAttempt.user_id, resetAttempt.platform_user_id]
        );

        // 4. Notificación de Seguridad (No bloqueante)
        this.sendSecurityNotification(resetAttempt.user_id, resetAttempt.platform_user_id).catch(err => console.error("Error enviando alerta de seguridad:", err));

        return { message: "Contraseña actualizada exitosamente." };
    }

    /**
     * Envía una alerta de seguridad informando que la contraseña ha cambiado.
     */
    private async sendSecurityNotification(userId: string | null, platformUserId: string | null) {
        try {
            const { EmailService } = await import("../notifications/email.service.js");
            const emailService = new EmailService();

            let email = "";
            let userName = "";

            if (userId) {
                const res = await pool.query("SELECT email, full_name FROM users WHERE id = $1", [userId]);
                email = res.rows[0]?.email;
                userName = res.rows[0]?.full_name;
            } else if (platformUserId) {
                const res = await pool.query("SELECT email FROM platform_users WHERE id = $1", [platformUserId]);
                email = res.rows[0]?.email;
                userName = "Administrador de Plataforma";
            }

            if (!email) return;

            const html = emailService.generatePasswordChangedTemplate({ userName });
            await emailService.sendEmail({
                to: email,
                subject: "Alerta de Seguridad: Tu contraseña ha sido cambiada",
                html
            });
        } catch (error) {
            console.error("Error en servicio de correo (Alerta Seguridad):", error);
        }
    }
}
