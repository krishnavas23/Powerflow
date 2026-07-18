const express = require('express');
const router = express.Router();
const { getPlatformConfig, updatePlatformConfig } = require('../../controllers/admin/platformConfigController');

// Optionally: add admin auth middleware here
// const { adminAuth } = require('../../middleware/adminAuth');

router.get('/', /*adminAuth,*/ getPlatformConfig);
router.put('/', /*adminAuth,*/ updatePlatformConfig);

module.exports = router;
