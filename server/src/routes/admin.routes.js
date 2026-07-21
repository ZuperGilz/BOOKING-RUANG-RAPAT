const express = require('express');
const router = express.Router();
const { 
  getPendingBookings, getAllBookings, approveBooking, rejectBooking,
  getAllUsers, createUser, toggleUserStatus, resetUserPassword,
  toggleRoomStatus, getAllRooms, updateUser,
  createRoom, updateRoom, deleteRoom
} = require('../controllers/admin.controller');

const { protect } = require('../middleware/auth');
const { adminOnly } = require('../middleware/admin');
const deviceRoutes = require('./device.routes');
const upload = require('../middleware/upload');
const kioskMediaController = require('../controllers/kioskMedia.controller');

// Semua Endpoint di bawah ini wajib melintasi Auth Guard & Admin Guard
router.use(protect, adminOnly);

// Routing Manajemen Kiosk Media
router.get('/kiosk-media', kioskMediaController.getAllMedia);
router.post('/kiosk-media', upload.single('file'), kioskMediaController.createMedia);
router.put('/kiosk-media/:id', kioskMediaController.updateMedia);
router.delete('/kiosk-media/:id', kioskMediaController.deleteMedia);

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
router.post('/rooms', createRoom);
router.put('/rooms/:id', updateRoom);
router.delete('/rooms/:id', deleteRoom);
router.put('/rooms/:id/status', toggleRoomStatus);

module.exports = router;