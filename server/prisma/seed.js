const { PrismaClient } = require('@prisma/client');
const { PrismaMariaDb } = require('@prisma/adapter-mariadb');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("❌ DATABASE_URL tidak ditemukan di file .env!");
}

// Parse DATABASE_URL, contoh: mysql://user:pass@host:3306/dbname
const dbUrl = new URL(connectionString.replace('mysql://', 'mariadb://'));

// Setup adapter Prisma langsung dari config koneksi
// (TIDAK pakai authPlugins hack — itu bukan solusi, hanya menyembunyikan error asli)
const adapter = new PrismaMariaDb({
  host: dbUrl.hostname,
  port: Number(dbUrl.port) || 3306,
  user: decodeURIComponent(dbUrl.username),
  password: decodeURIComponent(dbUrl.password),
  database: dbUrl.pathname.replace('/', ''),
  connectTimeout: 20000, // 20 detik, kasih waktu lebih untuk remote host
  // Kalau Hostinger mewajibkan SSL untuk remote MySQL, aktifkan baris di bawah:
  // ssl: { rejectUnauthorized: false },
});

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Menjalankan seed data ke Hostinger MySQL via Prisma 7 Adapter...');

  // Seed Admin User
  const adminEmail = 'admin@sig.id';
  const adminPassword = 'admin123';

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(adminPassword, salt);

  await prisma.user.upsert({
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
  console.log(`✅ Seed Admin sukses (${adminEmail} / ${adminPassword})`);

  // Seed Ruangan
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

  // Seed Device Tokens
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
}

main()
  .catch((error) => {
    console.error('❌ Terjadi kesalahan saat seeding:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });