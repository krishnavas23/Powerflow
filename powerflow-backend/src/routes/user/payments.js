const express = require('express');
const router = express.Router();
const { getTransactionBySession, getReceiptPdfBySession, getTradeReceiptPdf } = require('../../controllers/user/paymentsController');

// Fetch a transaction by Stripe session id
router.get('/tx/session/:sessionId', getTransactionBySession);

// Download receipt by Stripe session id
router.get('/receipt/session/:sessionId.pdf', getReceiptPdfBySession);

module.exports = router;

// Trade receipt by transaction id
router.get('/receipt/transaction/:txId.pdf', getTradeReceiptPdf);


