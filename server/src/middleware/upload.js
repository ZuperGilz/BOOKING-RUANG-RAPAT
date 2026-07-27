const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Semua file upload masuk sementara ke folder temp lokal dulu,
// baru dikirim ke FTP Hostinger dari controller, lalu dihapus dari lokal.
const tempDir = path.join(__dirname, '../../tmp-uploads');

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