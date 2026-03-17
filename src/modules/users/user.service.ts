import pool from "../../config/db.js";
import { hashPassword } from "../../utils/security.js";
import { CreateUserInput, UpdateUserInput } from "./user.schema.js";

export class UserService {

    /**
     * Crea un usuario, hashea la contraseña y lo vincula a un Spa.
     */
    /**
     * Crea un usuario, hashea la contraseña y lo vincula a un Spa con múltiples roles.
     */
    async createUser(data: CreateUserInput) {
        const { spa_id, role_ids, full_name, email, password, staff_id } = data;

        const client = await pool.connect();
        try {
            await client.query("BEGIN");

            // Verificar que el Spa existe
            const spaExists = await client.query("SELECT id FROM spas WHERE id = $1 AND active = true", [spa_id]);
            if (spaExists.rows.length === 0) {
                throw new Error("El Spa especificado no existe o está inactivo");
            }

            // Verificar unicidad de correo global
            const emailExists = await client.query("SELECT id FROM users WHERE email = $1", [email]);
            if (emailExists.rows.length > 0) {
                throw new Error("Este correo electrónico ya está registrado en la plataforma (Global)");
            }

            // Encriptar contraseña
            const hashedPassword = await hashPassword(password);

            // Insertar usuario
            const userResult = await client.query(
                `INSERT INTO users (spa_id, full_name, email, password_hash, staff_id) 
                 VALUES ($1, $2, $3, $4, $5) 
                 RETURNING id, spa_id, staff_id, full_name, email, active, created_at`,
                [spa_id, full_name, email, hashedPassword, staff_id || null]
            );
            const user = userResult.rows[0];

            // Insertar roles
            for (const role_id of role_ids) {
                await client.query(
                    "INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)",
                    [user.id, role_id]
                );
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
     * Obtiene los usuarios activos de un Spa con sus roles.
     */
    async getBySpa(spa_id: string) {
        const result = await pool.query(
            `SELECT u.id, u.staff_id, u.full_name, u.email, u.active, u.created_at, 
                    ARRAY_AGG(ur.role_id) as role_ids
             FROM users u
             LEFT JOIN user_roles ur ON u.id = ur.user_id
             WHERE u.spa_id = $1 AND u.active = true 
             GROUP BY u.id
             ORDER BY u.created_at DESC`,
            [spa_id]
        );
        return result.rows;
    }

    /**
     * Busca un usuario por su ID incluyendo sus roles, filtrado por Spa.
     */
    async getById(id: string, spa_id: string) {
        const result = await pool.query(
            `SELECT u.id, u.spa_id, u.staff_id, u.full_name, u.email, u.active, u.created_at,
                    ARRAY_AGG(ur.role_id) as role_ids
             FROM users u
             LEFT JOIN user_roles ur ON u.id = ur.user_id
             WHERE u.id = $1 AND u.spa_id = $2 AND u.active = true
             GROUP BY u.id`,
            [id, spa_id]
        );
        return result.rows[0];
    }

    /**
     * Actualiza los datos del usuario y sus roles de forma atómica.
     */
    async updateUser(id: string, spa_id: string, data: UpdateUserInput) {
        const client = await pool.connect();
        try {
            await client.query("BEGIN");

            const updateData: any = { ...data };
            const role_ids = updateData.role_ids;
            delete updateData.role_ids;

            if (updateData.password) {
                updateData.password_hash = await hashPassword(updateData.password);
                delete updateData.password;
            }

            if (updateData.email) {
                const emailExists = await client.query("SELECT id FROM users WHERE email = $1 AND id != $2", [updateData.email, id]);
                if (emailExists.rows.length > 0) {
                    throw new Error("Este correo electrónico ya está registrado en la plataforma (Global)");
                }
            }

            // Whitelist de campos permitidos para actualización
            const allowedFields = ['full_name', 'email', 'password_hash', 'staff_id', 'active'];
            const fields = Object.keys(updateData).filter(key =>
                allowedFields.includes(key) && updateData[key] !== undefined
            );

            if (fields.length > 0) {
                const setClause = fields.map((key, index) => `${key} = $${index + 3}`).join(", ");
                const values = fields.map(key => updateData[key]);
                const updateRes = await client.query(
                    `UPDATE users SET ${setClause} WHERE id = $1 AND spa_id = $2 AND active = true`,
                    [id, spa_id, ...values]
                );

                if (updateRes.rowCount === 0) {
                    throw new Error("Usuario no encontrado o no pertenece a su Spa");
                }
            }

            if (role_ids) {
                // Verificar que el usuario pertenece al Spa antes de tocar roles
                const checkRes = await client.query("SELECT id FROM users WHERE id = $1 AND spa_id = $2", [id, spa_id]);
                if (checkRes.rowCount === 0) {
                    throw new Error("Usuario no encontrado o no pertenece a su Spa");
                }

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
            return this.getById(id, spa_id);
        } catch (error) {
            await client.query("ROLLBACK");
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Desactiva un usuario (borrado lógico), filtrado por Spa.
     */
    async softDeleteUser(id: string, spa_id: string) {
        const result = await pool.query(
            "UPDATE users SET active = false WHERE id = $1 AND spa_id = $2 RETURNING id, full_name, active",
            [id, spa_id]
        );
        return result.rows[0];
    }
}
