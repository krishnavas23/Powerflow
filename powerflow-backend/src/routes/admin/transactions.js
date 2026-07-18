const express = require('express');
const router = express.Router();
const protectAdmin = require('../../middleware/requireAdmin');
const auth = require('../../middleware/auth');
const {
  getTransactionStats,
  getAllTransactions,
  exportTransactions,
} = require('../../controllers/admin/transactionController');

// Dashboard stats
router.get('/stats', auth, getTransactionStats);

// All transactions (list + filters)
router.get('/', auth, getAllTransactions);

// Export CSV
router.get('/export', auth, exportTransactions);

module.exports = router;
