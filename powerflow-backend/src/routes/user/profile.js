const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const {
  getProfile,
  updateProfile,
  uploadKyc,
} = require('../../controllers/user/profileController');

// Profile endpoints
router.get('/', auth, getProfile);
router.put('/', auth, updateProfile);

// KYC upload (JSON base64 payload)
router.post('/kyc', auth, uploadKyc);

module.exports = router;
