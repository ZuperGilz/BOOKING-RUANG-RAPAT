const multer = require('multer');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Semua file upload masuk sementara ke folder temp dulu,
// baru dikirim ke FTP Hostinger dari controller, lalu dihapus dari lokal.
//
// PENTING: di Vercel (serverless), filesystem project bersifat read-only
// saat runtime. Satu-satunya folder yang boleh ditulis adalah os.tmpdir()
// (biasanya '/tmp'). Folder ini bersifat sementara/ephemeral — bisa hilang
// kapan saja saat function instance di-recycle — tapi itu sudah cocok
// dengan alur kita karena file memang langsung dihapus setelah dikirim ke FTP.
const tempDir = path.join(os.tmpdir(), 'tmp-uploads');

if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, tempDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'media-' + uniqueSuffix + path.extname(file.originalname));
  },
});

// Filter file (Image & Video)
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
    cb(null, true);
  } else {
    cb(new Error('Hanya file gambar dan video yang diperbolehkan!'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max file size
  },
  fileFilter: fileFilter,
});

module.exports = upload;