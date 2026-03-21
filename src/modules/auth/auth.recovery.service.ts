import { AuthRepository, PasswordResetEntity, RecoveryTarget } from "./auth.repository.js";
import { hashPassword } from "../../utils/security.js";
import crypto from "crypto";

const repository = new AuthRepository();

export class AuthRecoveryService {

    /**
     * Genera un token de recuperación y lo asocia al usuario si existe.
     */
    async requestReset(email: string): Promise<{ message: string }> {
        // 1. Buscar usuario en ambas tablas
        const target: RecoveryTarget | null = await repository.findUserForRecovery(email);

        if (!target) {
            return { message: "Si el correo está registrado, recibirás instrucciones en breve." };
        }

        // 2. Rate Limiting: Máximo 3 solicitudes por hora
        const recentAttempts = await repository.countRecentResetAttempts(target.user_id, target.platform_user_id);

        if (recentAttempts >= 3) {
            console.warn(`[SECURITY] Rate limit excedido para: ${email}`);
            return { message: "Si el correo está registrado, recibirás instrucciones en breve." };
        }

        // 3. Generar Token
        const token = crypto.randomBytes(32).toString('hex');
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 1);

        // 4. Guardar en DB
        await repository.createPasswordReset(target.user_id, target.platform_user_id, tokenHash, expiresAt);

        // 5. Enviar Email Real (No bloqueante)
        this.sendResetEmail(email, target.full_name, token).catch(err => 
            console.error("Error enviando email de recuperación:", err)
        );

        return { message: "Instrucciones enviadas al correo electrónico." };
    }

    /**
     * Envía el correo de recuperación con el enlace dinámico.
     */
    private async sendResetEmail(email: string, userName: string, token: string): Promise<void> {
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
    async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

        // 1. Validar token
        const resetAttempt: PasswordResetEntity | null = await repository.findValidResetToken(tokenHash);

        if (!resetAttempt) {
            throw new Error("Token inválido, expirado o ya utilizado.");
        }

        const hashedPassword = await hashPassword(newPassword);

        // 2. Actualizar contraseña según el tipo de usuario
        if (resetAttempt.user_id) {
            await repository.updateUserPassword(resetAttempt.user_id, hashedPassword);
        } else if (resetAttempt.platform_user_id) {
            await repository.updatePlatformUserPassword(resetAttempt.platform_user_id, hashedPassword);
        }

        // 3. Marcar TODOS los tokens de este usuario como usados (Invalidación Global)
        await repository.invalidateAllResetTokens(resetAttempt.user_id, resetAttempt.platform_user_id);

        // 4. Notificación de Seguridad (No bloqueante)
        this.sendSecurityNotification(resetAttempt.user_id, resetAttempt.platform_user_id).catch(err => 
            console.error("Error enviando alerta de seguridad:", err)
        );

        return { message: "Contraseña actualizada exitosamente." };
    }

    /**
     * Envía una alerta de seguridad informando que la contraseña ha cambiado.
     */
    private async sendSecurityNotification(userId: string | null, platformUserId: string | null): Promise<void> {
        try {
            const { EmailService } = await import("../notifications/email.service.js");
            const emailService = new EmailService();

            let email = "";
            let userName = "";

            if (userId) {
                const userData = await repository.getUserEmailAndName(userId);
                if (userData) {
                    email = userData.email;
                    userName = userData.full_name;
                }
            } else if (platformUserId) {
                const platformData = await repository.getPlatformUserEmail(platformUserId);
                if (platformData) {
                    email = platformData.email;
                    userName = "Administrador de Plataforma";
                }
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
