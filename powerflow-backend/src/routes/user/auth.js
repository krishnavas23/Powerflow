const express = require('express');
const router = express.Router();
const { register, login, getProfile, forgotPassword, resetPassword } = require('../../controllers/user/authController');
const authMiddleware = require('../../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.get('/profile', authMiddleware, getProfile);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

module.exports = router;
