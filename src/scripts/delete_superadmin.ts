import pool from '../config/db.js';
import readline from 'readline';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const question = (query: string): Promise<string> =>
    new Promise((resolve) => rl.question(query, resolve));

async function deleteSuperAdmin() {
    console.log('--- 🛡️ Eliminación de SuperAdmin (Global) ---');
    console.warn('⚠️ ADVERTENCIA: Esta acción eliminará permanentemente el acceso de plataforma para el correo especificado.');

    try {
        const email = await question('Introduce el email del SuperAdmin a eliminar: ');
        if (!email.includes('@')) {
            console.error('❌ Email inválido.');
            process.exit(1);
        }

        const confirm = await question(`¿Estás seguro de eliminar a ${email}? (s/n): `);
        if (confirm.toLowerCase() !== 's') {
            console.log('🚫 Operación cancelada.');
            return;
        }

        const result = await pool.query(
            'DELETE FROM platform_users WHERE email = $1 RETURNING id',
            [email.toLowerCase()]
        );

        if (result.rowCount && result.rowCount > 0) {
            console.log(`\n✅ ¡SuperAdmin eliminado con éxito!`);
            console.log(`🗑️ Email: ${email}`);
        } else {
            console.log(`\n❓ No se encontró ningún SuperAdmin con el email: ${email}`);
        }

    } catch (error: any) {
        console.error(`\n❌ Error al eliminar el SuperAdmin: ${error.message}`);
    } finally {
        await pool.end();
        rl.close();
    }
}

deleteSuperAdmin();
