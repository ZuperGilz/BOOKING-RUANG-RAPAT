// =========================================================
// [ACTIVE] VERSI CLOUD (PRISMA + NEON POSTGRESQL)
// =========================================================
const prisma = require('../config/prisma');

// Fungsi Helper: Mengubah format "HH:mm" menjadi total menit
const timeToMinutes = (timeStr) => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

// Helper for mapping to frontend expectations (snake_case)
const mapBooking = (b) => {
  const res = {
    id: b.id,
    user_id: b.userId,
    room_id: b.roomId,
    // Format YYYY-MM-DD
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
    res.nama_lengkap = b.user.namaLengkap;
    res.no_telp = b.user.noTelp;
    res.pemesan = b.user.namaLengkap; // For getPublicSchedule
  }
  
  if (b.room) {
    res.nama_ruangan = b.room.nama;
  }
  
  return res;
};

// ==========================================
// LOGIKA OPERASI BOOKING RUANGAN
// ==========================================

const createBooking = async (req, res) => {
  const { roomId, tanggal, jamMulai, jamSelesai, agenda, pemateri, jumlahPeserta, catatan, targetUserId } = req.body;
  
  const userId = (req.user.role === 'ADMIN' && targetUserId) ? targetUserId : req.user.id;

  if (!roomId || !tanggal || !jamMulai || !jamSelesai || !agenda || !jumlahPeserta) {
    return res.status(400).json({ message: 'Semua form wajib diisi kecuali pemateri dan catatan.' });
  }

  try {
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
      return res.status(400).json({ message: 'Pemesanan ruang rapat hanya diperbolehkan pada hari kerja (Senin - Jumat).' });
    }

    const maxDate = new Date();
    maxDate.setDate(today.getDate() + 30);
    if (bookingDate < today || bookingDate > maxDate) {
      return res.status(400).json({ message: 'Pemesanan hanya diperbolehkan mulai hari ini hingga maksimal H+30 ke depan.' });
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
          message: `Slot waktu bentrok! Ada rapat jam ${b.jamMulai}-${b.jamSelesai}. Dibutuhkan jeda persiapan/buffer 30 menit.` 
        });
      }
    }

    const isByAdmin = req.user.role === 'ADMIN';
    const status = isByAdmin ? 'APPROVED' : 'PENDING';
    const approvedBy = isByAdmin ? req.user.id : null;
    const approvedAt = isByAdmin ? new Date() : null;

    await prisma.booking.create({
      data: {
        userId: parseInt(userId),
        roomId: parseInt(roomId),
        tanggal: new Date(tanggal),
        jamMulai,
        jamSelesai,
        agenda,
        pemateri: pemateri || null,
        jumlahPeserta: parseInt(jumlahPeserta),
        catatan: catatan || '',
        status,
        approvedBy,
        approvedAt
      }
    });
    
    const message = isByAdmin ? 'Pemesanan berhasil dan langsung disetujui! ✅' : 'Pemesanan berhasil diajukan! Menunggu persetujuan admin ⏳';
    return res.status(201).json({ message });

  } catch (error) {
    console.error("createBooking error:", error);
    return res.status(500).json({ message: 'Terjadi kesalahan internal server saat menyimpan booking.' });
  }
};

const getSchedule = async (req, res) => {
  const { tanggal, bulan, tahun } = req.query;

  try {
    const where = { status: 'APPROVED' };

    if (tanggal) {
      where.tanggal = new Date(tanggal);
    } else if (bulan && tahun) {
      const startDate = new Date(`${tahun}-${bulan}-01`);
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + 1);
      
      where.tanggal = {
        gte: startDate,
        lt: endDate
      };
    }

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        user: { select: { namaLengkap: true } },
        room: { select: { nama: true } }
      },
      orderBy: [
        { tanggal: 'asc' },
        { jamMulai: 'asc' }
      ]
    });

    return res.json(bookings.map(mapBooking));
  } catch (error) {
    console.error("getSchedule error:", error);
    return res.status(500).json({ message: 'Gagal mengambil data jadwal.' });
  }
};

const getMyHistory = async (req, res) => {
  const userId = req.user.id;
  try {
    const bookings = await prisma.booking.findMany({
      where: { userId: parseInt(userId) },
      include: {
        room: { select: { nama: true } }
      },
      orderBy: [
        { tanggal: 'desc' },
        { jamMulai: 'desc' }
      ]
    });
    
    return res.json(bookings.map(mapBooking));
  } catch (error) {
    console.error("getMyHistory error:", error);
    return res.status(500).json({ message: 'Gagal mengambil riwayat Anda.' });
  }
};

const cancelBooking = async (req, res) => {
  const { id } = req.params;
  const { alasanCancel } = req.body || {};
  const userId = req.user.id;
  const role = req.user.role;

  try {
    const booking = await prisma.booking.findUnique({
      where: { id: parseInt(id) },
      select: { id: true, userId: true }
    });
    
    if (!booking) {
      return res.status(404).json({ message: 'Pemesanan tidak ditemukan.' });
    }

    if (role !== 'ADMIN' && booking.userId !== userId) {
      return res.status(403).json({ message: 'Anda tidak diizinkan membatalkan pesanan ini.' });
    }

    if (role === 'ADMIN') {
      if (!alasanCancel) {
        return res.status(400).json({ message: 'Admin wajib memberikan alasan pembatalan.' });
      }
      await prisma.booking.update({
        where: { id: parseInt(id) },
        data: {
          status: 'CANCELLED',
          alasanReject: alasanCancel,
          approvedBy: userId,
          approvedAt: new Date()
        }
      });
    } else {
      await prisma.booking.update({
        where: { id: parseInt(id) },
        data: { status: 'CANCELLED' }
      });
    }
    
    return res.json({ message: 'Pemesanan ruangan berhasil dibatalkan. 🔄' });
  } catch (error) {
    console.error("cancelBooking error:", error);
    return res.status(500).json({ message: 'Gagal membatalkan pemesanan.' });
  }
};

const getActiveRooms = async (req, res) => {
  try {
    const rooms = await prisma.room.findMany({
      where: { status: 'ACTIVE' },
      select: { id: true, nama: true, kapasitas: true },
      orderBy: { nama: 'asc' }
    });
    return res.json(rooms);
  } catch (error) {
    console.error("getActiveRooms error:", error);
    return res.status(500).json({ message: 'Gagal mengambil daftar ruangan.' });
  }
};

const getPublicSchedule = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0,0,0,0);
    const maxDate = new Date(today);
    maxDate.setDate(today.getDate() + 30);

    const bookings = await prisma.booking.findMany({
      where: {
        status: 'APPROVED',
        tanggal: {
          gte: today,
          lte: maxDate
        }
      },
      include: {
        user: { select: { namaLengkap: true } },
        room: { select: { nama: true } }
      },
      orderBy: [
        { tanggal: 'asc' },
        { jamMulai: 'asc' }
      ],
      take: 50
    });
    
    return res.json(bookings.map(mapBooking));
  } catch (error) {
    console.error("getPublicSchedule error:", error);
    return res.status(500).json({ message: 'Gagal mengambil jadwal publik.' });
  }
};

const editBooking = async (req, res) => {
  const { id } = req.params;
  const { roomId, tanggal, jamMulai, jamSelesai, agenda, pemateri, jumlahPeserta, catatan } = req.body;
  const userId = req.user.id;
  const role = req.user.role;

  if (!roomId || !tanggal || !jamMulai || !jamSelesai || !agenda || !jumlahPeserta) {
    return res.status(400).json({ message: 'Semua form wajib diisi kecuali pemateri dan catatan.' });
  }

  try {
    const booking = await prisma.booking.findUnique({ where: { id: parseInt(id) } });
    if (!booking) {
      return res.status(404).json({ message: 'Pemesanan tidak ditemukan.' });
    }

    if (role !== 'ADMIN' && booking.userId !== userId) {
      return res.status(403).json({ message: 'Anda tidak diizinkan mengedit pemesanan ini.' });
    }

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

    // Pengecekan Bentrok (Exclude current booking ID)
    const existingBookings = await prisma.booking.findMany({
      where: {
        roomId: parseInt(roomId),
        tanggal: new Date(tanggal),
        status: { in: ['APPROVED', 'PENDING'] },
        id: { not: parseInt(id) }
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
          message: `Slot waktu bentrok! Ada rapat jam ${b.jamMulai}-${b.jamSelesai}. Dibutuhkan jeda persiapan/buffer 30 menit.` 
        });
      }
    }

    const dataUpdate = {
      roomId: parseInt(roomId),
      tanggal: new Date(tanggal),
      jamMulai,
      jamSelesai,
      agenda,
      pemateri: pemateri || null,
      jumlahPeserta: parseInt(jumlahPeserta),
      catatan: catatan || ''
    };

    if (role === 'USER') {
      dataUpdate.status = 'PENDING';
      dataUpdate.approvedBy = null;
      dataUpdate.approvedAt = null;
    }

    await prisma.booking.update({
      where: { id: parseInt(id) },
      data: dataUpdate
    });

    return res.json({ message: 'Pemesanan berhasil diperbarui!' });
  } catch (error) {
    console.error("editBooking error:", error);
    return res.status(500).json({ message: 'Terjadi kesalahan internal server saat mengedit booking.' });
  }
};

module.exports = { 
  createBooking, 
  getSchedule, 
  getMyHistory, 
  cancelBooking,
  getActiveRooms,
  getPublicSchedule,
  editBooking
};


/* =========================================================
   [INACTIVE] VERSI LOKAL (RAW MYSQL)
   Untuk kembali ke mode lokal, hapus blok komentar ini (/* ... * /)
   lalu berikan komentar pada seluruh blok VERSI CLOUD di atas.
   =========================================================
const mysql = require('mysql2/promise');
const dbConfig = require('../config/db');

// Fungsi Helper: Mengubah format "HH:mm" menjadi total menit
const timeToMinutes = (timeStr) => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

// ==========================================
// LOGIKA OPERASI BOOKING RUANGAN
// ==========================================

// 1. Logika Pemesanan Baru
const createBooking = async (req, res) => {
  const { roomId, tanggal, jamMulai, jamSelesai, agenda, pemateri, jumlahPeserta, catatan, targetUserId } = req.body;
  
  // Jika admin menyertakan targetUserId, gunakan ID tersebut. Jika tidak, gunakan ID user yang login.
  const userId = (req.user.role === 'ADMIN' && targetUserId) ? targetUserId : req.user.id;

  if (!roomId || !tanggal || !jamMulai || !jamSelesai || !agenda || !jumlahPeserta) {
    return res.status(400).json({ message: 'Semua form wajib diisi kecuali pemateri dan catatan.' });
  }

  try {
    const connection = await mysql.createConnection(dbConfig);

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
      return res.status(400).json({ message: 'Pemesanan ruang rapat hanya diperbolehkan pada hari kerja (Senin - Jumat).' });
    }

    const maxDate = new Date();
    maxDate.setDate(today.getDate() + 30);
    if (bookingDate < today || bookingDate > maxDate) {
      await connection.end();
      return res.status(400).json({ message: 'Pemesanan hanya diperbolehkan mulai hari ini hingga maksimal H+30 ke depan.' });
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
          message: \`Slot waktu bentrok! Ada rapat jam \${b.jam_mulai}-\${b.jam_selesai}. Dibutuhkan jeda persiapan/buffer 30 menit.\` 
        });
      }
    }

    // Auto-approve jika yang pesan adalah ADMIN
    const isByAdmin = req.user.role === 'ADMIN';
    const status = isByAdmin ? 'APPROVED' : 'PENDING';
    const approvedBy = isByAdmin ? req.user.id : null;
    const approvedAt = isByAdmin ? new Date().toISOString().slice(0, 19).replace('T', ' ') : null; // Format YYYY-MM-DD HH:MM:SS

    let insertQuery = \`INSERT INTO bookings (user_id, room_id, tanggal, jam_mulai, jam_selesai, agenda, pemateri, jumlah_peserta, catatan, status, created_at, updated_at\`;
    let insertValues = [userId, roomId, tanggal, jamMulai, jamSelesai, agenda, pemateri || null, jumlahPeserta, catatan || '', status];
    
    if (isByAdmin) {
      insertQuery += \`, approved_by, approved_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), ?, ?)\`;
      insertValues.push(approvedBy, approvedAt);
    } else {
      insertQuery += \`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())\`;
    }

    await connection.execute(insertQuery, insertValues);

    await connection.end();
    
    const message = isByAdmin ? 'Pemesanan berhasil dan langsung disetujui! ✅' : 'Pemesanan berhasil diajukan! Menunggu persetujuan admin ⏳';
    return res.status(201).json({ message });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Terjadi kesalahan internal server saat menyimpan booking.' });
  }
};

// 2. Ambil Semua Jadwal Booking untuk Halaman Kalender Utama
// 2. Ambil Semua Jadwal Booking (Bisa per tanggal ATAU per bulan)
const getSchedule = async (req, res) => {
  const { tanggal, bulan, tahun } = req.query;

  try {
    const connection = await mysql.createConnection(dbConfig);
    
    let query = \`
      SELECT b.*, u.nama_lengkap, r.nama as nama_ruangan 
      FROM bookings b
      JOIN users u ON b.user_id = u.id
      JOIN rooms r ON b.room_id = r.id
      WHERE b.status = 'APPROVED'
    \`;
    const params = [];

    // Jika difilter per tanggal spesifik
    if (tanggal) {
      query += \` AND b.tanggal = ?\`;
      params.push(tanggal);
    } 
    // Jika difilter per bulan (Untuk UI Google Calendar)
    else if (bulan && tahun) {
      query += \` AND MONTH(b.tanggal) = ? AND YEAR(b.tanggal) = ?\`;
      params.push(bulan, tahun);
    }

    query += \` ORDER BY b.tanggal ASC, b.jam_mulai ASC\`;
    
    const [rows] = await connection.execute(query, params);
    await connection.end();
    return res.json(rows);
  } catch (error) {
    return res.status(500).json({ message: 'Gagal mengambil data jadwal.' });
  }
};

// 3. Ambil Riwayat Booking Pribadi User
const getMyHistory = async (req, res) => {
  const userId = req.user.id;
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute(
      \`SELECT b.*, r.nama as nama_ruangan FROM bookings b
       JOIN rooms r ON b.room_id = r.id
       WHERE b.user_id = ? 
       ORDER BY b.tanggal DESC, b.jam_mulai DESC\`,
      [userId]
    );
    await connection.end();
    return res.json(rows);
  } catch (error) {
    return res.status(500).json({ message: 'Gagal mengambil riwayat Anda.' });
  }
};

// 4. Batalkan Booking (Soft Delete / Ganti Status ke CANCELLED)
const cancelBooking = async (req, res) => {
  const { id } = req.params;
  const { alasanCancel } = req.body || {};
  const userId = req.user.id;
  const role = req.user.role;

  try {
    const connection = await mysql.createConnection(dbConfig);
    
    const [booking] = await connection.execute('SELECT id, user_id FROM bookings WHERE id = ?', [id]);
    if (booking.length === 0) {
      await connection.end();
      return res.status(404).json({ message: 'Pemesanan tidak ditemukan.' });
    }

    if (role !== 'ADMIN' && booking[0].user_id !== userId) {
      await connection.end();
      return res.status(403).json({ message: 'Anda tidak diizinkan membatalkan pesanan ini.' });
    }

    if (role === 'ADMIN') {
      if (!alasanCancel) {
        await connection.end();
        return res.status(400).json({ message: 'Admin wajib memberikan alasan pembatalan.' });
      }
      await connection.execute("UPDATE bookings SET status = 'CANCELLED', alasan_reject = ?, approved_by = ?, approved_at = NOW() WHERE id = ?", [alasanCancel, userId, id]);
    } else {
      await connection.execute("UPDATE bookings SET status = 'CANCELLED' WHERE id = ?", [id]);
    }

    await connection.end();
    
    return res.json({ message: 'Pemesanan ruangan berhasil dibatalkan. 🔄' });
  } catch (error) {
    return res.status(500).json({ message: 'Gagal membatalkan pemesanan.' });
  }
};

// 5. Ambil Daftar Ruangan Aktif untuk Form Reservasi
const getActiveRooms = async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute(
      "SELECT id, nama, kapasitas FROM rooms WHERE status = 'ACTIVE' ORDER BY nama ASC"
    );
    await connection.end();
    return res.json(rows);
  } catch (error) {
    return res.status(500).json({ message: 'Gagal mengambil daftar ruangan.' });
  }
};

// 6. Ambil Jadwal Publik untuk Display Board (Hanya H+7, Limit 15 Terdekat)
const getPublicSchedule = async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    // Ambil jadwal mulai hari ini hingga 7 hari ke depan
    const [rows] = await connection.execute(
      \`SELECT b.id, b.room_id, b.tanggal, b.jam_mulai, b.jam_selesai, b.agenda, b.pemateri, b.catatan, 
              u.nama_lengkap as pemesan, r.nama as nama_ruangan 
       FROM bookings b
       JOIN users u ON b.user_id = u.id
       JOIN rooms r ON b.room_id = r.id
       WHERE b.status = 'APPROVED' 
         AND b.tanggal >= CURDATE()
         AND b.tanggal <= DATE_ADD(CURDATE(), INTERVAL 30 DAY)
       ORDER BY b.tanggal ASC, b.jam_mulai ASC
       LIMIT 50\`
    );
    await connection.end();
    return res.json(rows);
  } catch (error) {
    console.error("Error fetching public schedule:", error);
    return res.status(500).json({ message: 'Gagal mengambil jadwal publik.' });
  }
};

// 7. Edit Jadwal Booking
const editBooking = async (req, res) => {
  const { id } = req.params;
  const { roomId, tanggal, jamMulai, jamSelesai, agenda, pemateri, jumlahPeserta, catatan } = req.body;
  const userId = req.user.id;
  const role = req.user.role;

  if (!roomId || !tanggal || !jamMulai || !jamSelesai || !agenda || !jumlahPeserta) {
    return res.status(400).json({ message: 'Semua form wajib diisi kecuali pemateri dan catatan.' });
  }

  try {
    const connection = await mysql.createConnection(dbConfig);

    const [bookings] = await connection.execute('SELECT * FROM bookings WHERE id = ?', [id]);
    if (bookings.length === 0) {
      await connection.end();
      return res.status(404).json({ message: 'Pemesanan tidak ditemukan.' });
    }
    const booking = bookings[0];

    if (role !== 'ADMIN' && booking.user_id !== userId) {
      await connection.end();
      return res.status(403).json({ message: 'Anda tidak diizinkan mengedit pemesanan ini.' });
    }

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

    // Pengecekan Bentrok (Exclude current booking ID)
    const [existingBookings] = await connection.execute(
      \`SELECT id, jam_mulai, jam_selesai FROM bookings 
       WHERE room_id = ? AND tanggal = ? AND status IN ('APPROVED', 'PENDING') AND id != ?\`,
      [roomId, tanggal, id]
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
          message: \`Slot waktu bentrok! Ada rapat jam \${b.jam_mulai}-\${b.jam_selesai}. Dibutuhkan jeda persiapan/buffer 30 menit.\` 
        });
      }
    }

    // Jika user biasa yang edit, kembalikan status ke PENDING jika sebelumnya APPROVED
    let newStatus = booking.status;
    let updateQuery = \`UPDATE bookings SET room_id = ?, tanggal = ?, jam_mulai = ?, jam_selesai = ?, agenda = ?, pemateri = ?, jumlah_peserta = ?, catatan = ?\`;
    let updateValues = [roomId, tanggal, jamMulai, jamSelesai, agenda, pemateri || null, jumlahPeserta, catatan || ''];

    if (role === 'USER') {
      newStatus = 'PENDING';
      updateQuery += \`, status = 'PENDING', approved_by = NULL, approved_at = NULL\`;
    }

    updateQuery += \` WHERE id = ?\`;
    updateValues.push(id);

    await connection.execute(updateQuery, updateValues);
    await connection.end();

    return res.json({ message: 'Pemesanan berhasil diperbarui!' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Terjadi kesalahan internal server saat mengedit booking.' });
  }
};

module.exports = { 
  createBooking, 
  getSchedule, 
  getMyHistory, 
  cancelBooking,
  getActiveRooms,
  getPublicSchedule,
  editBooking
};
========================================================= */