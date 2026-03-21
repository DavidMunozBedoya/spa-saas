import pool from "../../config/db.js";
import { hashPassword } from "../../utils/security.js";
import { CreateUserInput, UpdateUserInput } from "./user.schema.js";
import { UserRepository } from "./user.repository.js";

const userRepository = new UserRepository();

export class UserService {

    /**
     * Crea un usuario, hashea la contraseña y lo vincula a un Spa con múltiples roles.
     */
    async createUser(data: CreateUserInput) {
        const { spa_id, role_ids, full_name, email, password, staff_id } = data;

        // Verificar que el Spa existe
        const spaExists = await pool.query("SELECT id FROM spas WHERE id = $1 AND active = true", [spa_id]);
        if (spaExists.rows.length === 0) {
            throw new Error("El Spa especificado no existe o está inactivo");
        }

        // Verificar unicidad de correo global
        const emailExists = await userRepository.checkEmailExists(email);
        if (emailExists) {
            throw new Error("Este correo electrónico ya está registrado en la plataforma (Global)");
        }

        // Encriptar contraseña
        const password_hash = await hashPassword(password);

        return userRepository.create({
            spa_id,
            staff_id,
            full_name,
            email,
            password_hash,
            role_ids: role_ids || []
        });
    }

    /**
     * Obtiene los usuarios de un Spa con sus roles, opcionalmente incluyendo archivados.
     */
    async getBySpa(spa_id: string, includeArchived: boolean = false) {
        return userRepository.findBySpa(spa_id, includeArchived);
    }

    /**
     * Busca un usuario por su ID incluyendo sus roles, filtrado por Spa.
     */
    async getById(id: string, spa_id: string) {
        return userRepository.findById(id, spa_id);
    }

    /**
     * Actualiza los datos del usuario y sus roles de forma atómica.
     */
    async updateUser(id: string, spa_id: string, data: UpdateUserInput) {
        const updateData: any = { ...data };

        if (updateData.password) {
            updateData.password_hash = await hashPassword(updateData.password);
            delete updateData.password;
        }

        if (updateData.email) {
            const emailExists = await userRepository.checkEmailExists(updateData.email, id);
            if (emailExists) {
                throw new Error("Este correo electrónico ya está registrado en la plataforma (Global)");
            }
        }

        return userRepository.update(id, spa_id, updateData);
    }

    /**
     * Desactiva un usuario (borrado lógico), filtrado por Spa.
     */
    async softDeleteUser(id: string, spa_id: string) {
        return userRepository.softDelete(id, spa_id);
    }

    /**
     * Restaura un usuario archivado (activa de nuevo), filtrado por Spa.
     */
    async restoreUser(id: string, spa_id: string) {
        return userRepository.restore(id, spa_id);
    }
}
