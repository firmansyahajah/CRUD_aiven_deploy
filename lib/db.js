import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: process.env.DB_CA_CERT ? {
    // Membaca sertifikat dari environment variable Vercel
    ca: Buffer.from(process.env.DB_CA_CERT, 'base64').toString('utf-8'),
    rejectUnauthorized: false
  } : undefined,
  waitForConnections: true,
  connectionLimit: 10,
  queueLength: 0
});

export default pool;
