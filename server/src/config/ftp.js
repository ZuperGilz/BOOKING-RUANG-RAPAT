const ftp = require('basic-ftp');

const FTP_CONFIG = {
  host: process.env.FTP_HOST,
  user: process.env.FTP_USER,
  password: process.env.FTP_PASSWORD,
  secure: process.env.FTP_SECURE === 'true', // set 'true' kalau pakai FTPS
};

// Folder tujuan di server Hostinger, contoh: /public_html/uploads
const FTP_REMOTE_DIR = process.env.FTP_REMOTE_DIR || '/public_html/uploads';

// Base URL publik untuk akses file, contoh: https://domainkamu.com/uploads
const FTP_PUBLIC_URL = process.env.FTP_PUBLIC_URL;

if (!FTP_CONFIG.host || !FTP_CONFIG.user || !FTP_CONFIG.password) {
  console.warn('⚠️  Kredensial FTP Hostinger belum lengkap di .env (FTP_HOST/FTP_USER/FTP_PASSWORD)');
}
if (!FTP_PUBLIC_URL) {
  console.warn('⚠️  FTP_PUBLIC_URL belum diset di .env, URL file hasil upload akan salah');
}

/**
 * Upload file lokal ke server FTP Hostinger.
 * @param {string} localFilePath - path file di disk lokal (hasil multer)
 * @param {string} remoteFileName - nama file tujuan di server
 * @returns {Promise<string>} URL publik file yang sudah diupload
 */
async function uploadToFtp(localFilePath, remoteFileName) {
  const client = new ftp.Client();
  client.ftp.verbose = false;

  try {
    await client.access(FTP_CONFIG);
    await client.ensureDir(FTP_REMOTE_DIR);
    await client.uploadFrom(localFilePath, remoteFileName);
    return `${FTP_PUBLIC_URL}/${remoteFileName}`;
  } finally {
    client.close();
  }
}

/**
 * Hapus file di server FTP Hostinger.
 * @param {string} remoteFileName - nama file yang mau dihapus
 */
async function deleteFromFtp(remoteFileName) {
  const client = new ftp.Client();
  client.ftp.verbose = false;

  try {
    await client.access(FTP_CONFIG);
    await client.cd(FTP_REMOTE_DIR);
    await client.remove(remoteFileName);
  } catch (err) {
    // Jangan sampai proses delete media di DB gagal cuma gara-gara file FTP nggak ketemu
    console.error('FTP delete error:', err.message);
  } finally {
    client.close();
  }
}

/**
 * Ekstrak nama file dari URL publik, dipakai saat mau hapus file.
 */
function getFtpFileName(url) {
  if (!url || !FTP_PUBLIC_URL || !url.startsWith(FTP_PUBLIC_URL)) return null;
  return url.substring(FTP_PUBLIC_URL.length + 1); // +1 untuk buang slash di depan
}

module.exports = { uploadToFtp, deleteFromFtp, getFtpFileName };