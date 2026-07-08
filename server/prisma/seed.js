const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const dbConfig = require('../src/config/db');

async function main() {
  console.log('🌱 Melakukan sinkronisasi kolom dan menjalankan seed data...');
  const connection = await mysql.createConnection(dbConfig);

  try {
    // 1. Amankan struktur tabel users agar kolomnya seragam menggunakan snake_case
    await connection.execute(`DROP TABLE IF EXISTS device_tokens;`);
    await connection.execute(`DROP TABLE IF EXISTS bookings;`);
    await connection.execute(`DROP TABLE IF EXISTS users;`);
    await connection.execute(`DROP TABLE IF EXISTS rooms;`);

    console.log('🧹 Tabel lama dibersihkan, membuat ulang struktur yang solid...');

    await connection.execute(`
      CREATE TABLE users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(100) UNIQUE NOT NULL,
        nama_lengkap VARCHAR(100) NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        no_telp VARCHAR(15), 
        role ENUM('ADMIN', 'USER') DEFAULT 'USER',
        status ENUM('ACTIVE', 'INACTIVE') DEFAULT 'ACTIVE',
        must_change_password BOOLEAN DEFAULT TRUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
    `);

    await connection.execute(`
      CREATE TABLE rooms (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nama VARCHAR(50) UNIQUE NOT NULL,
        kapasitas INT NOT NULL,
        deskripsi TEXT,
        status ENUM('ACTIVE', 'MAINTENANCE') DEFAULT 'ACTIVE',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
    `);

    await connection.execute(`
      CREATE TABLE bookings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        room_id INT NOT NULL,
        tanggal DATE NOT NULL,
        jam_mulai VARCHAR(5) NOT NULL,
        jam_selesai VARCHAR(5) NOT NULL,
        agenda VARCHAR(255) NOT NULL,
        pemateri VARCHAR(100),
        jumlah_peserta INT NOT NULL,
        catatan TEXT,
        status ENUM('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED') DEFAULT 'PENDING',
        alasan_reject TEXT,
        approved_by INT,
        approved_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (room_id) REFERENCES rooms(id)
      );
    `);

    await connection.execute(`
      CREATE TABLE device_tokens (
        id INT AUTO_INCREMENT PRIMARY KEY,
        token VARCHAR(20) UNIQUE NOT NULL,
        room_id INT NOT NULL,
        label VARCHAR(100),
        is_active BOOLEAN DEFAULT TRUE,
        last_seen_at DATETIME,
        activated_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (room_id) REFERENCES rooms(id)
      );
    `);

    // 2. Masukkan Data Seed Admin
    const adminEmail = 'admin@sig.id';
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('admin123', salt);

    await connection.execute(
      `INSERT INTO users (email, nama_lengkap, password_hash, no_telp, role, status, must_change_password) 
       VALUES (?, ?, ?, ?, 'ADMIN', 'ACTIVE', 1)`,
      [adminEmail, 'Super Admin Semen Padang', passwordHash, '081234567890']
    );
    console.log('✅ Seed Admin sukses (admin@sig.id / admin123)');

    // 3. Masukkan Data Seed Ruangan & Device Token
    await connection.execute(`INSERT INTO rooms (nama, kapasitas, deskripsi) VALUES ('Ruang A', 15, 'Ruang Rapat Utama')`);
    await connection.execute(`INSERT INTO rooms (nama, kapasitas, deskripsi) VALUES ('Ruang B', 7, 'Ruang Rapat Kecil')`);
    console.log('✅ Seed Ruangan sukses (Ruang A, Ruang B)');

    await connection.execute(`INSERT INTO device_tokens (token, room_id, label) VALUES ('RMT-AAAAAA', 1, 'Tablet Ruang A')`);
    await connection.execute(`INSERT INTO device_tokens (token, room_id, label) VALUES ('RMT-BBBBBB', 2, 'Tablet Ruang B')`);
    console.log('✅ Seed Device Token sukses:');
    console.log('   - Ruang A: RMT-AAAAAA');
    console.log('   - Ruang B: RMT-BBBBBB');

  } catch (error) {
    console.error('❌ Terjadi kesalahan saat seeding:', error);
  } finally {
    await connection.end();
  }
}

main();