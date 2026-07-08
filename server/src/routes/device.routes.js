const express = require('express');
const deviceController = require('../controllers/device.controller');
const { protectDevice } = require('../middleware/deviceAuth');

const adminRoutes = express.Router();
const kioskRoutes = express.Router();

// ADMIN ROUTES (di-mount ke /api/admin/devices)
// Middleware auth/admin.js akan diaplikasikan di app.js atau admin.routes.js
adminRoutes.post('/generate', deviceController.generateToken);
adminRoutes.get('/', deviceController.getDevices);
adminRoutes.put('/:id/revoke', deviceController.revokeDevice);
adminRoutes.put('/:id/activate', deviceController.activateDevice);
adminRoutes.delete('/:id', deviceController.deleteDevice);

// KIOSK ROUTES (di-mount ke /api/kiosk)
// Public (tanpa token)
kioskRoutes.post('/activate', deviceController.activateKiosk);

// Protected by device token
kioskRoutes.get('/schedule', protectDevice, deviceController.getKioskSchedule);
kioskRoutes.get('/upcoming', protectDevice, deviceController.getKioskUpcoming);
kioskRoutes.get('/room-info', protectDevice, deviceController.getRoomInfo);
kioskRoutes.post('/heartbeat', protectDevice, deviceController.heartbeat);
kioskRoutes.post('/booking', protectDevice, deviceController.createKioskBooking);
kioskRoutes.get('/calendar', protectDevice, deviceController.getKioskCalendar);
kioskRoutes.get('/rooms', protectDevice, deviceController.getKioskRooms);

module.exports = {
  adminRoutes,
  kioskRoutes
};
