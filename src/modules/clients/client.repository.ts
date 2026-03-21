import pool from "../../config/db.js";
import { CreateClientInput } from "./client.schema.js";

// ─── Entidad tipada ───

export interface ClientEntity {
    id: string;
    spa_id: string;
    full_name: string;
    identity_number: string | null;
    phone: string | null;
    email: string | null;
    birth_date: string | null;
    active: boolean;
    created_at: Date;
}

// ─── Repositorio ───

export class ClientRepository {

    /**
     * Busca si ya existe un cliente con esa identificación dentro del Spa.
     * Se usa antes de crear para evitar duplicados.
     */
    async findByIdentityNumber(spaId: string, identityNumber: string): Promise<{ id: string } | null> {
        const result = await pool.query(
            "SELECT id FROM clients WHERE spa_id = $1 AND identity_number = $2 AND active = true",
            [spaId, identityNumber]
        );
        return result.rows[0] || null;
    }

    /**
     * Inserta un nuevo cliente y devuelve el registro completo.
     */
    async create(data: CreateClientInput): Promise<ClientEntity> {
        const { spa_id, full_name, identity_number, email, phone, birth_date } = data;
        const result = await pool.query(
            `INSERT INTO clients (spa_id, full_name, identity_number, email, phone, birth_date) 
             VALUES ($1, $2, $3, $4, $5, $6) 
             RETURNING *`,
            [spa_id, full_name, identity_number, email, phone, birth_date]
        );
        return result.rows[0];
    }

    /**
     * Busca un cliente INACTIVO por su número de identidad.
     * Se usa para detectar clientes eliminados que pueden ser reactivados.
     */
    async findInactiveByIdentity(spaId: string, identityNumber: string): Promise<ClientEntity | null> {
        const result = await pool.query(
            "SELECT * FROM clients WHERE spa_id = $1 AND identity_number = $2 AND active = false",
            [spaId, identityNumber]
        );
        return result.rows[0] || null;
    }

    /**
     * Reactiva un cliente inactivo y actualiza sus datos con la información nueva.
     * Pone active = true y sobrescribe nombre, email, teléfono, etc.
     */
    async reactivate(id: string, data: CreateClientInput): Promise<ClientEntity> {
        const { full_name, identity_number, email, phone, birth_date } = data;
        const result = await pool.query(
            `UPDATE clients 
             SET active = true, full_name = $2, identity_number = $3, email = $4, phone = $5, birth_date = $6
             WHERE id = $1 
             RETURNING *`,
            [id, full_name, identity_number, email, phone, birth_date]
        );
        return result.rows[0];
    }

    /**
     * Busca un cliente por identidad completa (devuelve todos los campos).
     * Se usa desde el controller para la búsqueda por cédula/DNI.
     */
    async findFullByIdentity(spaId: string, identityNumber: string): Promise<ClientEntity | null> {
        const result = await pool.query(
            "SELECT * FROM clients WHERE spa_id = $1 AND identity_number = $2 AND active = true",
            [spaId, identityNumber]
        );
        return result.rows[0] || null;
    }

    /**
     * Lista clientes de un Spa, ordenados alfabéticamente.
     * Si includeArchived es true, devuelve TODOS (activos + archivados).
     */
    async findBySpa(spaId: string, includeArchived = false): Promise<ClientEntity[]> {
        const activeFilter = includeArchived ? "" : "AND active = true";
        const result = await pool.query(
            `SELECT * FROM clients WHERE spa_id = $1 ${activeFilter} ORDER BY active DESC, full_name ASC`,
            [spaId]
        );
        return result.rows;
    }

    /**
     * Busca un cliente por su ID único dentro de un Spa.
     */
    async findById(id: string, spaId: string): Promise<ClientEntity | null> {
        const result = await pool.query(
            "SELECT * FROM clients WHERE id = $1 AND spa_id = $2 AND active = true",
            [id, spaId]
        );
        return result.rows[0] || null;
    }

    /**
     * Actualiza campos dinámicamente con whitelist de seguridad.
     * Recibe los campos ya filtrados y construye el SET clause.
     */
    async update(id: string, spaId: string, fields: string[], values: unknown[]): Promise<ClientEntity | null> {
        const setClause = fields.map((key, index) => `${key} = $${index + 3}`).join(", ");
        const result = await pool.query(
            `UPDATE clients SET ${setClause} WHERE id = $1 AND spa_id = $2 AND active = true RETURNING *`,
            [id, spaId, ...values]
        );
        return result.rows[0] || null;
    }

    /**
     * Desactiva un cliente (archivado).
     */
    async softDelete(id: string, spaId: string): Promise<ClientEntity | null> {
        const result = await pool.query(
            "UPDATE clients SET active = false WHERE id = $1 AND spa_id = $2 RETURNING *",
            [id, spaId]
        );
        return result.rows[0] || null;
    }

    /**
     * Restaura un cliente archivado (pone active = true).
     */
    async restoreById(id: string, spaId: string): Promise<ClientEntity | null> {
        const result = await pool.query(
            "UPDATE clients SET active = true WHERE id = $1 AND spa_id = $2 AND active = false RETURNING *",
            [id, spaId]
        );
        return result.rows[0] || null;
    }
}
