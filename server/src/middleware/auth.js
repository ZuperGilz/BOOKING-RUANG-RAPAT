// =========================================================
// [ACTIVE] VERSI CLOUD (PRISMA + NEON POSTGRESQL)
// =========================================================
const jwt = require('jsonwebtoken');
const prisma = require('../config/db');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_key_semen_padang_2026');

      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: {
          id: true,
          email: true,
          namaLengkap: true,
          role: true,
          status: true,
          mustChangePassword: true
        }
      });

      if (!user || user.status === 'INACTIVE') {
        return res.status(401).json({ message: 'Akun tidak aktif atau tidak ditemukan.' });
      }

      // Map to old structure if downstream code expects it, 
      // but Prisma names (namaLengkap) are already mapped by Prisma Client.
      req.user = user; 
      next();
    } catch (error) {
      console.error("Auth Middleware Error:", error);
      return res.status(401).json({ message: 'Sesi habis atau token tidak valid.' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Akses ditolak, token tidak ditemukan.' });
  }
};

module.exports = { protect };


/* =========================================================
   [INACTIVE] VERSI LOKAL (RAW MYSQL)
   Untuk kembali ke mode lokal, hapus blok komentar ini (/* ... * /)
   lalu berikan komentar pada seluruh blok VERSI CLOUD di atas.
   =========================================================
const jwt = require('jsonwebtoken');
const mysql = require('mysql2/promise');
const dbConfig = require('../config/db');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      
      // PASTIKAN menggunakan string rahasia yang sama persis dengan yang di utils/jwt.js
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_key_semen_padang_2026');

      // Ambil data user dari database
      const connection = await mysql.createConnection(dbConfig);
      const [rows] = await connection.execute(
        'SELECT id, email, nama_lengkap, role, status, must_change_password FROM users WHERE id = ?', 
        [decoded.id]
      );
      await connection.end();
      if (rows.length === 0 || rows[0].status === 'INACTIVE') {
        return res.status(401).json({ message: 'Akun tidak aktif atau tidak ditemukan.' });
      }

      req.user = rows[0]; // Simpan info user di objek request
      next();
    } catch (error) {
      return res.status(401).json({ message: 'Sesi habis atau token tidak valid.' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Akses ditolak, token tidak ditemukan.' });
  }
};

module.exports = { protect };
========================================================= */