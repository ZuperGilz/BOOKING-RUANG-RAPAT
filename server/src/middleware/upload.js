const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Cek apakah kredensial Cloudinary tersedia di .env
const useCloudinary = process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY;

let storage;

if (useCloudinary) {
  // ==========================================
  // 1. OPSI CLOUD (VERCEL / PRODUCTION)
  // ==========================================
  const cloudinary = require('cloudinary').v2;
  const { CloudinaryStorage } = require('multer-storage-cloudinary');

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: 'kiosk-media',
      resource_type: 'auto', // Mendukung otomatis image & video
    },
  });
} else {
  // ==========================================
  // 2. OPSI LOKAL (DISK STORAGE / MYSQL)
  // ==========================================
  const uploadDir = path.join(__dirname, '../../uploads');

  // Buat folder uploads jika belum ada di sistem lokal
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, 'media-' + uniqueSuffix + path.extname(file.originalname));
    },
  });
}

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