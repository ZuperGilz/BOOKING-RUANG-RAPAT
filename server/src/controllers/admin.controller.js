const mysql = require('mysql2/promise');
const { hashPassword } = require('../utils/password');
const dbConfig = require('../config/db');

// ==========================================
// 1. LOGIKA APPROVAL & REJECT BOOKING
// ==========================================

const getPendingBookings = async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute(
      `SELECT b.*, u.nama_lengkap, u.no_telp, r.nama as nama_ruangan 
       FROM bookings b
       JOIN users u ON b.user_id = u.id
       JOIN rooms r ON b.room_id = r.id
       WHERE b.status = 'PENDING'
       ORDER BY b.tanggal ASC, b.jam_mulai ASC`
    );
    await connection.end();
    return res.json(rows);
  } catch (error) {
    return res.status(500).json({ message: 'Gagal mengambil data antrean booking.' });
  }
};

const getAllBookings = async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute(
      `SELECT b.*, u.nama_lengkap, u.no_telp, r.nama as nama_ruangan 
       FROM bookings b
       JOIN users u ON b.user_id = u.id
       JOIN rooms r ON b.room_id = r.id
       ORDER BY CASE WHEN b.status = 'PENDING' THEN 1 ELSE 2 END ASC, b.tanggal DESC, b.jam_mulai DESC`
    );
    await connection.end();
    return res.json(rows);
  } catch (error) {
    return res.status(500).json({ message: 'Gagal mengambil semua data booking.' });
  }
};

const approveBooking = async (req, res) => {
  const { id } = req.params;
  const adminId = req.user.id;

  try {
    const connection = await mysql.createConnection(dbConfig);
    await connection.execute(
      `UPDATE bookings SET status = 'APPROVED', approved_by = ?, approved_at = NOW() WHERE id = ?`,
      [adminId, id]
    );
    await connection.end();
    return res.json({ message: 'Booking berhasil disetujui! ✅' });
  } catch (error) {
    return res.status(500).json({ message: 'Gagal menyetujui booking.' });
  }
};

const rejectBooking = async (req, res) => {
  const { id } = req.params;
  const { alasanReject } = req.body;
  const adminId = req.user.id;

  if (!alasanReject) {
    return res.status(400).json({ message: 'Alasan penolakan wajib ditulis.' });
  }

  try {
    const connection = await mysql.createConnection(dbConfig);
    await connection.execute(
      `UPDATE bookings SET status = 'REJECTED', alasan_reject = ?, approved_by = ?, approved_at = NOW() WHERE id = ?`,
      [alasanReject, adminId, id]
    );
    await connection.end();
    return res.json({ message: 'Booking berhasil ditolak. ❌' });
  } catch (error) {
    return res.status(500).json({ message: 'Gagal menolak booking.' });
  }
};

// ==========================================
// 2. LOGIKA MANAJEMEN AKUN USER (KARYAWAN)
// ==========================================

const getAllUsers = async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute(
      'SELECT id, email, nama_lengkap, no_telp, role, status, must_change_password FROM users ORDER BY role ASC, nama_lengkap ASC'
    );
    await connection.end();
    return res.json(rows);
  } catch (error) {
    return res.status(500).json({ message: 'Gagal mengambil data user.' });
  }
};

const createUser = async (req, res) => {
  const { email, namaLengkap, noTelp } = req.body;

  if (!email || !namaLengkap || !noTelp) {
    return res.status(400).json({ message: 'Semua form input wajib diisi.' });
  }

  try {
    const connection = await mysql.createConnection(dbConfig);
    
    const [existing] = await connection.execute('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      await connection.end();
      return res.status(400).json({ message: 'Email tersebut sudah terdaftar di sistem.' });
    }

    const defaultHash = await hashPassword('Padang@2026');

    await connection.execute(
      `INSERT INTO users (email, nama_lengkap, password_hash, no_telp, role, status, must_change_password) 
       VALUES (?, ?, ?, ?, 'USER', 'ACTIVE', 1)`,
      [email, namaLengkap, defaultHash, noTelp]
    );

    await connection.end();
    return res.status(201).json({ message: 'Akun karyawan baru berhasil dibuat! Password default: Padang@2026' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Gagal membuat akun karyawan baru.' });
  }
};

const toggleUserStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body; 

  try {
    const connection = await mysql.createConnection(dbConfig);
    await connection.execute('UPDATE users SET status = ? WHERE id = ?', [status, id]);
    await connection.end();
    return res.json({ message: `Status akun berhasil diubah menjadi ${status}.` });
  } catch (error) {
    return res.status(500).json({ message: 'Gagal mengubah status akun.' });
  }
};

const resetUserPassword = async (req, res) => {
  const { id } = req.params;

  try {
    const connection = await mysql.createConnection(dbConfig);
    const defaultHash = await hashPassword('Padang@2026');
    
    await connection.execute(
      'UPDATE users SET password_hash = ?, must_change_password = 1 WHERE id = ?', 
      [defaultHash, id]
    );
    await connection.end();
    return res.json({ message: 'Password akun berhasil di-reset kembali ke: Padang@2026' });
  } catch (error) {
    return res.status(500).json({ message: 'Gagal me-reset password.' });
  }
};

// Update Data Nama & No HP Karyawan
const updateUser = async (req, res) => {
  const { id } = req.params;
  const { namaLengkap, noTelp } = req.body;

  if (!namaLengkap || !noTelp) {
    return res.status(400).json({ message: 'Nama dan nomor telepon wajib diisi.' });
  }

  try {
    const connection = await mysql.createConnection(dbConfig);
    await connection.execute(
      'UPDATE users SET nama_lengkap = ?, no_telp = ? WHERE id = ?',
      [namaLengkap, noTelp, id]
    );
    await connection.end();
    return res.json({ message: 'Data karyawan berhasil diperbarui! 📝' });
  } catch (error) {
    return res.status(500).json({ message: 'Gagal memperbarui data karyawan.' });
  }
};

// ==========================================
// 3. LOGIKA MANAJEMEN RUANGAN (ROOMS)
// ==========================================

const getAllRooms = async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute('SELECT * FROM rooms ORDER BY nama ASC');
    await connection.end();
    return res.json(rows);
  } catch (error) {
    return res.status(500).json({ message: 'Gagal mengambil data ruangan.' });
  }
};

const toggleRoomStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body; 

  try {
    const connection = await mysql.createConnection(dbConfig);
    await connection.execute('UPDATE rooms SET status = ? WHERE id = ?', [status, id]);
    await connection.end();
    return res.json({ message: `Status ruangan berhasil diubah menjadi ${status}.` });
  } catch (error) {
    return res.status(500).json({ message: 'Gagal mengubah status ruangan.' });
  }
};

const createRoom = async (req, res) => {
  const { nama, kapasitas, deskripsi } = req.body;
  if (!nama || !kapasitas) {
    return res.status(400).json({ message: 'Nama ruangan dan kapasitas wajib diisi.' });
  }

  try {
    const connection = await mysql.createConnection(dbConfig);
    // Check jika nama ruangan sudah ada
    const [existing] = await connection.execute('SELECT id FROM rooms WHERE nama = ?', [nama]);
    if (existing.length > 0) {
      await connection.end();
      return res.status(400).json({ message: 'Nama ruangan sudah digunakan.' });
    }

    await connection.execute(
      'INSERT INTO rooms (nama, kapasitas, deskripsi, status, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())',
      [nama, kapasitas, deskripsi || null, 'ACTIVE']
    );
    await connection.end();
    return res.status(201).json({ message: 'Ruangan berhasil ditambahkan.' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Gagal menambahkan ruangan.' });
  }
};

const updateRoom = async (req, res) => {
  const { id } = req.params;
  const { nama, kapasitas, deskripsi } = req.body;

  if (!nama || !kapasitas) {
    return res.status(400).json({ message: 'Nama ruangan dan kapasitas wajib diisi.' });
  }

  try {
    const connection = await mysql.createConnection(dbConfig);
    // Check nama ruangan unik selain yang sedang di-edit
    const [existing] = await connection.execute('SELECT id FROM rooms WHERE nama = ? AND id != ?', [nama, id]);
    if (existing.length > 0) {
      await connection.end();
      return res.status(400).json({ message: 'Nama ruangan sudah digunakan.' });
    }

    await connection.execute(
      'UPDATE rooms SET nama = ?, kapasitas = ?, deskripsi = ?, updated_at = NOW() WHERE id = ?',
      [nama, kapasitas, deskripsi || null, id]
    );
    await connection.end();
    return res.json({ message: 'Data ruangan berhasil diperbarui.' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Gagal memperbarui data ruangan.' });
  }
};

const deleteRoom = async (req, res) => {
  const { id } = req.params;

  try {
    const connection = await mysql.createConnection(dbConfig);
    // Kita mencoba delete. Jika ada constraint foreign key dari bookings, akan melempar error
    await connection.execute('DELETE FROM rooms WHERE id = ?', [id]);
    await connection.end();
    return res.json({ message: 'Ruangan berhasil dihapus.' });
  } catch (error) {
    console.error(error);
    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
      return res.status(400).json({ message: 'Ruangan tidak bisa dihapus karena sudah memiliki riwayat reservasi.' });
    }
    return res.status(500).json({ message: 'Gagal menghapus ruangan.' });
  }
};

// Pastikan semua fungsi terdaftar di exports bawah ini!
module.exports = {
  getPendingBookings,
  getAllBookings,
  approveBooking,
  rejectBooking,
  getAllUsers,
  createUser,
  toggleUserStatus,
  resetUserPassword,
  updateUser, // <-- Terpasang dengan aman
  toggleRoomStatus,
  getAllRooms,
  createRoom,
  updateRoom,
  deleteRoom
};