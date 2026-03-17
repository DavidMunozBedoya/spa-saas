import pool from "../../config/db.js";
import { comparePassword } from "../../utils/security.js";
import jwt from "jsonwebtoken";
import { LoginInput } from "./auth.schema.js";
import { PermissionService } from "../users/permission.service.js";

export class AuthService {
    private jwtSecret = process.env.JWT_SECRET || "supersecretkey_change_me_in_production";
    private permissionService = new PermissionService();

    /**
     * Valida credenciales de usuarios de Spas y genera un token JWT con el spaId incluido.
     */
    async login(data: LoginInput) {
        const { email, password } = data;

        // 1. Intentar buscar en usuarios de Spas
        const result = await pool.query(
            `SELECT u.id, u.spa_id, u.full_name, u.password_hash, u.active,
                    ARRAY_AGG(ur.role_id) as role_ids,
                    s.active as spa_active
             FROM users u
             INNER JOIN spas s ON u.spa_id = s.id
             LEFT JOIN user_roles ur ON u.id = ur.user_id
             WHERE u.email = $1
             GROUP BY u.id, s.active`,
            [email]
        );

        const user = result.rows[0];

        // 2. Si se encuentra en 'users', validar contraseña
        if (user) {
            if (!user.active || !user.spa_active) {
                throw new Error("Cuenta desactivada o Spa no disponible");
            }

            const isPasswordValid = await comparePassword(password, user.password_hash);
            if (!isPasswordValid) {
                throw new Error("Credenciales inválidas");
            }

            const token = jwt.sign(
                {
                    userId: user.id,
                    spaId: user.spa_id,
                    roleIds: user.role_ids
                },
                this.jwtSecret,
                { expiresIn: "8h" }
            );

            const permissions = await this.permissionService.getUserPermissions(user.id, user.spa_id);

            return {
                token,
                user: {
                    id: user.id,
                    full_name: user.full_name,
                    email,
                    spa_id: user.spa_id,
                    role_ids: user.role_ids,
                    permissions,
                    isPlatformAdmin: false,
                    type: "SPA_USER"
                }
            };
        }

        throw new Error("Credenciales inválidas o cuenta no registrada en el Spa");
    }

    /**
     * Valida credenciales de SuperAdmin en la tabla platform_users y genera un token administrativo.
     */
    async platformLogin(data: LoginInput) {
        const { email, password } = data;

        // 1. Buscar en platform_users
        const result = await pool.query(
            "SELECT id, email, password_hash, role, active FROM platform_users WHERE email = $1",
            [email]
        );

        const user = result.rows[0];

        if (!user || !user.active) {
            throw new Error("Credenciales de plataforma inválidas");
        }

        // 2. Verificar contraseña
        const isPasswordValid = await comparePassword(password, user.password_hash);
        if (!isPasswordValid) {
            throw new Error("Credenciales de plataforma inválidas");
        }

        // 3. Generar JWT de Plataforma
        const token = jwt.sign(
            {
                userId: user.id,
                role: user.role, // "SUPER_ADMIN"
                isPlatformAdmin: true
            },
            this.jwtSecret,
            { expiresIn: "4h" }
        );

        return {
            token,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                isPlatformAdmin: true
            }
        };
    }
}
