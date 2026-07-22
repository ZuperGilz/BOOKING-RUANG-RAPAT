/**
 * Konfigurasi koneksi database terpusat.
 * 
 * CATATAN MIGRASI VERCEL / NEON:
 * Proyek ini sekarang menggunakan Prisma ORM dengan PostgreSQL (Neon).
 * Konfigurasi koneksi MySQL lama di bawah ini dinonaktifkan (dikomen).
 */

/*
// ==========================================
// [INACTIVE] KONFIGURASI MYSQL LOKAL
// ==========================================
const dbConfig = {
  host:     process.env.DB_HOST     || 'localhost',
  user:     process.env.DB_USER     || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME     || 'booking_rapat',
  port:     parseInt(process.env.DB_PORT || '3306', 10),
  authPlugins: {
    auth_gssapi_client: () => {
      return () => Buffer.from('\0');
    }
  }
};

module.exports = dbConfig;
*/

// ==========================================
// [ACTIVE] PRISMA CLIENT INSTANCE
// ==========================================
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL;

// Buat connection pool untuk Neon
const pool = new Pool({ 
  connectionString,
  ssl: { rejectUnauthorized: false } // Penting untuk Vercel Serverless
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

module.exports = prisma;