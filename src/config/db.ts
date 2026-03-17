import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// En Docker, usamos las variables de entorno definidas en docker-compose.yml
const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'spa_user',
    password: process.env.DB_PASSWORD || 'spa_password',
    database: process.env.DB_NAME || 'spa_dev',
});

export const query = (text: string, params?: any[]) => {
    return pool.query(text, params);
};

export default pool;
