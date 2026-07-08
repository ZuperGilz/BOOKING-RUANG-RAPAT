const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth.routes');
const bookingRoutes = require('./routes/booking.routes');
const adminRoutes = require('./routes/admin.routes');
const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/admin', adminRoutes);

const deviceRoutes = require('./routes/device.routes');
app.use('/api/kiosk', deviceRoutes.kioskRoutes);

// Base route check
app.get('/', (req, res) => {
  res.json({ message: 'Sistem Booking Ruang Rapat Semen Padang API Active 🚀' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server berjalan lokal di http://localhost:${PORT}`);
});