const express = require('express');
const router = express.Router();
const { getDashboardOverview } = require('../../controllers/user/dashboardController');
const auth = require('../../middleware/auth');

router.get('/overview', auth, getDashboardOverview);

module.exports = router;
