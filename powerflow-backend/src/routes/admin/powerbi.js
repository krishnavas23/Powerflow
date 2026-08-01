const express = require('express');
const router = express.Router();
const powerbiAuth = require('../../middleware/powerbiAuth');
const {
  getCatalog,
  getKpis,
  getTransactionsFact,
  getRevenueDaily,
  getRevenueMonthly,
  getEnergyBySource,
  getUserActivityHourly,
  getMeterDaily,
  getVerificationSummary,
} = require('../../controllers/admin/powerbiController');

router.use(powerbiAuth);

router.get('/', getCatalog);
router.get('/kpis', getKpis);
router.get('/transactions', getTransactionsFact);
router.get('/revenue-daily', getRevenueDaily);
router.get('/revenue-monthly', getRevenueMonthly);
router.get('/energy-by-source', getEnergyBySource);
router.get('/user-activity-hourly', getUserActivityHourly);
router.get('/meter-daily', getMeterDaily);
router.get('/verification-summary', getVerificationSummary);

module.exports = router;
