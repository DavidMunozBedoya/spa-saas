import pool from "../../config/db.js";
import { CreateServiceInput, UpdateServiceInput } from "./service.schema.js";

export class ServiceService {
    /**
     * Inserta un nuevo servicio en la base de datos de un Spa.
     */
    async createService(data: CreateServiceInput) {
        const { spa_id, name, description, duration_minutes, price } = data;

        // Verificar si existe un servicio con el mismo nombre en este Spa
        const existing = await pool.query(
            "SELECT id FROM services WHERE spa_id = $1 AND LOWER(name) = LOWER($2) AND active = true",
            [spa_id, name]
        );
        if (existing.rows.length > 0) {
            throw new Error(`El servicio "${name}" ya existe en este Spa. No se permiten duplicados.`);
        }

        const result = await pool.query(
            `INSERT INTO services (spa_id, name, description, duration_minutes, price) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
            [spa_id, name, description, duration_minutes, price]
        );

        return result.rows[0];
    }

    /**
     * Obtiene todos los servicios activos de un Spa.
     */
    async getBySpa(spa_id: string) {
        const result = await pool.query(
            "SELECT * FROM services WHERE spa_id = $1 AND active = true ORDER BY name ASC",
            [spa_id]
        );
        return result.rows;
    }

    /**
     * Busca un servicio por su ID.
     */
    async getById(id: string, spa_id: string) {
        const result = await pool.query(
            "SELECT * FROM services WHERE id = $1 AND spa_id = $2 AND active = true",
            [id, spa_id]
        );
        return result.rows[0];
    }

    /**
     * Actualiza la información de un servicio.
     */
    async updateService(id: string, spa_id: string, data: UpdateServiceInput) {
        const updateData: any = { ...data };

        // Verificar si se intenta cambiar el nombre a uno que ya existe
        if (updateData.name) {
            const existing = await pool.query(
                "SELECT id FROM services WHERE spa_id = $1 AND LOWER(name) = LOWER($2) AND id != $3 AND active = true",
                [spa_id, updateData.name, id]
            );
            if (existing.rows.length > 0) {
                throw new Error(`Ya existe un servicio llamado "${updateData.name}" en este Spa.`);
            }
        }

        // Whitelist de campos permitidos
        const allowedFields = ['name', 'description', 'duration_minutes', 'price', 'active'];
        const fields = Object.keys(updateData).filter(key =>
            allowedFields.includes(key) && updateData[key] !== undefined
        );

        if (fields.length === 0) return this.getById(id, spa_id);

        const setClause = fields.map((key, index) => `${key} = $${index + 3}`).join(", ");
        const values = fields.map(key => updateData[key]);

        const result = await pool.query(
            `UPDATE services SET ${setClause} WHERE id = $1 AND spa_id = $2 AND active = true RETURNING *`,
            [id, spa_id, ...values]
        );

        return result.rows[0];
    }

    /**
     * Desactiva un servicio (borrado lógico).
     */
    async softDeleteService(id: string, spa_id: string) {
        const result = await pool.query(
            "UPDATE services SET active = false WHERE id = $1 AND spa_id = $2 RETURNING *",
            [id, spa_id]
        );
        return result.rows[0];
    }
}
