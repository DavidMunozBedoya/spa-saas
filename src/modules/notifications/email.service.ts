import nodemailer from "nodemailer";

export interface EmailOptions {
    to: string;
    subject: string;
    html: string;
}

export class EmailService {
    private transporter: nodemailer.Transporter;

    constructor() {
        const port = Number(process.env.SMTP_PORT) || 2525;
        this.transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || "smtp.mailtrap.io",
            port: port,
            secure: port === 465, // True para puerto 465 (SSL), false para otros (TLS)
            auth: {
                user: process.env.SMTP_USER || "",
                pass: process.env.SMTP_PASS || "",
            },
        });
    }

    async sendEmail(options: EmailOptions) {
        try {
            const info = await this.transporter.sendMail({
                from: `"Sistema de Gestión Spa" <${process.env.SMTP_FROM || "no-reply@spa.com"}>`,
                to: options.to,
                subject: options.subject,
                html: options.html,
            });
            return info;
        } catch (error) {
            console.error("Error enviando email:", error);
            throw error;
        }
    }

    generatePasswordResetTemplate(data: {
        userName: string;
        resetUrl: string;
    }) {
        return `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px; border-radius: 10px;">
                <div style="text-align: center; margin-bottom: 20px;">
                    <h2 style="color: #4a4a4a; margin: 0;">Sistema de Gestión de Restablecimiento de Contraseña</h2>
                </div>
                
                <h3 style="color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px;">Recuperación de Contraseña</h3>
                
                <p>Hola <strong>${data.userName}</strong>,</p>
                <p>Has solicitado restablecer tu contraseña. Haz clic en el siguiente botón para crear una nueva clave de acceso:</p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${data.resetUrl}" style="background-color: #3498db; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">RESTABLECER CONTRASEÑA</a>
                </div>

                <p style="font-size: 0.9em; color: #7f8c8d;">
                    Si no has solicitado este cambio, por favor ignora este correo. Este enlace expirará en 1 hora.
                </p>

                <p style="font-size: 0.8em; color: #7f8c8d; border-top: 1px solid #eee; padding-top: 15px; margin-top: 20px;">
                    Si el botón no funciona, copia y pega el siguiente enlace en tu navegador:<br>
                    <a href="${data.resetUrl}" style="color: #3498db; word-break: break-all;">${data.resetUrl}</a>
                </p>
        `;
    }

    generatePasswordChangedTemplate(data: {
        userName: string;
    }) {
        return `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px; border-radius: 10px;">
                <div style="text-align: center; margin-bottom: 20px;">
                    <h2 style="color: #4a4a4a; margin: 0;">Sistema de Gestión Spa</h2>
                </div>
                
                <h3 style="color: #2c3e50; border-bottom: 2px solid #e74c3c; padding-bottom: 10px;">Seguridad: Contraseña Cambiada</h3>
                
                <p>Hola <strong>${data.userName}</strong>,</p>
                <p>Te informamos que la contraseña de tu cuenta ha sido <strong>cambiada exitosamente</strong>.</p>
                
                <div style="background-color: #fff5f5; border: 1px solid #feb2b2; border-radius: 8px; padding: 15px; margin: 25px 0;">
                    <p style="margin: 0; color: #c53030; font-size: 0.9em;">
                        <strong>¿No fuiste tú?</strong> Si no has realizado este cambio, por favor contacta de inmediato con el administrador de tu Spa o con el equipo de soporte técnico para proteger tu cuenta.
                    </p>
                </div>

                <p style="font-size: 0.8em; color: #7f8c8d; border-top: 1px solid #eee; padding-top: 15px; margin-top: 20px; text-align: center;">
                    Este es un mensaje automático de seguridad. Por favor, no respondas a este correo.
                </p>
            </div>
        `;
    }
}
