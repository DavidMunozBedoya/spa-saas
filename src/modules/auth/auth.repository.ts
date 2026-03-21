import pool from "../../config/db.js";

// ─── Entidades tipadas ───

export interface SpaUserEntity {
    id: string;
    spa_id: string;
    full_name: string;
    password_hash: string;
    active: boolean;
    staff_id: string | null;
    role_ids: number[];
    spa_active: boolean;
}

export interface PlatformUserEntity {
    id: string;
    email: string;
    password_hash: string;
    role: string;
    active: boolean;
}

export interface RecoveryTarget {
    user_id: string | null;
    platform_user_id: string | null;
    full_name: string;
}

export interface PasswordResetEntity {
    id: string;
    user_id: string | null;
    platform_user_id: string | null;
    token_hash: string;
    expires_at: Date;
    used: boolean;
}

// ─── Repositorio ───

export class AuthRepository {

    // ─── Login ───

    async findSpaUserByEmail(email: string): Promise<SpaUserEntity | null> {
        const result = await pool.query(
            `SELECT u.id, u.spa_id, u.full_name, u.password_hash, u.active, u.staff_id,
                    ARRAY_AGG(ur.role_id) as role_ids,
                    s.active as spa_active
             FROM users u
             INNER JOIN spas s ON u.spa_id = s.id
             LEFT JOIN user_roles ur ON u.id = ur.user_id
             WHERE u.email = $1
             GROUP BY u.id, s.active, u.staff_id`,
            [email]
        );
        return result.rows[0] || null;
    }

    async findPlatformUserByEmail(email: string): Promise<PlatformUserEntity | null> {
        const result = await pool.query(
            "SELECT id, email, password_hash, role, active FROM platform_users WHERE email = $1",
            [email]
        );
        return result.rows[0] || null;
    }

    // ─── Recovery ───

    async findUserForRecovery(email: string): Promise<RecoveryTarget | null> {
        // Buscar en users primero
        const userRes = await pool.query(
            "SELECT id, full_name FROM users WHERE email = $1 AND active = true",
            [email]
        );
        if (userRes.rows.length > 0) {
            return {
                user_id: userRes.rows[0].id,
                platform_user_id: null,
                full_name: userRes.rows[0].full_name
            };
        }

        // Luego en platform_users
        const platformRes = await pool.query(
            "SELECT id, email FROM platform_users WHERE email = $1 AND active = true",
            [email]
        );
        if (platformRes.rows.length > 0) {
            return {
                user_id: null,
                platform_user_id: platformRes.rows[0].id,
                full_name: "Administrador de Plataforma"
            };
        }

        return null;
    }

    async countRecentResetAttempts(userId: string | null, platformUserId: string | null): Promise<number> {
        const result = await pool.query(
            `SELECT COUNT(*) FROM password_resets 
             WHERE (user_id = $1 OR platform_user_id = $2) 
             AND created_at > NOW() - INTERVAL '1 hour'`,
            [userId, platformUserId]
        );
        return parseInt(result.rows[0].count) || 0;
    }

    async createPasswordReset(
        userId: string | null, 
        platformUserId: string | null, 
        tokenHash: string, 
        expiresAt: Date
    ): Promise<void> {
        await pool.query(
            `INSERT INTO password_resets (user_id, platform_user_id, token_hash, expires_at) 
             VALUES ($1, $2, $3, $4)`,
            [userId, platformUserId, tokenHash, expiresAt]
        );
    }

    async findValidResetToken(tokenHash: string): Promise<PasswordResetEntity | null> {
        const result = await pool.query(
            `SELECT * FROM password_resets 
             WHERE token_hash = $1 AND used = false AND expires_at > NOW()`,
            [tokenHash]
        );
        return result.rows[0] || null;
    }

    async updateUserPassword(userId: string, passwordHash: string): Promise<void> {
        await pool.query(
            "UPDATE users SET password_hash = $1 WHERE id = $2",
            [passwordHash, userId]
        );
    }

    async updatePlatformUserPassword(platformUserId: string, passwordHash: string): Promise<void> {
        await pool.query(
            "UPDATE platform_users SET password_hash = $1 WHERE id = $2",
            [passwordHash, platformUserId]
        );
    }

    async invalidateAllResetTokens(userId: string | null, platformUserId: string | null): Promise<void> {
        await pool.query(
            "UPDATE password_resets SET used = true WHERE (user_id = $1 OR platform_user_id = $2)", 
            [userId, platformUserId]
        );
    }

    async getUserEmailAndName(userId: string): Promise<{ email: string; full_name: string } | null> {
        const result = await pool.query(
            "SELECT email, full_name FROM users WHERE id = $1",
            [userId]
        );
        return result.rows[0] || null;
    }

    async getPlatformUserEmail(platformUserId: string): Promise<{ email: string } | null> {
        const result = await pool.query(
            "SELECT email FROM platform_users WHERE id = $1",
            [platformUserId]
        );
        return result.rows[0] || null;
    }
}
