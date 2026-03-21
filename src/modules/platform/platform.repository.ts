import pool from "../../config/db.js";

export class PlatformRepository {
    async getAllSpas(includeArchived: boolean = false) {
        const query = includeArchived
            ? "SELECT id, name, email, phone, timezone, active, created_at FROM spas ORDER BY active DESC, created_at DESC"
            : "SELECT id, name, email, phone, timezone, active, created_at FROM spas WHERE deleted_at IS NULL AND active = true ORDER BY created_at DESC";
            
        const result = await pool.query(query);
        return result.rows;
    }

    async updateSpa(id: string, data: { name?: string, email?: string, phone?: string, timezone?: string }) {
        const fields: string[] = [];
        const values: any[] = [];
        let index = 1;

        if (data.name) {
            fields.push(`name = $${index++}`);
            values.push(data.name);
        }
        if (data.email) {
            fields.push(`email = $${index++}`);
            values.push(data.email);
        }
        if (data.phone !== undefined) {
            fields.push(`phone = $${index++}`);
            values.push(data.phone);
        }
        if (data.timezone) {
            fields.push(`timezone = $${index++}`);
            values.push(data.timezone);
        }

        if (fields.length === 0) return null;

        values.push(id);
        const query = `UPDATE spas SET ${fields.join(", ")} WHERE id = $${index} RETURNING *`;
        const result = await pool.query(query, values);
        return result.rows[0];
    }

    async updateSpaStatus(id: string, active: boolean) {
        const result = await pool.query(
            "UPDATE spas SET active = $2 WHERE id = $1 RETURNING *",
            [id, active]
        );
        return result.rows[0];
    }

    async getGlobalStats() {
        const spasCount = await pool.query(
            "SELECT COUNT(*) FROM spas WHERE deleted_at IS NULL AND active = true"
        );
        const usersCount = await pool.query(`
            SELECT COUNT(u.id) 
            FROM users u
            JOIN user_roles ur ON u.id = ur.user_id
            JOIN roles r ON ur.role_id = r.id
            WHERE r.name = 'Propietario' 
            AND u.deleted_at IS NULL 
            AND u.active = true
        `);
        const appointmentsCount = await pool.query("SELECT COUNT(*) FROM appointments");

        return {
            totalSpas: parseInt(spasCount.rows[0].count),
            totalUsers: parseInt(usersCount.rows[0].count),
            totalAppointments: parseInt(appointmentsCount.rows[0].count)
        };
    }

    async registerSpaWithAdmin(data: {
        name: string,
        spaEmail: string,
        ownerName: string,
        ownerEmail: string,
        passwordHash: string,
        timezone?: string
    }) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const spaRes = await client.query(
                "INSERT INTO spas (name, email, timezone) VALUES ($1, $2, $3) RETURNING id",
                [data.name, data.spaEmail, data.timezone || 'UTC']
            );
            const spaId = spaRes.rows[0].id;

            const staffRes = await client.query(
                "INSERT INTO staff (spa_id, full_name, email) VALUES ($1, $2, $3) RETURNING id",
                [spaId, data.ownerName, data.ownerEmail]
            );
            const staffId = staffRes.rows[0].id;

            const userRes = await client.query(
                "INSERT INTO users (spa_id, full_name, email, password_hash, staff_id) VALUES ($1, $2, $3, $4, $5) RETURNING id",
                [spaId, data.ownerName, data.ownerEmail, data.passwordHash, staffId]
            );
            const userId = userRes.rows[0].id;

            const roleRes = await client.query("SELECT id FROM roles WHERE name = 'Propietario'");
            const roleId = roleRes.rows[0].id;

            await client.query(
                "INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)",
                [userId, roleId]
            );

            await client.query('COMMIT');
            return { spaId, userId, staffId };
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    async deleteSpa(id: string) {
        await pool.query('UPDATE spas SET deleted_at = NOW(), active = false WHERE id = $1', [id]);
        return { message: 'Spa eliminado (Soft Delete) correctamente' };
    }

    async restoreSpa(id: string) {
        await pool.query('UPDATE spas SET deleted_at = NULL, active = true WHERE id = $1', [id]);
        return { message: 'Spa restaurado correctamente' };
    }

    async getAllPlatformUsers() {
        const result = await pool.query(
            `SELECT 
                u.id, 
                u.email, 
                u.full_name, 
                u.active, 
                u.created_at, 
                s.name as spa_name,
                s.deleted_at IS NOT NULL as spa_deleted,
                r.name as role
             FROM users u
             JOIN spas s ON u.spa_id = s.id
             JOIN user_roles ur ON u.id = ur.user_id
             JOIN roles r ON ur.role_id = r.id
             WHERE r.name = 'Propietario' AND u.deleted_at IS NULL
             ORDER BY u.created_at DESC`
        );
        return result.rows;
    }

    async checkEmailExistsInPlatformOrUsers(email: string): Promise<boolean> {
        const userCheck = await pool.query(
            `SELECT email FROM users WHERE email = $1 
             UNION 
             SELECT email FROM platform_users WHERE email = $1`,
            [email]
        );
        return userCheck.rows.length > 0;
    }

    async createPlatformUser(data: { email: string, passwordHash: string, spaId: string, fullName: string }) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const userRes = await client.query(
                "INSERT INTO users (spa_id, full_name, email, password_hash) VALUES ($1, $2, $3, $4) RETURNING id, email, full_name, active, created_at",
                [data.spaId, data.fullName, data.email, data.passwordHash]
            );
            const user = userRes.rows[0];

            const roleRes = await client.query("SELECT id FROM roles WHERE name = 'Propietario'");
            const roleId = roleRes.rows[0].id;

            await client.query(
                "INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)",
                [user.id, roleId]
            );

            await client.query('COMMIT');
            return user;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    async updatePlatformUser(id: string, data: { email?: string, fullName?: string, passwordHash?: string, active?: boolean }) {
        const fields: string[] = [];
        const values: any[] = [];
        let index = 1;

        if (data.email) {
            fields.push(`email = $${index++}`);
            values.push(data.email);
        }
        if (data.fullName) {
            fields.push(`full_name = $${index++}`);
            values.push(data.fullName);
        }
        if (data.passwordHash) {
            fields.push(`password_hash = $${index++}`);
            values.push(data.passwordHash);
        }
        if (data.active !== undefined) {
            fields.push(`active = $${index++}`);
            values.push(data.active);
        }

        if (fields.length === 0) return null;

        values.push(id);
        const query = `UPDATE users SET ${fields.join(", ")} WHERE id = $${index} RETURNING id, email, full_name, active`;
        const result = await pool.query(query, values);
        return result.rows[0];
    }

    async deletePlatformUser(id: string) {
        const userRes = await pool.query(
            `SELECT u.spa_id, s.deleted_at 
             FROM users u 
             JOIN spas s ON u.spa_id = s.id 
             WHERE u.id = $1`,
            [id]
        );

        if (userRes.rows.length > 0 && userRes.rows[0].deleted_at === null) {
            throw new Error("No se puede eliminar al administrador porque su Spa asociado no ha sido eliminado. Primero elimine el Spa, o suspéndalo/cambie credenciales si solo desea revocar el acceso.");
        }

        await pool.query('UPDATE users SET deleted_at = NOW(), active = false WHERE id = $1', [id]);
        return { message: 'Administrador de Spa eliminado correctamente' };
    }
}
