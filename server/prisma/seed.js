const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Setup koneksi PostgreSQL menggunakan Driver Adapter Prisma 7
const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Menjalankan seed data ke PostgreSQL (Neon) via Prisma 7...');

  try {
    // 1. Seed Admin User
    const adminEmail = 'admin@sig.id';
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('admin123', salt);

    const admin = await prisma.user.upsert({
      where: { email: adminEmail },
      update: {},
      create: {
        email: adminEmail,
        namaLengkap: 'Super Admin Semen Padang',
        passwordHash: passwordHash,
        noTelp: '081234567890',
        role: 'ADMIN',
        status: 'ACTIVE',
        mustChangePassword: true,
      },
    });
    console.log('✅ Seed Admin sukses (admin@sig.id / admin123)');

    // 2. Seed Ruangan
    const roomA = await prisma.room.upsert({
      where: { nama: 'Ruang A' },
      update: {},
      create: {
        nama: 'Ruang A',
        kapasitas: 15,
        deskripsi: 'Ruang Rapat Utama',
        status: 'ACTIVE',
      },
    });

    const roomB = await prisma.room.upsert({
      where: { nama: 'Ruang B' },
      update: {},
      create: {
        nama: 'Ruang B',
        kapasitas: 7,
        deskripsi: 'Ruang Rapat Kecil',
        status: 'ACTIVE',
      },
    });
    console.log('✅ Seed Ruangan sukses (Ruang A, Ruang B)');

    // 3. Seed Device Tokens
    await prisma.deviceToken.upsert({
      where: { token: 'RMT-AAAAAA' },
      update: {},
      create: {
        token: 'RMT-AAAAAA',
        roomId: roomA.id,
        label: 'Tablet Ruang A',
        isActive: true,
      },
    });

    await prisma.deviceToken.upsert({
      where: { token: 'RMT-BBBBBB' },
      update: {},
      create: {
        token: 'RMT-BBBBBB',
        roomId: roomB.id,
        label: 'Tablet Ruang B',
        isActive: true,
      },
    });

    console.log('✅ Seed Device Token sukses:');
    console.log('   - Ruang A: RMT-AAAAAA');
    console.log('   - Ruang B: RMT-BBBBBB');

  } catch (error) {
    console.error('❌ Terjadi kesalahan saat seeding:', error);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();

/* 
===================================================================
📜 KODE LAMA SEED MYSQL (LOKAL) - SIMPAN UNTUK ARSIP
===================================================================
const mysql = require('mysql2/promise');
const dbConfig = require('../src/config/db');

async function mainOldMySQL() {
  const connection = await mysql.createConnection(dbConfig);
  // ... (perintah DROP & CREATE TABLE RAW MYSQL)
}
===================================================================
*/