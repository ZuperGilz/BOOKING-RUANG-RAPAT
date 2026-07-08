const adminOnly = (req, res, next) => {
  // Pastikan user ada dan memiliki role ADMIN
  if (req.user && req.user.role === 'ADMIN') {
    next(); // Lolos, boleh lanjut ke fungsi controller admin
  } else {
    return res.status(403).json({ message: 'Akses ditolak, khusus untuk Administrator.' });
  }
};

module.exports = { adminOnly };