const express = require('express');
const router = express.Router();
const {
    getSystemConfig,
    updateSystemConfig,
    performMaintenance
} = require('../../controllers/admin/systemConfigController');

// GET system config
router.get('/', getSystemConfig);

// PUT update system config
router.put('/', updateSystemConfig);

// POST perform maintenance task
router.post('/maintenance/:action', performMaintenance);

module.exports = router;
