import { CreateSpaInput, UpdateSpaInput } from "./spa.schema.js";
import { SpaRepository } from "./spa.repository.js";

const repository = new SpaRepository();

export class SpaService {
    /**
     * Crea un nuevo registro de Spa en la base de datos.
     */
    async createSpa(data: CreateSpaInput) {
        return repository.create(data);
    }

    /**
     * Obtiene todos los Spas. Puede incluir inactivos (archivados).
     */
    async getAllSpas(includeArchived: boolean = false) {
        return repository.findAll(includeArchived);
    }

    /**
     * Actualiza campos específicos de un Spa de forma dinámica.
     */
    async updateSpa(id: string, data: UpdateSpaInput) {
        return repository.update(id, data);
    }

    /**
     * Busca un Spa específico por su ID único.
     */
    async getSpaById(id: string) {
        return repository.findById(id);
    }

    /**
     * Desactiva un Spa (borrado lógico / archivarlo).
     */
    async softDeleteSpa(id: string) {
        return repository.softDelete(id);
    }

    /**
     * Restaura un Spa desactivado (archivado).
     */
    async restoreSpa(id: string) {
        return repository.restoreById(id);
    }
}
