const mysql = require('mysql2/promise');
const dbConfig = require('../config/db');

const protectDevice = async (req, res, next) => {
  let token = req.headers['x-device-token'];

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

    // Update lastSeenAt dan lastIp
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip;
    await connection.execute(
      'UPDATE device_tokens SET last_seen_at = NOW(), last_ip = ? WHERE id = ?',
      [clientIp, rows[0].id]
    );

    await connection.end();

    // Inject info device/room ke req
    req.device = rows[0]; 
    next();
  } catch (error) {
    console.error("Device Auth Error:", error);
    return res.status(500).json({ message: 'Terjadi kesalahan saat memvalidasi device token.' });
  }
};

module.exports = { protectDevice };
