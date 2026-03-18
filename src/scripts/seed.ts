import pool from '../config/db.js';
import { hashPassword } from '../utils/security.js';

async function seed() {
    console.log('--- Iniciando Seeding ---');

    try {
        // 1. Crear Super Admin
        const adminEmail = 'admin@spa-saas.com';
        const hashedPassword = await hashPassword('admin123');

        await pool.query(
            `INSERT INTO platform_users (email, password_hash, role) 
       VALUES ($1, $2, 'SUPER_ADMIN') 
       ON CONFLICT (email) DO NOTHING`,
            [adminEmail, hashedPassword]
        );
        console.log('✔ Super Admin creado (o ya existía)');

        // 2. Crear un Spa de prueba
        const spaRes = await pool.query(
            `INSERT INTO spas (name, email, timezone) 
       VALUES ('Spa Relajación Total', 'contacto@sparelax.com', 'America/Bogota') 
       RETURNING id`
        );
        const spaId = spaRes.rows[0]?.id;

        if (spaId) {
            console.log(`✔ Spa creado con ID: ${spaId}`);

            // 3. Crear un Staff/Propietario para ese Spa
            const staffRes = await pool.query(
                `INSERT INTO staff (spa_id, full_name, email) 
         VALUES ($1, 'Ana Garcia', 'ana@sparelax.com') 
         RETURNING id`,
                [spaId]
            );
            const staffId = staffRes.rows[0].id;
            console.log('✔ Staff (Propietario) creado');

            // 4. Crear el Usuario de login para ese Staff
            // Buscamos el ID del rol Propietario
            const roleRes = await pool.query("SELECT id FROM roles WHERE name = 'Propietario'");
            const roleId = roleRes.rows[0].id;

            const userRes = await pool.query(
                `INSERT INTO users (spa_id, email, password_hash, staff_id) 
                 VALUES ($1, $2, $3, $4) RETURNING id`,
                [spaId, 'ana@sparelax.com', hashedPassword, staffId]
            );
            const userId = userRes.rows[0].id;

            await pool.query(
                "INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)",
                [userId, roleId]
            );
            console.log('✔ Usuario de login creado para el Spa');

            // 5. Crear algunos servicios
            await pool.query(
                `INSERT INTO services (spa_id, name, description, duration_minutes, price) 
         VALUES 
         ($1, 'Masaje Sueco', 'Masaje relajante de cuerpo completo', 60, 50.00),
         ($1, 'Limpieza Facial', 'Tratamiento profundo de cutis', 45, 35.00)`,
                [spaId]
            );
            console.log('✔ Servicios iniciales creados');
        }

        console.log('--- Seeding Completado con Éxito ---');
    } catch (error) {
        console.error('❌ Error durante el seeding:', error);
    } finally {
        await pool.end();
    }
}

seed();
