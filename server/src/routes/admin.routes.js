const express = require('express');
const router = express.Router();
const { 
  getPendingBookings, getAllBookings, approveBooking, rejectBooking,
  getAllUsers, createUser, toggleUserStatus, resetUserPassword,
  toggleRoomStatus, getAllRooms, updateUser
} = require('../controllers/admin.controller');

const { protect } = require('../middleware/auth');
const { adminOnly } = require('../middleware/admin');
const deviceRoutes = require('./device.routes');

// Semua Endpoint di bawah ini wajib melintasi Auth Guard & Admin Guard
router.use(protect, adminOnly);

// Device / Tablet Management
router.use('/devices', deviceRoutes.adminRoutes);

// Routing Approval Booking
router.get('/bookings/pending', getPendingBookings);
router.get('/bookings/all', getAllBookings);
router.put('/bookings/:id/approve', approveBooking);
router.put('/bookings/:id/reject', rejectBooking);

// Routing Manajemen Karyawan
router.get('/users', getAllUsers);
router.post('/users', createUser);
router.put('/users/:id', updateUser);
router.put('/users/:id/status', toggleUserStatus);
router.put('/users/:id/reset-password', resetUserPassword);

// Routing Manajemen Ruangan
router.get('/rooms', getAllRooms);
router.put('/rooms/:id/status', toggleRoomStatus);

module.exports = router;