import { CreateServiceInput, UpdateServiceInput } from "./service.schema.js";
import { ServiceRepository } from "./service.repository.js";

const repository = new ServiceRepository();

export class ServiceService {
    /**
     * Inserta un nuevo servicio en la base de datos de un Spa.
     */
    async createService(data: CreateServiceInput) {
        const { spa_id, name } = data;

        // Verificar si existe un servicio con el mismo nombre en este Spa
        const existing = await repository.findByName(spa_id, name);
        
        if (existing) {
            if (existing.active) {
                throw new Error(`El servicio "${name}" ya existe y está activo. No se permiten duplicados.`);
            } else {
                // Si existe pero está inactivo (archivado), lo restauramos y actualizamos con los nuevos datos
                return repository.update(existing.id, spa_id, {
                    ...data,
                    active: true
                } as any);
            }
        }

        return repository.create(data);
    }

    /**
     * Obtiene los servicios de un Spa. Incluye archivados si se indica.
     */
    async getBySpa(spa_id: string, includeArchived = false) {
        return repository.findBySpa(spa_id, includeArchived);
    }

    /**
     * Busca un servicio por su ID.
     */
    async getById(id: string, spa_id: string) {
        return repository.findById(id, spa_id);
    }

    /**
     * Actualiza la información de un servicio.
     */
    async updateService(id: string, spa_id: string, data: UpdateServiceInput) {
        const updateData: any = { ...data };

        // Verificar si se intenta cambiar el nombre a uno que ya existe
        if (updateData.name) {
            const existing = await repository.findByName(spa_id, updateData.name, id);
            if (existing && existing.active) {
                throw new Error(`Ya existe un servicio activo llamado "${updateData.name}".`);
            }
        }

        return repository.update(id, spa_id, updateData);
    }

    /**
     * Desactiva un servicio (archivado lógico).
     */
    async softDeleteService(id: string, spa_id: string) {
        return repository.softDelete(id, spa_id);
    }

    /**
     * Restaura un servicio archivado (lo vuelve activo).
     */
    async restoreService(id: string, spa_id: string) {
        return repository.restoreById(id, spa_id);
    }
}
