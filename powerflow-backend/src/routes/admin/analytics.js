const express = require('express');
const router = express.Router();
const { getAnalyticsOverview } = require('../../controllers/admin/analyticsController');
const protectAdmin = require('../../middleware/requireAdmin');
const auth = require('../../middleware/auth');

router.get('/overview', auth, getAnalyticsOverview);
// Friendly base path as requested
router.get('/', auth, getAnalyticsOverview);

module.exports = router;
