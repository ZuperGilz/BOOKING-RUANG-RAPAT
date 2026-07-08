const jwt = require('jsonwebtoken');

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    'super_secret_key_semen_padang_2026', // <-- Tulis langsung string-nya di sini
    { expiresIn: '24h' }
  );
};

module.exports = { generateToken };