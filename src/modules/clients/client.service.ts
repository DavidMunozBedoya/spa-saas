import { ClientRepository } from "./client.repository.js";
import { CreateClientInput, UpdateClientInput } from "./client.schema.js";

const repository = new ClientRepository();

export class ClientService {
    /**
     * Crea un cliente o reactiva uno previamente eliminado.
     * 
     * FLUJO DE DECISIÓN:
     *   1. Si ya existe un cliente ACTIVO con esa cédula → Error (duplicado real)
     *   2. Si existe un cliente INACTIVO con esa cédula → Reactivar y actualizar datos
     *   3. Si no existe ninguno → Crear nuevo registro
     * 
     * ¿Por qué? La tabla tiene un constraint UNIQUE(spa_id, identity_number),
     * que NO distingue entre activos e inactivos. Si intentamos INSERT con una
     * cédula que ya existe (aunque inactiva), PostgreSQL lo rechaza.
     */
    async createClient(data: CreateClientInput) {
        const { spa_id, identity_number } = data;

        if (identity_number) {
            // Paso 1: ¿Ya existe un cliente ACTIVO con esta cédula?
            const activeClient = await repository.findByIdentityNumber(spa_id, identity_number);
            if (activeClient) {
                throw new Error("Esta identificación ya está registrada para otro cliente");
            }

            // Paso 2: ¿Existe un cliente INACTIVO (eliminado) con esta cédula?
            const inactiveClient = await repository.findInactiveByIdentity(spa_id, identity_number);
            if (inactiveClient) {
                // En vez de crear uno nuevo, reactivamos el existente con los datos nuevos
                return repository.reactivate(inactiveClient.id, data);
            }
        }

        // Paso 3: No existe ninguno → Crear nuevo
        return repository.create(data);
    }

    /**
     * Busca un cliente por su número de identidad (cédula/DNI).
     * Es un proxy directo al repositorio porque no hay lógica adicional.
     */
    async findByIdentity(spaId: string, identityNumber: string) {
        return repository.findFullByIdentity(spaId, identityNumber);
    }

    /**
     * Lista clientes de un Spa. Incluye archivados si se indica.
     */
    async getBySpa(spaId: string, includeArchived = false) {
        return repository.findBySpa(spaId, includeArchived);
    }

    /**
     * Obtiene un cliente por ID.
     */
    async getById(id: string, spaId: string) {
        return repository.findById(id, spaId);
    }

    /**
     * Actualiza la información de un cliente.
     * 
     * LÓGICA DE NEGOCIO que se queda aquí:
     *   - Whitelist de campos permitidos (seguridad)
     *   - Si no hay campos válidos, retorna el cliente sin modificar
     * 
     * SQL que se delegó al repositorio:
     *   - update() → construcción dinámica del UPDATE
     */
    async updateClient(id: string, spaId: string, data: UpdateClientInput) {
        const updateData: Record<string, unknown> = { ...data };

        const allowedFields = ['full_name', 'identity_number', 'email', 'phone', 'birth_date', 'active'];
        const fields = Object.keys(updateData).filter(key =>
            allowedFields.includes(key) && updateData[key] !== undefined
        );

        if (fields.length === 0) return this.getById(id, spaId);

        const values = fields.map(key => updateData[key]);
        return repository.update(id, spaId, fields, values);
    }

    /**
     * Desactiva la ficha del cliente (archivado).
     */
    async softDeleteClient(id: string, spaId: string) {
        return repository.softDelete(id, spaId);
    }

    /**
     * Restaura un cliente archivado (lo vuelve activo).
     */
    async restoreClient(id: string, spaId: string) {
        return repository.restoreById(id, spaId);
    }
}
