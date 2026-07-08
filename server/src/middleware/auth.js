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