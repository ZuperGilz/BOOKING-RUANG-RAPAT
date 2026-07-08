const mysql = require('mysql2/promise');
const { comparePassword, hashPassword } = require('../utils/password');
const { generateToken } = require('../utils/jwt');
const dbConfig = require('../config/db');

const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email dan password wajib diisi.' });
  }

  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute('SELECT * FROM users WHERE email = ?', [email]);
    await connection.end();

    if (rows.length === 0) {
      return res.status(401).json({ message: 'Email atau password salah.' });
    }

    const user = rows[0];

    if (user.status === 'INACTIVE') {
      return res.status(403).json({ message: 'Akun Anda telah dinonaktifkan oleh admin.' });
    }

    const isMatch = await comparePassword(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Email atau password salah.' });
    }

    const token = generateToken(user);

    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        namaLengkap: user.nama_lengkap,
        noTelp: user.no_telp, // <-- Membawa No. HP ke frontend
        role: user.role,
        mustChangePassword: user.must_change_password
      }
    });
  } catch (error) {
    return res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
  }
};

const changePassword = async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const userId = req.user.id;

  if (!oldPassword || !newPassword) {
    return res.status(400).json({ message: 'Password lama dan baru wajib diisi.' });
  }

  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute('SELECT password_hash FROM users WHERE id = ?', [userId]);

    const isMatch = await comparePassword(oldPassword, rows[0].password_hash);
    if (!isMatch) {
      await connection.end();
      return res.status(400).json({ message: 'Password lama yang Anda masukkan salah.' });
    }

    const newHash = await hashPassword(newPassword);
    await connection.execute(
      'UPDATE users SET password_hash = ?, must_change_password = 0 WHERE id = ?',
      [newHash, userId]
    );
    await connection.end();

    return res.json({ message: 'Password berhasil diperbarui.' });
  } catch (error) {
    return res.status(500).json({ message: 'Gagal memperbarui password.' });
  }
};

const getMe = async (req, res) => {
  return res.json({ user: req.user });
};

module.exports = { login, changePassword, getMe };