// =========================================================
// [ACTIVE] VERSI CLOUD (PRISMA + NEON POSTGRESQL)
// =========================================================
const prisma = require('../config/db');
const bcrypt = require('bcryptjs');

const generateRandomToken = (length = 6) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `RMT-${result}`;
};

const timeToMinutes = (timeStr) => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

const mapBooking = (b) => {
  const res = {
    id: b.id,
    user_id: b.userId,
    room_id: b.roomId,
    tanggal: b.tanggal.toISOString().split('T')[0],
    jam_mulai: b.jamMulai,
    jam_selesai: b.jamSelesai,
    agenda: b.agenda,
    pemateri: b.pemateri,
    jumlah_peserta: b.jumlahPeserta,
    catatan: b.catatan,
    status: b.status,
    alasan_reject: b.alasanReject,
    approved_by: b.approvedBy,
    approved_at: b.approvedAt,
    created_at: b.createdAt,
    updated_at: b.updatedAt,
  };
  if (b.user) {
    res.pemesan = b.user.namaLengkap;
    res.nama_lengkap = b.user.namaLengkap;
  }
  if (b.room) {
    res.nama_ruangan = b.room.nama;
  }
  return res;
};

// ==========================================
// ADMIN ENDPOINTS
// ==========================================

const generateToken = async (req, res) => {
  const { roomId, label } = req.body;
  if (!roomId) return res.status(400).json({ message: 'roomId diperlukan' });

  try {
    const room = await prisma.room.findUnique({ where: { id: parseInt(roomId) } });
    
    if (!room) {
      return res.status(404).json({ message: 'Ruangan tidak ditemukan' });
    }

    const token = generateRandomToken();
    await prisma.deviceToken.create({
      data: {
        token,
        roomId: parseInt(roomId),
        label: label || null,
        isActive: true
      }
    });

    return res.status(201).json({ message: 'Token berhasil dibuat', token, room: room.nama });
  } catch (error) {
    console.error("generateToken error:", error);
    return res.status(500).json({ message: 'Gagal membuat token device' });
  }
};

const getDevices = async (req, res) => {
  try {
    const devices = await prisma.deviceToken.findMany({
      include: {
        room: { select: { nama: true } }
      },
      orderBy: [
        { room: { nama: 'asc' } },
        { createdAt: 'desc' }
      ]
    });
    
    const mapped = devices.map(d => ({
      ...d,
      room_id: d.roomId,
      is_active: d.isActive ? 1 : 0,
      activated_at: d.activatedAt,
      last_ip: d.lastIp,
      device_uuid: d.deviceUuid,
      last_seen_at: d.lastSeenAt,
      created_at: d.createdAt,
      updated_at: d.updatedAt,
      roomName: d.room.nama
    }));

    return res.json(mapped);
  } catch (error) {
    console.error("getDevices error:", error);
    return res.status(500).json({ message: 'Gagal mengambil daftar device' });
  }
};

const revokeDevice = async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.deviceToken.update({
      where: { id: parseInt(id) },
      data: {
        isActive: false,
        activatedAt: null,
        lastIp: null
      }
    });
    return res.json({ message: 'Device token berhasil dinonaktifkan' });
  } catch (error) {
    console.error("revokeDevice error:", error);
    return res.status(500).json({ message: 'Gagal menonaktifkan token' });
  }
};

const activateDevice = async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.deviceToken.update({
      where: { id: parseInt(id) },
      data: { isActive: true }
    });
    return res.json({ message: 'Device token berhasil diaktifkan kembali' });
  } catch (error) {
    console.error("activateDevice error:", error);
    return res.status(500).json({ message: 'Gagal mengaktifkan token' });
  }
};

const deleteDevice = async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.deviceToken.delete({
      where: { id: parseInt(id) }
    });
    return res.json({ message: 'Device token berhasil dihapus' });
  } catch (error) {
    console.error("deleteDevice error:", error);
    return res.status(500).json({ message: 'Gagal menghapus token' });
  }
};

// ==========================================
// KIOSK ENDPOINTS (PUBLIC / TABLET)
// ==========================================

const activateKiosk = async (req, res) => {
  const { token, deviceUuid } = req.body; 
  if (!token) return res.status(400).json({ message: 'Token diperlukan' });

  try {
    const device = await prisma.deviceToken.findUnique({
      where: { token },
      include: {
        room: { select: { nama: true, kapasitas: true } }
      }
    });

    if (!device || !device.isActive) {
      return res.status(401).json({ message: 'Token tidak valid atau dinonaktifkan' });
    }

    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip;

    if (device.activatedAt && device.deviceUuid && device.deviceUuid !== deviceUuid) {
      return res.status(403).json({ 
        message: 'Akses Ditolak! Token ini telah terikat dan digunakan oleh perangkat tablet lain.' 
      });
    }

    const dataUpdate = {
      lastSeenAt: new Date(),
      lastIp: clientIp
    };

    if (!device.activatedAt) {
      dataUpdate.activatedAt = new Date();
      dataUpdate.deviceUuid = deviceUuid || 'GENERIC_UUID';
    }

    await prisma.deviceToken.update({
      where: { id: device.id },
      data: dataUpdate
    });

    return res.json({
      message: 'Aktivasi berhasil',
      roomId: device.roomId,
      roomName: device.room.nama,
      kapasitas: device.room.kapasitas
    });
  } catch (error) {
    console.error("activateKiosk error:", error);
    return res.status(500).json({ message: 'Terjadi kesalahan saat aktivasi' });
  }
};

const getKioskSchedule = async (req, res) => {
  const roomId = req.device.roomId || req.device.room_id; // Support both cases
  const { tanggal } = req.query; 
  
  if (!tanggal) {
    return res.status(400).json({ message: 'Parameter tanggal diperlukan' });
  }

  try {
    const bookings = await prisma.booking.findMany({
      where: {
        roomId: parseInt(roomId),
        tanggal: new Date(tanggal),
        status: { in: ['APPROVED', 'PENDING'] }
      },
      include: {
        user: { select: { namaLengkap: true } }
      },
      orderBy: { jamMulai: 'asc' }
    });
    
    return res.json(bookings.map(mapBooking));
  } catch (error) {
    console.error("getKioskSchedule error:", error);
    return res.status(500).json({ message: 'Gagal mengambil jadwal ruangan' });
  }
};

const getKioskUpcoming = async (req, res) => {
  const roomId = req.device.roomId || req.device.room_id;
  const { tanggal } = req.query; 

  if (!tanggal) {
    return res.status(400).json({ message: 'Parameter tanggal diperlukan' });
  }

  try {
    const bookings = await prisma.booking.findMany({
      where: {
        roomId: parseInt(roomId),
        tanggal: { gt: new Date(tanggal) },
        status: { in: ['APPROVED', 'PENDING'] }
      },
      include: {
        user: { select: { namaLengkap: true } }
      },
      orderBy: [
        { tanggal: 'asc' },
        { jamMulai: 'asc' }
      ],
      take: 10
    });
    
    return res.json(bookings.map(mapBooking));
  } catch (error) {
    console.error("getKioskUpcoming error:", error);
    return res.status(500).json({ message: 'Gagal mengambil jadwal upcoming' });
  }
};

const getRoomInfo = async (req, res) => {
  return res.json({
    roomId: req.device.roomId || req.device.room_id,
    roomName: req.device.roomName,
    kapasitas: req.device.kapasitas
  });
};

const heartbeat = async (req, res) => {
  return res.json({ message: 'ok' });
};

const getKioskCalendar = async (req, res) => {
  const { bulan, tahun, roomId } = req.query;
  if (!bulan || !tahun) return res.status(400).json({ message: 'Bulan dan tahun diperlukan' });

  try {
    const startDate = new Date(`${tahun}-${bulan}-01`);
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 1);

    const where = {
      tanggal: { gte: startDate, lt: endDate },
      status: { in: ['APPROVED', 'PENDING'] }
    };

    if (roomId) {
      where.roomId = parseInt(roomId);
    }

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        user: { select: { namaLengkap: true } },
        room: { select: { nama: true } }
      }
    });
    
    return res.json(bookings.map(mapBooking));
  } catch (error) {
    console.error("getKioskCalendar error:", error);
    return res.status(500).json({ message: 'Gagal mengambil kalender' });
  }
};

const getKioskRooms = async (req, res) => {
  try {
    const rooms = await prisma.room.findMany({
      select: { id: true, nama: true, kapasitas: true },
      orderBy: { nama: 'asc' }
    });
    return res.json(rooms);
  } catch (error) {
    console.error("getKioskRooms error:", error);
    return res.status(500).json({ message: 'Gagal mengambil daftar ruangan' });
  }
};

const verifyKioskUser = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email dan password wajib diisi.' });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: 'Email tidak ditemukan.' });
    }
    
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Password salah.' });
    }
    if (user.status !== 'ACTIVE') {
      return res.status(403).json({ message: 'Akun Anda diblokir atau tidak aktif.' });
    }
    
    return res.json({ message: 'Verifikasi berhasil', user: { nama_lengkap: user.namaLengkap } });
  } catch (error) {
    console.error("verifyKioskUser error:", error);
    return res.status(500).json({ message: 'Gagal memverifikasi pengguna.' });
  }
};

const createKioskBooking = async (req, res) => {
  let { roomId, tanggal, jamMulai, jamSelesai, agenda, pemateri, jumlahPeserta, email, password } = req.body;
  
  if (!roomId) roomId = req.device.roomId || req.device.room_id;

  if (!tanggal || !jamMulai || !jamSelesai || !agenda || !jumlahPeserta || !email || !password) {
    return res.status(400).json({ message: 'Semua form wajib diisi termasuk Email dan Password.' });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: 'Email tidak ditemukan.' });
    }
    
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Password salah.' });
    }
    if (user.status !== 'ACTIVE') {
      return res.status(403).json({ message: 'Akun Anda diblokir atau tidak aktif.' });
    }
    
    const userId = user.id;

    const room = await prisma.room.findUnique({ where: { id: parseInt(roomId) } });
    if (!room) {
      return res.status(404).json({ message: 'Ruangan tidak ditemukan.' });
    }
    if (parseInt(jumlahPeserta) > room.kapasitas) {
      return res.status(400).json({ message: `Jumlah peserta melebihi kapasitas ${room.nama} (Maks: ${room.kapasitas} orang).` });
    }

    const startMin = timeToMinutes(jamMulai);
    const endMin = timeToMinutes(jamSelesai);
    const opStart = timeToMinutes('08:00');
    const opEnd = timeToMinutes('17:00');

    if (startMin < opStart || endMin > opEnd || startMin >= endMin) {
      return res.status(400).json({ message: 'Waktu rapat harus berada dalam jam operasional (08:00 - 17:00).' });
    }

    const bookingDate = new Date(tanggal);
    const today = new Date();
    today.setHours(0,0,0,0);
    
    if (bookingDate.getDay() === 0 || bookingDate.getDay() === 6) {
      return res.status(400).json({ message: 'Pemesanan hanya diperbolehkan pada hari kerja (Senin - Jumat).' });
    }

    if (bookingDate < today) {
      return res.status(400).json({ message: 'Tidak bisa memesan untuk tanggal yang sudah lewat.' });
    }

    const existingBookings = await prisma.booking.findMany({
      where: {
        roomId: parseInt(roomId),
        tanggal: new Date(tanggal),
        status: { in: ['APPROVED', 'PENDING'] }
      },
      select: { jamMulai: true, jamSelesai: true }
    });

    const BUFFER = 30;
    for (const b of existingBookings) {
      const extStart = timeToMinutes(b.jamMulai);
      const extEnd = timeToMinutes(b.jamSelesai);
      const safeStart = extStart - BUFFER;
      const safeEnd = extEnd + BUFFER;

      if ((startMin >= safeStart && startMin < safeEnd) || 
          (endMin > safeStart && endMin <= safeEnd) || 
          (startMin <= safeStart && endMin >= safeEnd)) {
        return res.status(400).json({ 
          message: `Slot waktu bentrok! Ada rapat jam ${b.jamMulai}-${b.jamSelesai}. Dibutuhkan jeda 30 menit.` 
        });
      }
    }

    await prisma.booking.create({
      data: {
        userId,
        roomId: parseInt(roomId),
        tanggal: new Date(tanggal),
        jamMulai,
        jamSelesai,
        agenda,
        pemateri: pemateri || null,
        jumlahPeserta: parseInt(jumlahPeserta),
        catatan: 'Booking via Kiosk — Menunggu Persetujuan Admin',
        status: 'PENDING'
      }
    });

    return res.status(201).json({ message: 'Pemesanan langsung dari Kiosk berhasil! ✅' });

  } catch (error) {
    console.error("createKioskBooking error:", error);
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
  verifyKioskUser,
  createKioskBooking,
  getKioskCalendar,
  getKioskRooms
};


/* =========================================================
   [INACTIVE] VERSI LOKAL (RAW MYSQL)
   Untuk kembali ke mode lokal, hapus blok komentar ini (/* ... * /)
   lalu berikan komentar pada seluruh blok VERSI CLOUD di atas.
   =========================================================
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
  return \`RMT-\${result}\`;
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
    const [rows] = await connection.execute(\`
      SELECT dt.*, r.nama as roomName 
      FROM device_tokens dt
      JOIN rooms r ON dt.room_id = r.id
      ORDER BY r.nama ASC, dt.created_at DESC
    \`);
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
    // query di bawah diubah dengan menghapus 'device_uuid = NULL' agar tidak error
    await connection.execute(
      'UPDATE device_tokens SET is_active = 0, activated_at = NULL, last_ip = NULL, updated_at = NOW() WHERE id = ?', 
      [id]
    );
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
  const { token, deviceUuid } = req.body; // Terima deviceUuid dari body registrasi frontend
  if (!token) return res.status(400).json({ message: 'Token diperlukan' });

  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute(
      \`SELECT dt.*, r.nama as roomName, r.kapasitas 
       FROM device_tokens dt 
       JOIN rooms r ON dt.room_id = r.id 
       WHERE dt.token = ?\`, 
      [token]
    );

    if (rows.length === 0 || rows[0].is_active === 0) {
      await connection.end();
      return res.status(401).json({ message: 'Token tidak valid atau dinonaktifkan' });
    }

    const device = rows[0];
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip;

    // 🔒 PENGUNCIAN KIOSK BARU
    if (device.activated_at && device.device_uuid && device.device_uuid !== deviceUuid) {
      await connection.end();
      return res.status(403).json({ 
        message: 'Akses Ditolak! Token ini telah terikat dan digunakan oleh perangkat tablet lain.' 
      });
    }

    if (!device.activated_at) {
      await connection.execute(
        'UPDATE device_tokens SET activated_at = NOW(), last_seen_at = NOW(), last_ip = ?, device_uuid = ?, updated_at = NOW() WHERE id = ?',
        [clientIp, deviceUuid || 'GENERIC_UUID', device.id]
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
  const { tanggal } = req.query; 
  
  if (!tanggal) {
    return res.status(400).json({ message: 'Parameter tanggal diperlukan' });
  }

  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute(
      \`SELECT b.id, b.jam_mulai, b.jam_selesai, b.agenda, b.status, u.nama_lengkap as pemesan, b.jumlah_peserta
       FROM bookings b
       JOIN users u ON b.user_id = u.id
       WHERE b.room_id = ? AND b.tanggal = ? AND b.status IN ('APPROVED', 'PENDING')
       ORDER BY b.jam_mulai ASC\`,
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
  const { tanggal } = req.query; 

  if (!tanggal) {
    return res.status(400).json({ message: 'Parameter tanggal diperlukan' });
  }

  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute(
      \`SELECT b.id, b.tanggal, b.jam_mulai, b.jam_selesai, b.agenda, b.status, u.nama_lengkap as pemesan, b.jumlah_peserta
       FROM bookings b
       JOIN users u ON b.user_id = u.id
       WHERE b.room_id = ? AND b.tanggal > ? AND b.status IN ('APPROVED', 'PENDING')
       ORDER BY b.tanggal ASC, b.jam_mulai ASC
       LIMIT 10\`,
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
  return res.json({ message: 'ok' });
};

const getKioskCalendar = async (req, res) => {
  const { bulan, tahun, roomId } = req.query;
  if (!bulan || !tahun) return res.status(400).json({ message: 'Bulan dan tahun diperlukan' });

  try {
    const connection = await mysql.createConnection(dbConfig);
    let query = \`
      SELECT b.id, b.tanggal, b.jam_mulai, b.jam_selesai, b.agenda, b.status, b.room_id, 
             u.nama_lengkap as pemesan, u.nama_lengkap as nama_lengkap, r.nama as nama_ruangan
      FROM bookings b
      JOIN users u ON b.user_id = u.id
      JOIN rooms r ON b.room_id = r.id
      WHERE MONTH(b.tanggal) = ? AND YEAR(b.tanggal) = ? AND b.status IN ('APPROVED', 'PENDING')
    \`;
    const params = [bulan, tahun];
    
    if (roomId) {
      query += \` AND b.room_id = ?\`;
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

const verifyKioskUser = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email dan password wajib diisi.' });
  }

  try {
    const connection = await mysql.createConnection(dbConfig);
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
    
    await connection.end();
    return res.json({ message: 'Verifikasi berhasil', user: { nama_lengkap: user.nama_lengkap } });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Gagal memverifikasi pengguna.' });
  }
};

const createKioskBooking = async (req, res) => {
  let { roomId, tanggal, jamMulai, jamSelesai, agenda, pemateri, jumlahPeserta, email, password } = req.body;
  
  if (!roomId) roomId = req.device.room_id;

  if (!tanggal || !jamMulai || !jamSelesai || !agenda || !jumlahPeserta || !email || !password) {
    return res.status(400).json({ message: 'Semua form wajib diisi termasuk Email dan Password.' });
  }

  try {
    const connection = await mysql.createConnection(dbConfig);

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

    const [rooms] = await connection.execute('SELECT * FROM rooms WHERE id = ?', [roomId]);
    if (rooms.length === 0) {
      await connection.end();
      return res.status(404).json({ message: 'Ruangan tidak ditemukan.' });
    }
    const room = rooms[0];
    if (jumlahPeserta > room.kapasitas) {
      await connection.end();
      return res.status(400).json({ message: \`Jumlah peserta melebihi kapasitas \${room.nama} (Maks: \${room.kapasitas} orang).\` });
    }

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

    const [existingBookings] = await connection.execute(
      \`SELECT jam_mulai, jam_selesai FROM bookings 
       WHERE room_id = ? AND tanggal = ? AND status IN ('APPROVED', 'PENDING')\`,
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
          message: \`Slot waktu bentrok! Ada rapat jam \${b.jam_mulai}-\${b.jam_selesai}. Dibutuhkan jeda 30 menit.\` 
        });
      }
    }

    await connection.execute(
      \`INSERT INTO bookings (user_id, room_id, tanggal, jam_mulai, jam_selesai, agenda, pemateri, jumlah_peserta, catatan, status, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())\`,
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
  verifyKioskUser,
  createKioskBooking,
  getKioskCalendar,
  getKioskRooms
};
========================================================= */