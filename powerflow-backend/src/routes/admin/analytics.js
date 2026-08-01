const express = require('express');
const router = express.Router();
const {
  getAnalyticsOverview,
  emailAnalyticsReport,
} = require('../../controllers/admin/analyticsController');
const requireAdmin = require('../../middleware/requireAdmin');
const auth = require('../../middleware/auth');

router.get('/overview', auth, requireAdmin, getAnalyticsOverview);
router.get('/', auth, requireAdmin, getAnalyticsOverview);
router.post('/email-report', auth, requireAdmin, emailAnalyticsReport);

module.exports = router;
