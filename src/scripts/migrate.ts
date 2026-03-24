import fs from 'fs';
import path from 'path';
import pool from '../config/db.js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
    console.log('--- 🚀 Iniciando Migración de Base de Datos ---');
    
    try {
        // En producción el script estará en dist/scripts/migrate.js
        // init.sql está en la raíz del proyecto
        const sqlPath = path.join(__dirname, '../../init.sql');
        
        if (!fs.existsSync(sqlPath)) {
            throw new Error(`No se encontró el archivo init.sql en ${sqlPath}`);
        }

        const sql = fs.readFileSync(sqlPath, 'utf8');
        
        console.log('⏳ Ejecutando init.sql...');
        await pool.query(sql);
        console.log('✅ Base de datos inicializada correctamente.');

    } catch (error: any) {
        console.error('❌ Error durante la migración:', error.message);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

runMigration();
