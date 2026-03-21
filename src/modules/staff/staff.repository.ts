import pool from "../../config/db.js";
import { CreateStaffInput, UpdateStaffInput } from "./staff.schema.js";

export interface StaffEntity {
    id: string;
    spa_id: string;
    full_name: string;
    identification_number: string;
    email: string | null;
    phone: string | null;
    active: boolean;
    created_at: Date;
}

export class StaffRepository {
    /**
     * Verifica que el Spa exista.
     */
    async checkSpaExists(spaId: string): Promise<boolean> {
        const result = await pool.query("SELECT id FROM spas WHERE id = $1", [spaId]);
        return result.rows.length > 0;
    }

    /**
     * Busca por número de identificación (DNI). Opcionalmente excluye un ID (útil para updates).
     * Retorna también el estado 'active' para manejar restauraciones.
     */
    async findByIdentification(spaId: string, identificationNumber: string, excludeId?: string): Promise<{ id: string, active: boolean } | null> {
        let query = "SELECT id, active FROM staff WHERE identification_number = $1 AND spa_id = $2";
        const params: any[] = [identificationNumber, spaId];

        if (excludeId) {
            query += " AND id != $3";
            params.push(excludeId);
        }

        const result = await pool.query(query, params);
        return result.rows[0] || null;
    }

    /**
     * Busca por email en todo el sistema (o en el spa, aunque el email suele ser global según schema, aquí lo buscaba global).
     */
    async findByEmail(email: string, excludeId?: string): Promise<{ id: string, active: boolean } | null> {
        let query = "SELECT id, active FROM staff WHERE email = $1";
        const params: any[] = [email];

        if (excludeId) {
            query += " AND id != $2";
            params.push(excludeId);
        }

        const result = await pool.query(query, params);
        return result.rows[0] || null;
    }

    /**
     * Inserta un nuevo miembro del personal.
     */
    async create(data: CreateStaffInput): Promise<StaffEntity> {
        const { spa_id, full_name, identification_number, email, phone, active } = data;
        const result = await pool.query(
            `INSERT INTO staff (spa_id, full_name, identification_number, email, phone, active) 
             VALUES ($1, $2, $3, $4, $5, $6) 
             RETURNING *`,
            [spa_id, full_name, identification_number, email, phone, active ?? true]
        );
        return result.rows[0];
    }

    /**
     * Obtiene el personal perteneciente a un Spa.
     */
    async findBySpa(spaId: string, includeArchived: boolean = false, filterId?: string): Promise<StaffEntity[]> {
        let query = includeArchived
            ? "SELECT * FROM staff WHERE spa_id = $1"
            : "SELECT * FROM staff WHERE spa_id = $1 AND active = true";

        const params: any[] = [spaId];
        let paramIdx = 2;

        if (filterId) {
            query += ` AND id = $${paramIdx++}`;
            params.push(filterId);
        }

        query += includeArchived ? " ORDER BY active DESC, created_at DESC" : " ORDER BY created_at DESC";

        const result = await pool.query(query, params);
        return result.rows;
    }

    /**
     * Busca un miembro activo por su ID.
     */
    async findById(id: string, spaId: string): Promise<StaffEntity | null> {
        const result = await pool.query(
            "SELECT * FROM staff WHERE id = $1 AND spa_id = $2 AND active = true",
            [id, spaId]
        );
        return result.rows[0] || null;
    }

    /**
     * Retorna solo los miembros activos que tienen rol de 'Terapeuta'.
     */
    async findTherapists(spaId: string): Promise<StaffEntity[]> {
        const result = await pool.query(
            `SELECT DISTINCT s.* 
             FROM staff s
             JOIN users u ON u.staff_id = s.id
             JOIN user_roles ur ON ur.user_id = u.id
             JOIN roles r ON r.id = ur.role_id
             WHERE s.spa_id = $1 
               AND s.active = true 
               AND u.active = true 
               AND r.name = 'Terapeuta'
             ORDER BY s.created_at DESC`,
            [spaId]
        );
        return result.rows;
    }

    /**
     * Actualiza información del personal de forma dinámica.
     */
    async update(id: string, spaId: string, data: UpdateStaffInput): Promise<StaffEntity | null> {
        const fields = Object.keys(data).filter(key => (data as any)[key] !== undefined);
        if (fields.length === 0) return this.findById(id, spaId);

        const setClause = fields.map((key, index) => `${key} = $${index + 3}`).join(", ");
        const values = fields.map(key => (data as any)[key]);

        const result = await pool.query(
            `UPDATE staff SET ${setClause} WHERE id = $1 AND spa_id = $2 RETURNING *`,
            [id, spaId, ...values]
        );
        return result.rows[0] || null;
    }

    /**
     * Desactiva un miembro (borrado lógico / archivado).
     */
    async softDelete(id: string, spaId: string): Promise<StaffEntity | null> {
        const result = await pool.query(
            "UPDATE staff SET active = false WHERE id = $1 AND spa_id = $2 RETURNING *",
            [id, spaId]
        );
        return result.rows[0] || null;
    }

    /**
     * Restaura un miembro archivado (active = true).
     */
    async restoreById(id: string, spaId: string): Promise<StaffEntity | null> {
        const result = await pool.query(
            "UPDATE staff SET active = true WHERE id = $1 AND spa_id = $2 AND active = false RETURNING *",
            [id, spaId]
        );
        return result.rows[0] || null;
    }
}
