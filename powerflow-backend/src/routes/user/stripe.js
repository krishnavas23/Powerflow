const express = require('express');
const router = express.Router();
const { createCheckoutSession, stripeWebhook, reconcileCheckoutSession } = require('../../controllers/user/stripeController');
const auth = require('../../middleware/auth');
const bodyParser = require('body-parser');

// 1) Stripe needs raw body for signature verification (MUST run before json())
router.post('/webhook', bodyParser.raw({ type: 'application/json' }), stripeWebhook);

// 2) Parse JSON for the rest of the routes under /api/stripe
router.use(express.json());

// 3) Create Checkout Session expects JSON body
router.post('/create-checkout-session', auth, createCheckoutSession);

// 4) Public reconciliation endpoint called from success page (idempotent)
router.post('/reconcile/:sessionId', reconcileCheckoutSession);

module.exports = router;
