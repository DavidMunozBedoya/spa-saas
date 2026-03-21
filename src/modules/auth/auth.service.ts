import { AuthRepository, SpaUserEntity, PlatformUserEntity } from "./auth.repository.js";
import { comparePassword } from "../../utils/security.js";
import jwt from "jsonwebtoken";
import { LoginInput } from "./auth.schema.js";
import { PermissionService } from "../users/permission.service.js";

if (!process.env.JWT_SECRET) {
    throw new Error("FATAL ERROR: JWT_SECRET environment variable is not defined");
}
const jwtSecret = process.env.JWT_SECRET;

const repository = new AuthRepository();

interface LoginResult {
    token: string;
    user: {
        id: string;
        full_name?: string;
        email: string;
        spa_id?: string;
        staff_id?: string | null;
        role_ids?: number[];
        permissions?: string[];
        isPlatformAdmin: boolean;
        type?: string;
        role?: string;
    };
}

export class AuthService {
    private permissionService = new PermissionService();

    /**
     * Valida credenciales de usuarios de Spas y genera un token JWT con el spaId incluido.
     */
    async login(data: LoginInput): Promise<LoginResult> {
        const { email, password } = data;

        const user: SpaUserEntity | null = await repository.findSpaUserByEmail(email);

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
                    staffId: user.staff_id,
                    roleIds: user.role_ids
                },
                jwtSecret,
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
                    staff_id: user.staff_id,
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
    async platformLogin(data: LoginInput): Promise<LoginResult> {
        const { email, password } = data;

        const user: PlatformUserEntity | null = await repository.findPlatformUserByEmail(email);

        if (!user || !user.active) {
            throw new Error("Credenciales de plataforma inválidas");
        }

        const isPasswordValid = await comparePassword(password, user.password_hash);
        if (!isPasswordValid) {
            throw new Error("Credenciales de plataforma inválidas");
        }

        const token = jwt.sign(
            {
                userId: user.id,
                role: user.role,
                isPlatformAdmin: true
            },
            jwtSecret,
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
