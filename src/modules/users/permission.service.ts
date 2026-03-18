import pool from '../../config/db.js';

export interface Permission {
    id: number;
    code: string;
    description: string;
}

export class PermissionService {
    /**
     * Obtiene todos los permisos de un usuario, combinando los de sus roles
     * y las asignaciones directas (Least Privilege).
     */
    async getUserPermissions(userId: string, spaId: string): Promise<string[]> {
        const query = `
            WITH user_has_admin_role AS (
                SELECT 1 FROM user_roles ur
                JOIN roles r ON ur.role_id = r.id
                WHERE ur.user_id = $1 AND r.name IN ('Propietario', 'Administrador')
            ),
            role_perms AS (
                -- Permisos heredados de los roles del usuario
                SELECT p.code
                FROM user_roles ur
                JOIN role_permissions rp ON ur.role_id = rp.role_id
                JOIN permissions p ON rp.permission_id = p.id
                WHERE ur.user_id = $1
                UNION
                -- Si es Propietario o Administrador, tiene todos los permisos (excepto plataforma)
                SELECT code FROM permissions 
                WHERE code != 'platform:manage' 
                AND EXISTS (SELECT 1 FROM user_has_admin_role)
            ),
            direct_allowed AS (
                -- Permisos concedidos directamente (Overrides)
                SELECT p.code
                FROM user_permissions up
                JOIN permissions p ON up.permission_id = p.id
                WHERE up.user_id = $1 AND up.spa_id = $2 AND up.active = TRUE
            ),
            direct_denied AS (
                -- Permisos denegados directamente (Hard-Deny)
                SELECT p.code
                FROM user_permissions up
                JOIN permissions p ON up.permission_id = p.id
                WHERE up.user_id = $1 AND up.spa_id = $2 AND up.active = FALSE
            )
            SELECT code FROM role_perms
            EXCEPT
            SELECT code FROM direct_denied
            UNION
            SELECT code FROM direct_allowed
        `;

        const result = await pool.query(query, [userId, spaId]);
        return result.rows.map(row => row.code);
    }

    /**
     * Asigna un permiso directo a un usuario en un Spa específico.
     */
    async grantPermission(userId: string, spaId: string, permissionCode: string): Promise<void> {
        const permRes = await pool.query('SELECT id FROM permissions WHERE code = $1', [permissionCode]);
        if (permRes.rows.length === 0) {
            throw new Error(`Permiso no encontrado: ${permissionCode}`);
        }
        const permissionId = permRes.rows[0].id;

        await pool.query(
            `INSERT INTO user_permissions (user_id, permission_id, spa_id, active)
             VALUES ($1, $2, $3, TRUE)
             ON CONFLICT (user_id, permission_id) DO UPDATE SET active = TRUE`,
            [userId, permissionId, spaId]
        );
    }

    /**
     * Revoca un permiso directo de un usuario (Denegación estricta / Hard-Deny).
     */
    async revokePermission(userId: string, spaId: string, permissionCode: string): Promise<void> {
        const permRes = await pool.query('SELECT id FROM permissions WHERE code = $1', [permissionCode]);
        if (permRes.rows.length === 0) return;
        const permissionId = permRes.rows[0].id;

        await pool.query(
            `INSERT INTO user_permissions (user_id, permission_id, spa_id, active)
             VALUES ($1, $2, $3, FALSE)
             ON CONFLICT (user_id, permission_id) DO UPDATE SET active = FALSE`,
            [userId, permissionId, spaId]
        );
    }

    /**
     * Obtiene todos los permisos disponibles en el sistema.
     */
    async getAllPermissions(): Promise<Permission[]> {
        const result = await pool.query('SELECT id, code, description FROM permissions ORDER BY code ASC');
        return result.rows;
    }
}
