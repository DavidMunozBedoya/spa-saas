import pool from "../../config/db.js";
import { CreateStaffInput, UpdateStaffInput } from "./staff.schema.js";

export class StaffService {
    /**
     * Inserta un nuevo miembro del personal validando que el Spa exista.
     */
    async createStaff(data: CreateStaffInput) {
        const { spa_id, full_name, identification_number, email, phone, active } = data;

        // Verificar que el Spa existe
        const spaExists = await pool.query("SELECT id FROM spas WHERE id = $1", [spa_id]);
        if (spaExists.rows.length === 0) {
            throw new Error("El Spa especificado no existe");
        }

        // Check for duplicate identification_number
        const duplicateCheck = await pool.query(
            "SELECT id, active FROM staff WHERE identification_number = $1 AND spa_id = $2",
            [identification_number, spa_id]
        );
        if (duplicateCheck.rows.length > 0) {
            if (duplicateCheck.rows[0].active === false) {
                throw new Error("INACTIVE_DUPLICATE_ID");
            }
            throw new Error("Este número de identificación ya está registrado para otro empleado en este Spa.");
        }

        // Check for duplicate email if provided
        if (email) {
            const emailCheck = await pool.query(
                "SELECT id, active FROM staff WHERE email = $1",
                [email]
            );
            if (emailCheck.rows.length > 0) {
                if (emailCheck.rows[0].active === false) {
                    throw new Error("INACTIVE_DUPLICATE_EMAIL");
                }
                throw new Error("Este correo electrónico ya está en uso por otro usuario del sistema.");
            }
        }

        const result = await pool.query(
            `INSERT INTO staff (spa_id, full_name, identification_number, email, phone, active) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING *`,
            [spa_id, full_name, identification_number, email, phone, active ?? true]
        );

        return result.rows[0];
    }

    /**
     * Obtiene el personal perteneciente a un Spa, opcionalmente incluyendo inactivos.
     */
    async getBySpa(spa_id: string, includeInactive: boolean = false, staff_id?: string) {
        let query = includeInactive
            ? "SELECT * FROM staff WHERE spa_id = $1"
            : "SELECT * FROM staff WHERE spa_id = $1 AND active = true";

        const params: any[] = [spa_id];
        let paramIdx = 2;

        if (staff_id) {
            query += ` AND id = $${paramIdx++}`;
            params.push(staff_id);
        }

        query += includeInactive ? " ORDER BY active DESC, created_at DESC" : " ORDER BY created_at DESC";

        const result = await pool.query(query, params);
        return result.rows;
    }

    /**
     * Busca un miembro del personal por su ID.
     */
    async getById(id: string, spa_id: string) {
        const result = await pool.query(
            "SELECT * FROM staff WHERE id = $1 AND spa_id = $2 AND active = true",
            [id, spa_id]
        );
        return result.rows[0];
    }

    // Listar solo los terapeutas
    async getTherapists(spa_id: string) {
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
            [spa_id]
        );
        return result.rows;
    }

    /**
     * Desactiva un miembro del personal (borrado lógico).
     */
    async softDeleteStaff(id: string, spa_id: string) {
        const result = await pool.query(
            "UPDATE staff SET active = false WHERE id = $1 AND spa_id = $2 RETURNING *",
            [id, spa_id]
        );
        return result.rows[0];
    }

    /**
     * Actualiza campos del personal de forma dinámica.
     */
    async updateStaff(id: string, spa_id: string, data: UpdateStaffInput) {
        const fields = Object.keys(data).filter(key => (data as any)[key] !== undefined);
        if (fields.length === 0) return this.getById(id, spa_id);

        if (data.identification_number) {
            const duplicateCheck = await pool.query(
                "SELECT id FROM staff WHERE identification_number = $1 AND spa_id = $2 AND id != $3 AND active = true",
                [data.identification_number, spa_id, id]
            );
            if (duplicateCheck.rows.length > 0) {
                throw new Error("Este número de identificación ya está registrado para otro empleado en este Spa.");
            }
        }

        if (data.email) {
            const emailCheck = await pool.query(
                "SELECT id FROM staff WHERE email = $1 AND id != $2 AND active = true",
                [data.email, id]
            );
            if (emailCheck.rows.length > 0) {
                throw new Error("Este correo electrónico ya está en uso por otro usuario del sistema.");
            }
        }

        const setClause = fields.map((key, index) => `${key} = $${index + 3}`).join(", ");
        const values = fields.map(key => (data as any)[key]);

        const result = await pool.query(
            `UPDATE staff SET ${setClause} WHERE id = $1 AND spa_id = $2 RETURNING *`,
            [id, spa_id, ...values]
        );

        return result.rows[0];
    }
    /**
     * Reactiva un miembro del personal (revierte borrado lógico).
     */
    async reactivateStaff(id: string, spa_id: string) {
        const result = await pool.query(
            "UPDATE staff SET active = true WHERE id = $1 AND spa_id = $2 RETURNING *",
            [id, spa_id]
        );
        return result.rows[0];
    }
}
