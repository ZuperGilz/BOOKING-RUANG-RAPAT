const express = require('express');
const router = express.Router();
const { login, changePassword, getMe } = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth');

router.post('/login', login);
router.post('/change-password', protect, changePassword);
router.get('/me', protect, getMe);

module.exports = router;