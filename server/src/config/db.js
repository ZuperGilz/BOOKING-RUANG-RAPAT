const { PrismaClient } = require('@prisma/client');
const { PrismaMariaDb } = require('@prisma/adapter-mariadb');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("❌ DATABASE_URL tidak ditemukan di file .env!");
}

// Parse DATABASE_URL, contoh: mysql://user:pass@host:3306/dbname
const dbUrl = new URL(connectionString.replace('mysql://', 'mariadb://'));

// PENTING: decodeURIComponent wajib dipakai kalau username/password
// mengandung karakter spesial yang di-encode di connection string
// (misal %40 untuk '@'). Tanpa ini, password yang dikirim ke MySQL
// bisa salah dan autentikasi gagal terus-menerus.
const adapter = new PrismaMariaDb({
  host: dbUrl.hostname,
  port: Number(dbUrl.port) || 3306,
  user: decodeURIComponent(dbUrl.username),
  password: decodeURIComponent(dbUrl.password),
  database: dbUrl.pathname.replace('/', ''),
  connectTimeout: 20000,
  connectionLimit: 3, // shared hosting sensitif kalau buka koneksi terlalu banyak sekaligus
  acquireTimeout: 15000,
  // Kalau Hostinger mewajibkan SSL untuk remote MySQL, aktifkan baris di bawah:
  // ssl: { rejectUnauthorized: false },
});

const prisma = new PrismaClient({ adapter });

module.exports = prisma;