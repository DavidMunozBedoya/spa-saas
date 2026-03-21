import { PlatformRepository } from "./platform.repository.js";

const platformRepository = new PlatformRepository();

export class PlatformService {
    /**
     * Consulta todos los Spas, opcionalmente incluyendo archivados.
     */
    async getAllSpas(includeArchived: boolean = false) {
        return platformRepository.getAllSpas(includeArchived);
    }

    async updateSpa(id: string, data: { name?: string, email?: string, phone?: string, timezone?: string }) {
        return platformRepository.updateSpa(id, data);
    }

    /**
     * Modifica el estado 'active' de un Spa (activación/suspensión).
     */
    async updateSpaStatus(id: string, active: boolean) {
        return platformRepository.updateSpaStatus(id, active);
    }

    /**
     * Calcula estadísticas agregadas de toda la base de datos para el dashboard global.
     */
    async getGlobalStats() {
        return platformRepository.getGlobalStats();
    }

    /**
     * Registra un nuevo Spa y crea su usuario administrador inicial (Propietario).
     * Todo se ejecuta dentro de una transacción para asegurar la integridad.
     */
    async registerSpaWithAdmin(data: {
        name: string,
        spaEmail: string,
        ownerName: string,
        ownerEmail: string,
        passwordHash: string,
        timezone?: string
    }) {
        return platformRepository.registerSpaWithAdmin(data);
    }

    async deleteSpa(id: string) {
        return platformRepository.deleteSpa(id);
    }

    async restoreSpa(id: string) {
        return platformRepository.restoreSpa(id);
    }

    /**
     * Gestión de Usuarios de Plataforma (SuperAdmins)
     */
    /**
     * Gestión de Administradores de Spas (Propietarios)
     */
    async getAllPlatformUsers() {
        return platformRepository.getAllPlatformUsers();
    }

    async createPlatformUser(data: { email: string, passwordHash: string, spaId: string, fullName: string }) {
        const emailExists = await platformRepository.checkEmailExistsInPlatformOrUsers(data.email);
        if (emailExists) {
            throw new Error('El correo electrónico ya está registrado');
        }

        return platformRepository.createPlatformUser(data);
    }

    async updatePlatformUser(id: string, data: { email?: string, fullName?: string, passwordHash?: string, active?: boolean }) {
        return platformRepository.updatePlatformUser(id, data);
    }

    async deletePlatformUser(id: string) {
        return platformRepository.deletePlatformUser(id);
    }
}
