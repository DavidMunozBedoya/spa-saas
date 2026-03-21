import pool from "../../config/db.js";
import { CreateServiceInput, UpdateServiceInput } from "./service.schema.js";

export interface ServiceEntity {
    id: string;
    spa_id: string;
    name: string;
    description: string | null;
    duration_minutes: number;
    price: string; // numeric in DB comes as string in pg
    active: boolean;
    created_at: Date;
}

export class ServiceRepository {
    /**
     * Inserta un nuevo servicio en la base de datos de un Spa.
     */
    async create(data: CreateServiceInput): Promise<ServiceEntity> {
        const { spa_id, name, description, duration_minutes, price } = data;
        const result = await pool.query(
            `INSERT INTO services (spa_id, name, description, duration_minutes, price) 
             VALUES ($1, $2, $3, $4, $5) 
             RETURNING *`,
            [spa_id, name, description, duration_minutes, price]
        );
        return result.rows[0];
    }

    /**
     * Lista servicios de un Spa, ordenados alfabéticamente.
     * Si includeArchived es true, devuelve TODOS (activos + archivados).
     */
    async findBySpa(spaId: string, includeArchived = false): Promise<ServiceEntity[]> {
        const activeFilter = includeArchived ? "" : "AND active = true";
        const result = await pool.query(
            `SELECT * FROM services WHERE spa_id = $1 ${activeFilter} ORDER BY active DESC, name ASC`,
            [spaId]
        );
        return result.rows;
    }

    /**
     * Busca un servicio activo por su ID.
     */
    async findById(id: string, spaId: string): Promise<ServiceEntity | null> {
        const result = await pool.query(
            "SELECT * FROM services WHERE id = $1 AND spa_id = $2 AND active = true",
            [id, spaId]
        );
        return result.rows[0] || null;
    }

    /**
     * Busca un servicio por su nombre en el Spa (para chequear duplicados).
     * Opcionalmente excluye un ID (útil para el update).
     */
    async findByName(spaId: string, name: string, excludeId?: string): Promise<ServiceEntity | null> {
        let query = "SELECT * FROM services WHERE spa_id = $1 AND LOWER(name) = LOWER($2)";
        const params: any[] = [spaId, name];

        if (excludeId) {
            query += " AND id != $3";
            params.push(excludeId);
        }

        const result = await pool.query(query, params);
        return result.rows[0] || null;
    }

    /**
     * Actualiza la información de un servicio.
     */
    async update(id: string, spaId: string, data: UpdateServiceInput): Promise<ServiceEntity | null> {
        // Whitelist de campos permitidos
        const allowedFields = ['name', 'description', 'duration_minutes', 'price', 'active'];
        const updateData = data as any;
        const fields = Object.keys(updateData).filter(key =>
            allowedFields.includes(key) && updateData[key] !== undefined
        );

        if (fields.length === 0) return this.findById(id, spaId);

        const setClause = fields.map((key, index) => `${key} = $${index + 3}`).join(", ");
        const values = fields.map(key => updateData[key]);

        const result = await pool.query(
            `UPDATE services SET ${setClause} WHERE id = $1 AND spa_id = $2 AND active = true RETURNING *`,
            [id, spaId, ...values]
        );

        return result.rows[0] || null;
    }

    /**
     * Desactiva un servicio (archivado lógico).
     */
    async softDelete(id: string, spaId: string): Promise<ServiceEntity | null> {
        const result = await pool.query(
            "UPDATE services SET active = false WHERE id = $1 AND spa_id = $2 RETURNING *",
            [id, spaId]
        );
        return result.rows[0] || null;
    }

    /**
     * Restaura un servicio archivado (pone active = true).
     */
    async restoreById(id: string, spaId: string): Promise<ServiceEntity | null> {
        const result = await pool.query(
            "UPDATE services SET active = true WHERE id = $1 AND spa_id = $2 AND active = false RETURNING *",
            [id, spaId]
        );
        return result.rows[0] || null;
    }
}
