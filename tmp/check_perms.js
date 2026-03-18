import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
    connectionString: "postgres://postgres:postgres@localhost:5432/spa_saas"
});

async function checkPermissions() {
    const email = 'terapeuta@gmail.com';
    try {
        const userRes = await pool.query('SELECT id, full_name, spa_id FROM users WHERE email = $1', [email]);
        if (userRes.rows.length === 0) {
            console.log(`User ${email} not found`);
            return;
        }
        const user = userRes.rows[0];
        console.log(`User: ${user.full_name} (ID: ${user.id}, SpaID: ${user.spa_id})`);

        const rolesRes = await pool.query(`
            SELECT r.id, r.name 
            FROM user_roles ur 
            JOIN roles r ON ur.role_id = r.id 
            WHERE ur.user_id = $1
        `, [user.id]);
        console.log('Roles:', rolesRes.rows);

        const permsRes = await pool.query(`
            WITH role_perms AS (
                SELECT p.code
                FROM user_roles ur
                JOIN role_permissions rp ON ur.role_id = rp.role_id
                JOIN permissions p ON rp.permission_id = p.id
                WHERE ur.user_id = $1
            )
            SELECT code FROM role_perms
        `, [user.id]);
        console.log('Permissions:', permsRes.rows.map(r => r.code));

    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

checkPermissions();
