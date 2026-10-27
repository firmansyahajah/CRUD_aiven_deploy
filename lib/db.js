import mysql from 'mysql2/promise';
import fs from 'node:fs';
import path from 'node:path';

function createPool() {
  return mysql.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: { ca: fs.readFileSync(path.join(process.cwd(), 'ca.pem'), 'utf8') },
    waitForConnections: true,
    connectionLimit: 5,
    queueLimit: 0,
    charset: 'utf8mb4',
    timezone: 'Z',
  });
}

// Singleton global agar hot reload di dev tidak membuka pool baru terus.
const pool = globalThis.__kasirPool ?? (globalThis.__kasirPool = createPool());

export { pool };
export default pool;
