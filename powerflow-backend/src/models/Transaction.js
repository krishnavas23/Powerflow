const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: [
      'TRADE',          // Energy trade between users
      'RECHARGE',       // Stripe recharge (real INR top-up)
      'INTERNAL_TOPUP', // Manual/admin top-up
      'WITHDRAW',       // INR withdrawal
      'REDEEM_CREDITS', // Convert EC to INR
      'DONATION',       // Donated energy
      'UPLOAD_ENERGY',  // Energy upload by producer
    ],
    required: true,
  },

  buyer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },

  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },

  // ✅ NEW: beneficiary field for donated energy
  beneficiary: {
    type: String,
    default: null,
  },

  kwh: {
    type: Number,
    default: 0,
    min: 0,
  },

  totalAmount: {
    type: Number,
    required: true,
    min: 0,
  },

  status: {
    type: String,
    enum: ['PENDING', 'COMPLETED', 'FAILED'],
    default: 'COMPLETED',
  },

  externalRefId: {
    type: String, // Stripe PaymentIntent ID or Session ID
    default: null,
  },
}, { timestamps: true });

module.exports =
  mongoose.models.Transaction || mongoose.model('Transaction', TransactionSchema);
