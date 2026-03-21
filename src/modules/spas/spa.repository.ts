import pool from "../../config/db.js";
import { CreateSpaInput, UpdateSpaInput } from "./spa.schema.js";

export interface SpaEntity {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    timezone: string;
    active: boolean;
    created_at: Date;
}

export class SpaRepository {
    /**
     * Crea un nuevo registro de Spa en la base de datos.
     */
    async create(data: CreateSpaInput): Promise<SpaEntity> {
        const { name, email, phone, timezone } = data;

        const result = await pool.query(
            `INSERT INTO spas (name, email, phone, timezone) 
             VALUES ($1, $2, $3, $4) 
             RETURNING *`,
            [name, email, phone, timezone || 'UTC'] // Fallback a UTC por defecto
        );

        return result.rows[0];
    }

    /**
     * Obtiene todos los Spas. Puede incluir archivados (inactivos).
     */
    async findAll(includeArchived: boolean = false): Promise<SpaEntity[]> {
        const query = includeArchived
            ? "SELECT * FROM spas ORDER BY active DESC, created_at DESC"
            : "SELECT * FROM spas WHERE active = true ORDER BY created_at DESC";

        const result = await pool.query(query);
        return result.rows;
    }

    /**
     * Obtiene un Spa activo por su ID.
     */
    async findById(id: string): Promise<SpaEntity | null> {
        const result = await pool.query(
            "SELECT * FROM spas WHERE id = $1 AND active = true",
            [id]
        );
        return result.rows[0] || null;
    }

    /**
     * Actualiza campos específicos de un Spa dinámicamente.
     */
    async update(id: string, data: UpdateSpaInput): Promise<SpaEntity | null> {
        const fields = Object.keys(data).filter(key => (data as any)[key] !== undefined);
        if (fields.length === 0) return this.findById(id);

        const setClause = fields.map((key, index) => `${key} = $${index + 2}`).join(", ");
        const values = fields.map(key => (data as any)[key]);

        const result = await pool.query(
            `UPDATE spas SET ${setClause} WHERE id = $1 AND active = true RETURNING *`,
            [id, ...values]
        );

        return result.rows[0] || null;
    }

    /**
     * Desactiva un Spa (borrado lógico) cambiando su estado 'active' a false.
     */
    async softDelete(id: string): Promise<SpaEntity | null> {
        const result = await pool.query(
            "UPDATE spas SET active = false WHERE id = $1 RETURNING *",
            [id]
        );
        return result.rows[0] || null;
    }

    /**
     * Reactiva un Spa desactivado cambiándolo a active = true.
     */
    async restoreById(id: string): Promise<SpaEntity | null> {
        const result = await pool.query(
            "UPDATE spas SET active = true WHERE id = $1 RETURNING *",
            [id]
        );
        return result.rows[0] || null;
    }
}
