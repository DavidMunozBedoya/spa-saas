import { CreateStaffInput, UpdateStaffInput } from "./staff.schema.js";
import { StaffRepository } from "./staff.repository.js";

const repository = new StaffRepository();

export class StaffService {
    /**
     * Inserta un nuevo miembro del personal validando que el Spa exista.
     * Si existe inactivo, lo restaura si la UI está preparada para eso.
     */
    async createStaff(data: CreateStaffInput) {
        const { spa_id, identification_number, email } = data;

        // Verificar que el Spa existe
        const spaExists = await repository.checkSpaExists(spa_id);
        if (!spaExists) {
            throw new Error("El Spa especificado no existe");
        }

        // Check for duplicate identification_number
        const duplicateCheck = await repository.findByIdentification(spa_id, identification_number);
        if (duplicateCheck) {
            if (duplicateCheck.active === false) {
                // Si existe pero está inactivo, lo restauramos y actualizamos
                return repository.update(duplicateCheck.id, spa_id, { ...data, active: true });
            }
            throw new Error("Este número de identificación ya está registrado para otro empleado en este Spa.");
        }

        // Check for duplicate email if provided
        if (email) {
            const emailCheck = await repository.findByEmail(email);
            if (emailCheck) {
                if (emailCheck.active === false) {
                    throw new Error("INACTIVE_DUPLICATE_EMAIL");
                }
                throw new Error("Este correo electrónico ya está en uso por otro usuario del sistema.");
            }
        }

        return repository.create(data);
    }

    /**
     * Obtiene el personal perteneciente a un Spa, opcionalmente incluyendo archivados.
     */
    async getBySpa(spa_id: string, includeArchived: boolean = false, staff_id?: string) {
        return repository.findBySpa(spa_id, includeArchived, staff_id);
    }

    /**
     * Busca un miembro del personal por su ID.
     */
    async getById(id: string, spa_id: string) {
        return repository.findById(id, spa_id);
    }

    // Listar solo los terapeutas activos
    async getTherapists(spa_id: string) {
        return repository.findTherapists(spa_id);
    }

    /**
     * Desactiva un miembro del personal (archivado lógico).
     */
    async softDeleteStaff(id: string, spa_id: string) {
        return repository.softDelete(id, spa_id);
    }

    /**
     * Actualiza campos del personal de forma dinámica.
     */
    async updateStaff(id: string, spa_id: string, data: UpdateStaffInput) {
        if (data.identification_number) {
            const duplicateCheck = await repository.findByIdentification(spa_id, data.identification_number, id);
            if (duplicateCheck && duplicateCheck.active) {
                throw new Error("Este número de identificación ya está registrado para otro empleado en este Spa.");
            }
        }

        if (data.email) {
            const emailCheck = await repository.findByEmail(data.email, id);
            if (emailCheck && emailCheck.active) {
                throw new Error("Este correo electrónico ya está en uso por otro usuario del sistema.");
            }
        }

        return repository.update(id, spa_id, data);
    }

    /**
     * Restaura un miembro del personal archivado.
     */
    async restoreStaff(id: string, spa_id: string) {
        return repository.restoreById(id, spa_id);
    }
}
