const express = require('express');
const cors = require('cors');

const authRoutes = require('../src/routes/auth.routes');
const bookingRoutes = require('../src/routes/booking.routes');
const adminRoutes = require('../src/routes/admin.routes');
const deviceRoutes = require('../src/routes/device.routes');

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/kiosk', deviceRoutes.kioskRoutes);

// Base route check
app.get('/api', (req, res) => {
  res.json({ message: 'Sistem Booking Ruang Rapat Semen Padang API Active (Vercel Serverless) 🚀' });
});

// Export aplikasi (TANPA app.listen) untuk Vercel Serverless
module.exports = app;
