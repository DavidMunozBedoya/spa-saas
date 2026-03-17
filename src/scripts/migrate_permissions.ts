import pool from '../config/db.js';

async function migrate() {
    console.log('--- Iniciando Migración de Permisos ---');
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        console.log('1. Creando tablas de permisos...');

        await client.query(`
            CREATE TABLE IF NOT EXISTS permissions (
                id SERIAL PRIMARY KEY,
                code VARCHAR(50) UNIQUE NOT NULL,
                description TEXT,
                created_at TIMESTAMPTZ DEFAULT NOW()
            );
        `);

        await client.query(`
            CREATE TABLE IF NOT EXISTS role_permissions (
                role_id INTEGER REFERENCES roles(id) ON DELETE CASCADE,
                permission_id INTEGER REFERENCES permissions(id) ON DELETE CASCADE,
                PRIMARY KEY (role_id, permission_id)
            );
        `);

        await client.query(`
            CREATE TABLE IF NOT EXISTS user_permissions (
                user_id UUID REFERENCES users(id) ON DELETE CASCADE,
                permission_id INTEGER REFERENCES permissions(id) ON DELETE CASCADE,
                spa_id UUID REFERENCES spas(id) ON DELETE CASCADE,
                active BOOLEAN DEFAULT TRUE,
                granted_at TIMESTAMPTZ DEFAULT NOW(),
                PRIMARY KEY (user_id, permission_id)
            );
        `);

        console.log('2. Insertando permisos base...');
        const permissions = [
            ['appointments:view', 'Ver citas'],
            ['appointments:create', 'Crear citas'],
            ['appointments:edit', 'Editar citas'],
            ['appointments:cancel', 'Cancelar citas'],
            ['clients:view', 'Ver clientes'],
            ['clients:create', 'Crear clientes'],
            ['clients:edit', 'Editar clientes'],
            ['services:view', 'Ver servicios'],
            ['services:manage', 'Gestionar servicios (Admin)'],
            ['reports:view', 'Ver reportes'],
            ['spa:config', 'Configurar Spa (Logo, Horarios, etc.)'],
            ['users:manage', 'Gestionar usuarios y permisos']
        ];

        for (const [code, desc] of permissions) {
            await client.query(
                'INSERT INTO permissions (code, description) VALUES ($1, $2) ON CONFLICT (code) DO NOTHING',
                [code, desc]
            );
        }

        console.log('3. Mapeando permisos por defecto a roles...');

        const roleMappings = {
            'Propietario': [
                'appointments:view', 'appointments:create', 'appointments:edit', 'appointments:cancel',
                'clients:view', 'clients:create', 'clients:edit',
                'services:view', 'services:manage',
                'reports:view', 'spa:config', 'users:manage'
            ],
            'Administrador': [
                'appointments:view', 'appointments:create', 'appointments:edit', 'appointments:cancel',
                'clients:view', 'clients:create', 'clients:edit',
                'services:view', 'services:manage',
                'reports:view', 'spa:config', 'users:manage'
            ],
            'Terapeuta': [
                'appointments:view',
                'services:view'
            ],
            'Recepcionista': [
                'appointments:view', 'appointments:create', 'appointments:edit', 'appointments:cancel',
                'clients:view', 'clients:create'
            ]
        };

        for (const [roleName, permissionCodes] of Object.entries(roleMappings)) {
            const roleRes = await client.query('SELECT id FROM roles WHERE name = $1', [roleName]);
            if (roleRes.rows.length > 0) {
                const roleId = roleRes.rows[0].id;
                for (const code of permissionCodes) {
                    const permRes = await client.query('SELECT id FROM permissions WHERE code = $1', [code]);
                    if (permRes.rows.length > 0) {
                        const permId = permRes.rows[0].id;
                        await client.query(
                            'INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
                            [roleId, permId]
                        );
                    }
                }
            }
        }

        await client.query('COMMIT');
        console.log('✔ Migración de permisos completada con éxito.');
    } catch (e: any) {
        await client.query('ROLLBACK');
        console.error('❌ Error durante la migración:', e.message);
    } finally {
        client.release();
        await pool.end();
    }
}

migrate();
