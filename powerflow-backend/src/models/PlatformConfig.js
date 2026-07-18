const mongoose = require('mongoose');

const platformConfigSchema = new mongoose.Schema({
  // 🔹 Pricing Configuration
  pricing: {
    basePricePerKwh: { type: Number, default: 7.5 },
    minPricePerKwh: { type: Number, default: 3 },
    maxPricePerKwh: { type: Number, default: 15 },
    platformCommission: { type: Number, default: 2.5 }, // in %
  },

  // 🔹 Transaction Limits
  transactionLimits: {
    minWalletTopup: { type: Number, default: 50 },
    maxWalletTopup: { type: Number, default: 10000 },
    maxDailyTransactions: { type: Number, default: 20 },
    maxDailyTransferAmount: { type: Number, default: 20000 },
  },

  // 🔹 Credits and Rewards
  creditsAndRewards: {
    minCreditsToRedeem: { type: Number, default: 100 },
    creditConversionRate: { type: Number, default: 0.9 },
    signupBonusCredits: { type: Number, default: 50 },
    referralRewardRate: { type: Number, default: 5 }, // %
  },

  // 🔹 Fee Structure
  fees: {
    walletWithdrawalFee: { type: Number, default: 1.5 },
    transferFee: { type: Number, default: 1 },
    instantTransferFee: { type: Number, default: 2 },
    reversalFee: { type: Number, default: 3 },
  },

  // 🔹 Business Hours & Maintenance
  operationalHours: {
    businessHoursStart: { type: String, default: '09:00' },
    businessHoursEnd: { type: String, default: '21:00' },
    maintenanceWindowStart: { type: String, default: '02:00' },
    maintenanceWindowEnd: { type: String, default: '04:00' },
  },
}, { timestamps: true });

module.exports = mongoose.models.PlatformConfig || mongoose.model('PlatformConfig', platformConfigSchema);
