import pool from "../../config/db.js";
import { CreateSpaInput, UpdateSpaInput } from "./spa.schema.js";

export class SpaService {
    /**
     * Crea un nuevo registro de Spa en la base de datos.
     */
    async createSpa(data: CreateSpaInput) {
        const { name, email, phone, timezone } = data;

        const result = await pool.query(
            `INSERT INTO spas (name, email, phone, timezone) 
       VALUES ($1, $2, $3, $4) 
       RETURNING *`,
            [name, email, phone, timezone || 'UTC']
        );

        return result.rows[0];
    }

    /**
     * Obtiene todos los Spas que están activos.
     */
    async getAllSpas() {
        const result = await pool.query("SELECT * FROM spas WHERE active = true ORDER BY created_at DESC");
        return result.rows;
    }

    /**
     * Actualiza campos específicos de un Spa de forma dinámica.
     */
    async updateSpa(id: string, data: UpdateSpaInput) {
        const fields = Object.keys(data).filter(key => (data as any)[key] !== undefined);
        if (fields.length === 0) return this.getSpaById(id);

        const setClause = fields.map((key, index) => `${key} = $${index + 2}`).join(", ");
        const values = fields.map(key => (data as any)[key]);

        const result = await pool.query(
            `UPDATE spas SET ${setClause} WHERE id = $1 AND active = true RETURNING *`,
            [id, ...values]
        );

        return result.rows[0];
    }

    /**
     * Busca un Spa específico por su ID único.
     */
    async getSpaById(id: string) {
        const result = await pool.query("SELECT * FROM spas WHERE id = $1 AND active = true", [id]);
        return result.rows[0];
    }

    /**
     * Desactiva un Spa (borrado lógico) cambiando su estado 'active' a false.
     */
    async softDeleteSpa(id: string) {
        const result = await pool.query(
            "UPDATE spas SET active = false WHERE id = $1 RETURNING *",
            [id]
        );
        return result.rows[0];
    }

    /**
     * Reactiva un Spa desactivado.
     */
    async reactivateSpa(id: string) {
        const result = await pool.query(
            "UPDATE spas SET active = true WHERE id = $1 RETURNING *",
            [id]
        );
        return result.rows[0];
    }
}
