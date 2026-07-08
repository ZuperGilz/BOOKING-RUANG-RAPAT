const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const dbConfig = require('../config/db');

// Generate random alphanumeric token
const generateRandomToken = (length = 6) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `RMT-${result}`;
};

// ==========================================
// ADMIN ENDPOINTS
// ==========================================

const generateToken = async (req, res) => {
  const { roomId, label } = req.body;
  if (!roomId) return res.status(400).json({ message: 'roomId diperlukan' });

  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rooms] = await connection.execute('SELECT * FROM rooms WHERE id = ?', [roomId]);
    
    if (rooms.length === 0) {
      await connection.end();
      return res.status(404).json({ message: 'Ruangan tidak ditemukan' });
    }

    const token = generateRandomToken();
    await connection.execute(
      'INSERT INTO device_tokens (token, room_id, label, is_active, created_at, updated_at) VALUES (?, ?, ?, 1, NOW(), NOW())',
      [token, roomId, label || null]
    );

    await connection.end();
    return res.status(201).json({ message: 'Token berhasil dibuat', token, room: rooms[0].nama });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Gagal membuat token device' });
  }
};

const getDevices = async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute(`
      SELECT dt.*, r.nama as roomName 
      FROM device_tokens dt
      JOIN rooms r ON dt.room_id = r.id
      ORDER BY r.nama ASC, dt.created_at DESC
    `);
    await connection.end();
    return res.json(rows);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Gagal mengambil daftar device' });
  }
};

const revokeDevice = async (req, res) => {
  const { id } = req.params;
  try {
    const connection = await mysql.createConnection(dbConfig);
    await connection.execute('UPDATE device_tokens SET is_active = 0, updated_at = NOW() WHERE id = ?', [id]);
    await connection.end();
    return res.json({ message: 'Device token berhasil dinonaktifkan' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Gagal menonaktifkan token' });
  }
};

const activateDevice = async (req, res) => {
  const { id } = req.params;
  try {
    const connection = await mysql.createConnection(dbConfig);
    await connection.execute('UPDATE device_tokens SET is_active = 1, updated_at = NOW() WHERE id = ?', [id]);
    await connection.end();
    return res.json({ message: 'Device token berhasil diaktifkan kembali' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Gagal mengaktifkan token' });
  }
};

const deleteDevice = async (req, res) => {
  const { id } = req.params;
  try {
    const connection = await mysql.createConnection(dbConfig);
    await connection.execute('DELETE FROM device_tokens WHERE id = ?', [id]);
    await connection.end();
    return res.json({ message: 'Device token berhasil dihapus' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Gagal menghapus token' });
  }
};

// ==========================================
// KIOSK ENDPOINTS (PUBLIC / TABLET)
// ==========================================

const activateKiosk = async (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ message: 'Token diperlukan' });

  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute(
      `SELECT dt.*, r.nama as roomName, r.kapasitas 
       FROM device_tokens dt 
       JOIN rooms r ON dt.room_id = r.id 
       WHERE dt.token = ?`, 
      [token]
    );

    if (rows.length === 0 || rows[0].is_active === 0) {
      await connection.end();
      return res.status(401).json({ message: 'Token tidak valid atau dinonaktifkan' });
    }

    const device = rows[0];
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip;

    // Jika sudah pernah diaktivasi dan IP berbeda, blokir (Lock to IP)
    if (device.activated_at && device.last_ip && device.last_ip !== clientIp) {
      // Pengecualian: localhost IPv4 dan IPv6 bisa bervariasi (::1, 127.0.0.1) 
      // Tapi untuk jaringan lokal ini cukup efektif
      if (clientIp !== '::1' && clientIp !== '127.0.0.1' && device.last_ip !== '::1' && device.last_ip !== '127.0.0.1') {
        await connection.end();
        return res.status(401).json({ message: 'Token ini sudah digunakan di perangkat lain.' });
      }
    }

    // Jika ini pertama kali diaktifkan
    if (!device.activated_at) {
      await connection.execute(
        'UPDATE device_tokens SET activated_at = NOW(), last_seen_at = NOW(), last_ip = ?, updated_at = NOW() WHERE id = ?',
        [clientIp, device.id]
      );
    } else {
      await connection.execute(
        'UPDATE device_tokens SET last_seen_at = NOW(), last_ip = ?, updated_at = NOW() WHERE id = ?',
        [clientIp, device.id]
      );
    }

    await connection.end();

    return res.json({
      message: 'Aktivasi berhasil',
      roomId: device.room_id,
      roomName: device.roomName,
      kapasitas: device.kapasitas
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Terjadi kesalahan saat aktivasi' });
  }
};

const getKioskSchedule = async (req, res) => {
  const roomId = req.device.room_id;
  const { tanggal } = req.query; // format YYYY-MM-DD
  
  if (!tanggal) {
    return res.status(400).json({ message: 'Parameter tanggal diperlukan' });
  }

  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute(
      `SELECT b.id, b.jam_mulai, b.jam_selesai, b.agenda, b.status, u.nama_lengkap as pemesan, b.jumlah_peserta
       FROM bookings b
       JOIN users u ON b.user_id = u.id
       WHERE b.room_id = ? AND b.tanggal = ? AND b.status IN ('APPROVED', 'PENDING')
       ORDER BY b.jam_mulai ASC`,
      [roomId, tanggal]
    );
    await connection.end();
    return res.json(rows);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Gagal mengambil jadwal ruangan' });
  }
};

const getKioskUpcoming = async (req, res) => {
  const roomId = req.device.room_id;
  const { tanggal } = req.query; // format YYYY-MM-DD (today)

  if (!tanggal) {
    return res.status(400).json({ message: 'Parameter tanggal diperlukan' });
  }

  try {
    const connection = await mysql.createConnection(dbConfig);
    // Ambil jadwal mulai besok ke depan, max 10 item
    const [rows] = await connection.execute(
      `SELECT b.id, b.tanggal, b.jam_mulai, b.jam_selesai, b.agenda, b.status, u.nama_lengkap as pemesan, b.jumlah_peserta
       FROM bookings b
       JOIN users u ON b.user_id = u.id
       WHERE b.room_id = ? AND b.tanggal > ? AND b.status IN ('APPROVED', 'PENDING')
       ORDER BY b.tanggal ASC, b.jam_mulai ASC
       LIMIT 10`,
      [roomId, tanggal]
    );
    await connection.end();
    return res.json(rows);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Gagal mengambil jadwal upcoming' });
  }
};

const getRoomInfo = async (req, res) => {
  return res.json({
    roomId: req.device.room_id,
    roomName: req.device.roomName,
    kapasitas: req.device.kapasitas
  });
};

const heartbeat = async (req, res) => {
  // lastSeenAt dan lastIp sudah di-update di middleware
  return res.json({ message: 'ok' });
};

// Fungsi helper waktu
const timeToMinutes = (timeStr) => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

const getKioskCalendar = async (req, res) => {
  const { bulan, tahun, roomId } = req.query;
  if (!bulan || !tahun) return res.status(400).json({ message: 'Bulan dan tahun diperlukan' });

  try {
    const connection = await mysql.createConnection(dbConfig);
    let query = `
      SELECT b.id, b.tanggal, b.jam_mulai, b.jam_selesai, b.agenda, b.status, b.room_id, 
             u.nama_lengkap as pemesan, u.nama_lengkap as nama_lengkap, r.nama as nama_ruangan
      FROM bookings b
      JOIN users u ON b.user_id = u.id
      JOIN rooms r ON b.room_id = r.id
      WHERE MONTH(b.tanggal) = ? AND YEAR(b.tanggal) = ? AND b.status IN ('APPROVED', 'PENDING')
    `;
    const params = [bulan, tahun];
    
    if (roomId) {
      query += ` AND b.room_id = ?`;
      params.push(roomId);
    }
    
    const [rows] = await connection.execute(query, params);
    await connection.end();
    return res.json(rows);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Gagal mengambil kalender' });
  }
};

const getKioskRooms = async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute('SELECT id, nama, kapasitas FROM rooms ORDER BY nama ASC');
    await connection.end();
    return res.json(rows);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Gagal mengambil daftar ruangan' });
  }
};

const createKioskBooking = async (req, res) => {
  let { roomId, tanggal, jamMulai, jamSelesai, agenda, pemateri, jumlahPeserta, email, password } = req.body;
  
  // Jika roomId tidak dikirim, gunakan roomId bawaan Kiosk
  if (!roomId) roomId = req.device.room_id;

  if (!tanggal || !jamMulai || !jamSelesai || !agenda || !jumlahPeserta || !email || !password) {
    return res.status(400).json({ message: 'Semua form wajib diisi termasuk Email dan Password.' });
  }

  try {
    const connection = await mysql.createConnection(dbConfig);

    // 1. Verifikasi Kredensial User
    const [users] = await connection.execute('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      await connection.end();
      return res.status(401).json({ message: 'Email tidak ditemukan.' });
    }
    
    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      await connection.end();
      return res.status(401).json({ message: 'Password salah.' });
    }
    if (user.status !== 'ACTIVE') {
      await connection.end();
      return res.status(403).json({ message: 'Akun Anda diblokir atau tidak aktif.' });
    }
    
    const userId = user.id;

    // 2. Cek Ruangan
    const [rooms] = await connection.execute('SELECT * FROM rooms WHERE id = ?', [roomId]);
    if (rooms.length === 0) {
      await connection.end();
      return res.status(404).json({ message: 'Ruangan tidak ditemukan.' });
    }
    const room = rooms[0];
    if (jumlahPeserta > room.kapasitas) {
      await connection.end();
      return res.status(400).json({ message: `Jumlah peserta melebihi kapasitas ${room.nama} (Maks: ${room.kapasitas} orang).` });
    }

    // 3. Validasi Waktu & Hari
    const startMin = timeToMinutes(jamMulai);
    const endMin = timeToMinutes(jamSelesai);
    const opStart = timeToMinutes('08:00');
    const opEnd = timeToMinutes('17:00');

    if (startMin < opStart || endMin > opEnd || startMin >= endMin) {
      await connection.end();
      return res.status(400).json({ message: 'Waktu rapat harus berada dalam jam operasional (08:00 - 17:00).' });
    }

    const bookingDate = new Date(tanggal);
    const today = new Date();
    today.setHours(0,0,0,0);
    
    if (bookingDate.getDay() === 0 || bookingDate.getDay() === 6) {
      await connection.end();
      return res.status(400).json({ message: 'Pemesanan hanya diperbolehkan pada hari kerja (Senin - Jumat).' });
    }

    if (bookingDate < today) {
      await connection.end();
      return res.status(400).json({ message: 'Tidak bisa memesan untuk tanggal yang sudah lewat.' });
    }

    // 4. Pengecekan Bentrok
    const [existingBookings] = await connection.execute(
      `SELECT jam_mulai, jam_selesai FROM bookings 
       WHERE room_id = ? AND tanggal = ? AND status IN ('APPROVED', 'PENDING')`,
      [roomId, tanggal]
    );

    const BUFFER = 30;
    for (const b of existingBookings) {
      const extStart = timeToMinutes(b.jam_mulai);
      const extEnd = timeToMinutes(b.jam_selesai);
      const safeStart = extStart - BUFFER;
      const safeEnd = extEnd + BUFFER;

      if ((startMin >= safeStart && startMin < safeEnd) || 
          (endMin > safeStart && endMin <= safeEnd) || 
          (startMin <= safeStart && endMin >= safeEnd)) {
        await connection.end();
        return res.status(400).json({ 
          message: `Slot waktu bentrok! Ada rapat jam ${b.jam_mulai}-${b.jam_selesai}. Dibutuhkan jeda 30 menit.` 
        });
      }
    }

    // 5. Insert Booking — status PENDING, menunggu persetujuan Admin
    await connection.execute(
      `INSERT INTO bookings (user_id, room_id, tanggal, jam_mulai, jam_selesai, agenda, pemateri, jumlah_peserta, catatan, status, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [userId, roomId, tanggal, jamMulai, jamSelesai, agenda, pemateri || null, jumlahPeserta, 'Booking via Kiosk — Menunggu Persetujuan Admin', 'PENDING']
    );

    await connection.end();
    
    return res.status(201).json({ message: 'Pemesanan langsung dari Kiosk berhasil! ✅' });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Gagal membuat booking dari kiosk.' });
  }
};

module.exports = {
  generateToken,
  getDevices,
  revokeDevice,
  activateDevice,
  deleteDevice,
  activateKiosk,
  getKioskSchedule,
  getKioskUpcoming,
  getRoomInfo,
  heartbeat,
  createKioskBooking,
  getKioskCalendar,
  getKioskRooms
};
