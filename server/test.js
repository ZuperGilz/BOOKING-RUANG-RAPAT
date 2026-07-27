// // Jalankan dulu file ini SEBELUM npx prisma db seed
// // Tujuannya: memastikan koneksi ke database Hostinger bisa jalan
// // di luar Prisma. Kalau ini gagal dengan error yang sama, berarti
// // masalahnya di server/kredensial, bukan di kode seed.js kamu.

// const mariadb = require('mariadb');
// require('dotenv').config();

// const connectionString = process.env.DATABASE_URL;
// if (!connectionString) {
//   throw new Error("❌ DATABASE_URL tidak ditemukan di file .env!");
// }

// const dbUrl = new URL(connectionString.replace('mysql://', 'mariadb://'));

// async function testConnection() {
//   console.log('🔌 Mencoba konek ke:', dbUrl.hostname, 'port', dbUrl.port || 3306);

//   try {
//     const conn = await mariadb.createConnection({
//       host: dbUrl.hostname,
//       port: Number(dbUrl.port) || 3306,
//       user: decodeURIComponent(dbUrl.username),
//       password: decodeURIComponent(dbUrl.password),
//       database: dbUrl.pathname.replace('/', ''),
//       connectTimeout: 15000,
//     });

//     console.log('✅ Koneksi BERHASIL!');

//     const rows = await conn.query('SELECT VERSION() AS version');
//     console.log('   Versi server:', rows[0].version);

//     await conn.end();
//   } catch (err) {
//     console.error('❌ Koneksi GAGAL:', err.message);
//     if (err.cause) {
//       console.error('   Detail cause:', err.cause);
//     }
//     process.exit(1);
//   }
// }

// testConnection();

// Jalankan: node test-ftp.js
// Tujuan: memastikan koneksi FTP ke Hostinger jalan dan file
// bisa ke-upload + bisa diakses lewat FTP_PUBLIC_URL sebelum
// dipakai di alur upload sungguhan.

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { uploadToFtp, deleteFromFtp } = require('./src/config/ftp');

async function testFtp() {
  console.log('🔌 Mencoba konek FTP ke:', process.env.FTP_HOST);

  // Bikin file dummy kecil buat di-test
  const tempFile = path.join(__dirname, 'test-ftp-dummy.txt');
  fs.writeFileSync(tempFile, `Test upload FTP - ${new Date().toISOString()}`);

  const remoteFileName = 'test-ftp-dummy.txt';

  try {
    const url = await uploadToFtp(tempFile, remoteFileName);
    console.log('✅ Upload BERHASIL!');
    console.log('   URL publik:', url);
    console.log('   Coba buka URL itu di browser, pastikan isinya kebaca.');

    // Bersihkan: hapus file test dari server FTP lagi
    await deleteFromFtp(remoteFileName);
    console.log('🧹 File test sudah dihapus dari server FTP.');
  } catch (err) {
    console.error('❌ Upload GAGAL:', err.message);
  } finally {
    fs.unlinkSync(tempFile);
  }
}

testFtp();