import pool from "../../config/db.js";

export class UserRepository {
    /**
     * Verifica globalmente si un email existe (opcionalmente excluyendo un ID).
     */
    async checkEmailExists(email: string, excludeId?: string): Promise<boolean> {
        let query = "SELECT id FROM users WHERE email = $1";
        const params: any[] = [email];
        if (excludeId) {
            query += " AND id != $2";
            params.push(excludeId);
        }
        const result = await pool.query(query, params);
        return result.rows.length > 0;
    }

    /**
     * Crea un usuario y sus roles asociados en una transacción.
     */
    async create(data: {
        spa_id: string;
        staff_id?: string | null;
        full_name: string;
        email: string;
        password_hash: string;
        role_ids: number[];
    }) {
        const { spa_id, full_name, email, password_hash, staff_id, role_ids } = data;
        const client = await pool.connect();
        try {
            await client.query("BEGIN");

            // Insertar usuario
            const userResult = await client.query(
                `INSERT INTO users (spa_id, full_name, email, password_hash, staff_id) 
                 VALUES ($1, $2, $3, $4, $5) 
                 RETURNING id, spa_id, staff_id, full_name, email, active, created_at`,
                [spa_id, full_name, email, password_hash, staff_id || null]
            );
            const user = userResult.rows[0];

            // Insertar roles
            if (role_ids && role_ids.length > 0) {
                for (const role_id of role_ids) {
                    await client.query(
                        "INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)",
                        [user.id, role_id]
                    );
                }
            }

            await client.query("COMMIT");
            return { ...user, role_ids };
        } catch (error) {
            await client.query("ROLLBACK");
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Obtiene los usuarios de un Spa con sus roles. Opcionalmente incluye inactivos.
     */
    async findBySpa(spa_id: string, includeArchived: boolean = false) {
        const query = includeArchived
            ? `SELECT u.id, u.staff_id, u.full_name, u.email, u.active, u.created_at, 
                      ARRAY_AGG(ur.role_id) as role_ids
               FROM users u
               LEFT JOIN user_roles ur ON u.id = ur.user_id
               WHERE u.spa_id = $1 
               GROUP BY u.id
               ORDER BY u.active DESC, u.created_at DESC`
            : `SELECT u.id, u.staff_id, u.full_name, u.email, u.active, u.created_at, 
                      ARRAY_AGG(ur.role_id) as role_ids
               FROM users u
               LEFT JOIN user_roles ur ON u.id = ur.user_id
               WHERE u.spa_id = $1 AND u.active = true 
               GROUP BY u.id
               ORDER BY u.created_at DESC`;

        const result = await pool.query(query, [spa_id]);
        return result.rows;
    }

    /**
     * Obtiene un usuario por ID validando su pertenencia al Spa.
     */
    async findById(id: string, spa_id: string) {
        const result = await pool.query(
            `SELECT u.id, u.spa_id, u.staff_id, u.full_name, u.email, u.active, u.created_at,
                    ARRAY_AGG(ur.role_id) as role_ids
             FROM users u
             LEFT JOIN user_roles ur ON u.id = ur.user_id
             WHERE u.id = $1 AND u.spa_id = $2
             GROUP BY u.id`,
            [id, spa_id]
        );
        return result.rows[0];
    }

    /**
     * Actualiza un usuario y sus roles en una transacción.
     */
    async update(id: string, spa_id: string, updateData: any) {
        const client = await pool.connect();
        try {
            await client.query("BEGIN");

            const role_ids = updateData.role_ids;
            delete updateData.role_ids;

            const allowedFields = ['full_name', 'email', 'password_hash', 'staff_id', 'active'];
            const fields = Object.keys(updateData).filter(key =>
                allowedFields.includes(key) && updateData[key] !== undefined
            );

            if (fields.length > 0) {
                const setClause = fields.map((key, index) => `${key} = $${index + 3}`).join(", ");
                const values = fields.map(key => updateData[key]);
                const updateRes = await client.query(
                    `UPDATE users SET ${setClause} WHERE id = $1 AND spa_id = $2 RETURNING *`,
                    [id, spa_id, ...values]
                );

                if (updateRes.rowCount === 0) {
                    throw new Error("Usuario no encontrado o no pertenece a su Spa");
                }
            }

            if (role_ids) {
                // Sincronizar roles
                await client.query("DELETE FROM user_roles WHERE user_id = $1", [id]);
                for (const role_id of role_ids) {
                    await client.query(
                        "INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)",
                        [id, role_id]
                    );
                }
            }

            await client.query("COMMIT");
            return await this.findById(id, spa_id);
        } catch (error) {
            await client.query("ROLLBACK");
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Realiza un soft delete (borrado lógico).
     */
    async softDelete(id: string, spa_id: string) {
        const result = await pool.query(
            "UPDATE users SET active = false WHERE id = $1 AND spa_id = $2 RETURNING id, full_name, active",
            [id, spa_id]
        );
        return result.rows[0];
    }

    /**
     * Reactiva/restaura un usuario (vuelve a dejarlo activo).
     */
    async restore(id: string, spa_id: string) {
        const result = await pool.query(
            "UPDATE users SET active = true WHERE id = $1 AND spa_id = $2 RETURNING id, full_name, active",
            [id, spa_id]
        );
        return result.rows[0];
    }
}
