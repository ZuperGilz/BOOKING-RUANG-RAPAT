const express = require('express');
const router = express.Router();
const { createBooking, getSchedule, getMyHistory, cancelBooking, getActiveRooms, getPublicSchedule, editBooking } = require('../controllers/booking.controller');
const { protect } = require('../middleware/auth');

// Public route (tanpa protect middleware)
router.get('/public/schedule', getPublicSchedule);

// Protected routes
router.post('/', protect, createBooking);
router.get('/rooms', protect, getActiveRooms);
router.get('/schedule', protect, getSchedule);
router.get('/my-history', protect, getMyHistory);
router.put('/:id', protect, editBooking);
router.put('/:id/cancel', protect, cancelBooking);

module.exports = router;