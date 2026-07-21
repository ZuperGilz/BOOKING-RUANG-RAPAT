const mysql = require('mysql2/promise');
const dbConfig = require('../config/db');

const protectDevice = async (req, res, next) => {
  let token = req.headers['x-device-token'];
  let deviceUuid = req.headers['x-device-uuid']; // Membaca UUID unik dari tablet

  if (!token) {
    return res.status(401).json({ message: 'Akses ditolak, token device tidak ditemukan.' });
  }

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
      return res.status(401).json({ message: 'Token device tidak valid atau sudah dinonaktifkan.' });
    }

    const device = rows[0];
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip;

    // 🔒 KUNCI MUTLAK: Jika device sudah aktif dan UUID yang mengirim request berbeda, TOLAK!
    if (device.activated_at && device.device_uuid && device.device_uuid !== deviceUuid) {
      await connection.end();
      return res.status(403).json({ 
        message: 'Akses Ditolak! Perangkat tidak dikenali. Token ini telah dikunci untuk tablet lain.' 
      });
    }

    // Jika lolos atau registrasi pertama kali
    if (!device.activated_at) {
      // Jika tablet pertama tidak mengirim UUID, kita buatkan default fallback tapi idealnya wajib dikirim dari frontend
      const finalUuid = deviceUuid || 'UNKNOWN_FRONTEND_UUID';
      
      await connection.execute(
        'UPDATE device_tokens SET activated_at = NOW(), last_seen_at = NOW(), last_ip = ?, device_uuid = ? WHERE id = ?',
        [clientIp, finalUuid, device.id]
      );
      device.activated_at = new Date();
      device.device_uuid = finalUuid;
    } else {
      await connection.execute(
        'UPDATE device_tokens SET last_seen_at = NOW(), last_ip = ? WHERE id = ?',
        [clientIp, device.id]
      );
    }

    await connection.end();
    req.device = device; 
    next();
  } catch (error) {
    console.error("Device Auth Error:", error);
    return res.status(500).json({ message: 'Terjadi kesalahan saat memvalidasi device token.' });
  }
};

module.exports = { protectDevice };