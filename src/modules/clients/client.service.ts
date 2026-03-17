import pool from "../../config/db.js";
import { CreateClientInput, UpdateClientInput } from "./client.schema.js";

export class ClientService {
    /**
     * Crea un cliente verificando que el email sea único dentro de un mismo Spa.
     */
    async createClient(data: CreateClientInput) {
        const { spa_id, full_name, identity_number, email, phone, birth_date } = data;

        // Remover verificación de email único (se permite email compartido entre familiares)

        // Verificar si la identidad ya existe
        if (identity_number) {
            const identityExists = await pool.query(
                "SELECT id FROM clients WHERE spa_id = $1 AND identity_number = $2 AND active = true",
                [spa_id, identity_number]
            );
            if (identityExists.rows.length > 0) {
                throw new Error("Esta identificación ya está registrada para otro cliente");
            }
        }

        const result = await pool.query(
            `INSERT INTO clients (spa_id, full_name, identity_number, email, phone, birth_date) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING *`,
            [spa_id, full_name, identity_number, email, phone, birth_date]
        );

        return result.rows[0];
    }

    /**
     * Busca un cliente por su número de identidad dentro de un Spa.
     */
    async findByIdentity(spa_id: string, identity_number: string) {
        const result = await pool.query(
            "SELECT * FROM clients WHERE spa_id = $1 AND identity_number = $2 AND active = true",
            [spa_id, identity_number]
        );
        return result.rows[0];
    }

    /**
     * Obtiene todos los clientes activos de un Spa.
     */
    async getBySpa(spa_id: string) {
        const result = await pool.query(
            "SELECT * FROM clients WHERE spa_id = $1 AND active = true ORDER BY full_name ASC",
            [spa_id]
        );
        return result.rows;
    }

    /**
     * Busca un cliente por su identificador único.
     */
    async getById(id: string, spa_id: string) {
        const result = await pool.query(
            "SELECT * FROM clients WHERE id = $1 AND spa_id = $2 AND active = true",
            [id, spa_id]
        );
        return result.rows[0];
    }

    /**
     * Actualiza la información de un cliente.
     */
    async updateClient(id: string, spa_id: string, data: UpdateClientInput) {
        const updateData: any = { ...data };

        // Whitelist de campos permitidos
        const allowedFields = ['full_name', 'identity_number', 'email', 'phone', 'birth_date', 'active'];
        const fields = Object.keys(updateData).filter(key =>
            allowedFields.includes(key) && updateData[key] !== undefined
        );

        if (fields.length === 0) return this.getById(id, spa_id);

        const setClause = fields.map((key, index) => `${key} = $${index + 3}`).join(", ");
        const values = fields.map(key => updateData[key]);

        const result = await pool.query(
            `UPDATE clients SET ${setClause} WHERE id = $1 AND spa_id = $2 AND active = true RETURNING *`,
            [id, spa_id, ...values]
        );

        return result.rows[0];
    }

    /**
     * Desactiva la ficha del cliente (borrado lógico).
     */
    async softDeleteClient(id: string, spa_id: string) {
        const result = await pool.query(
            "UPDATE clients SET active = false WHERE id = $1 AND spa_id = $2 RETURNING *",
            [id, spa_id]
        );
        return result.rows[0];
    }
}
