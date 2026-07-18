const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const protectAdmin = require('../../middleware/requireAdmin');
const { getAdminProfile, updateAdminProfile } = require('../../controllers/admin/profileController');

// GET /api/admin/profile
// Allow any authenticated user to fetch their profile details for prefill
router.get('/', auth, getAdminProfile);

// PUT /api/admin/profile
router.put('/', auth, protectAdmin, updateAdminProfile);

module.exports = router;
