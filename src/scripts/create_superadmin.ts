import pool from '../config/db.js';
import { hashPassword } from '../utils/security.js';
import readline from 'readline';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const question = (query: string): Promise<string> =>
    new Promise((resolve) => rl.question(query, resolve));

async function createSuperAdmin() {
    console.log('--- 🛡️ Creación de SuperAdmin (Global) ---');

    try {
        const email = await question('Introduce el email del nuevo SuperAdmin: ');
        if (!email.includes('@')) {
            console.error('❌ Email inválido.');
            process.exit(1);
        }

        const password = await question('Introduce la contraseña: ');
        if (password.length < 6) {
            console.error('❌ La contraseña debe tener al menos 6 caracteres.');
            process.exit(1);
        }

        const hashedPassword = await hashPassword(password);

        const result = await pool.query(
            `INSERT INTO platform_users (email, password_hash, role) 
       VALUES ($1, $2, 'SUPER_ADMIN') 
       ON CONFLICT (email) DO UPDATE SET password_hash = $2
       RETURNING id`,
            [email.toLowerCase(), hashedPassword]
        );

        console.log(`\n✅ ¡SuperAdmin creado/actualizado con éxito!`);
        console.log(`📧 Email: ${email}`);
        console.log(`🔑 ID: ${result.rows[0].id}`);

    } catch (error: any) {
        console.error(`\n❌ Error al crear el SuperAdmin: ${error.message}`);
    } finally {
        await pool.end();
        rl.close();
    }
}

createSuperAdmin();
