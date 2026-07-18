const EnergyListing = require('../models/EnergyListing');
const User = require('../models/User');
const Transaction = require('../models/Transaction');

/**
 * Calculate dynamic daily buying limit for a user
 * @param {Object} user - User object with accountType
 * @returns {Promise<Object>} - { dailyLimit, remainingToday, usedToday }
 */
async function calculateBuyingLimit(user) {
  // Get total energy pool (sum of all active listings)
  const poolAggregate = await EnergyListing.aggregate([
    { $match: { status: 'ACTIVE', kwhAvailable: { $gt: 0 } } },
    { $group: { _id: null, totalKwh: { $sum: '$kwhAvailable' } } }
  ]);
  const totalEnergyPool = poolAggregate[0]?.totalKwh || 0;

  // Get total number of active users (buyers)
  const totalUsers = await User.countDocuments({ role: 'Buyer' });

  // Base limit calculation: pool / users, but ensure minimum and maximum bounds
  // Minimum: 1 kWh per user, Maximum: 10% of total pool per user
  const baseLimit = totalUsers > 0 ? totalEnergyPool / totalUsers : 0;
  const minLimit = 1; // Minimum 1 kWh per day
  const maxLimit = Math.max(minLimit, totalEnergyPool * 0.1); // Max 10% of pool

  let dailyLimit = Math.max(minLimit, Math.min(maxLimit, baseLimit));

  // Adjust based on account type
  const accountType = user.accountType || 'Individual';
  if (accountType === 'Company' || accountType === 'NGO' || accountType === 'Hospital') {
    // Organizations get 2x the individual limit
    dailyLimit = dailyLimit * 2;
  } else {
    // Individual accounts get the base limit
    dailyLimit = Math.round(dailyLimit * 100) / 100; // Round to 2 decimals
  }

  // Get today's purchases for this user
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const mongoose = require('mongoose');
  const userId = mongoose.Types.ObjectId.isValid(user._id) 
    ? new mongoose.Types.ObjectId(user._id) 
    : user._id;

  const todayPurchases = await Transaction.aggregate([
    {
      $match: {
        buyer: userId,
        type: 'TRADE',
        status: 'COMPLETED',
        createdAt: { $gte: today, $lt: tomorrow }
      }
    },
    {
      $group: {
        _id: null,
        totalKwh: { $sum: '$kwh' }
      }
    }
  ]);

  const usedToday = todayPurchases[0]?.totalKwh || 0;
  const remainingToday = Math.max(0, dailyLimit - usedToday);

  return {
    dailyLimit: Math.round(dailyLimit * 100) / 100,
    usedToday: Math.round(usedToday * 100) / 100,
    remainingToday: Math.round(remainingToday * 100) / 100,
    totalEnergyPool: Math.round(totalEnergyPool * 100) / 100,
    totalUsers
  };
}

/**
 * Check if a purchase would exceed the daily limit
 * @param {Object} user - User object
 * @param {number} quantity - Quantity to purchase
 * @returns {Promise<{allowed: boolean, limit: Object, error?: string}>}
 */
async function checkBuyingLimit(user, quantity) {
  const limit = await calculateBuyingLimit(user);
  
  const wouldExceed = (limit.usedToday + quantity) > limit.dailyLimit;
  
  if (wouldExceed) {
    return {
      allowed: false,
      limit,
      error: `Daily buying limit exceeded. You can buy ${limit.remainingToday.toFixed(2)} kWh more today (Limit: ${limit.dailyLimit.toFixed(2)} kWh/day)`
    };
  }

  return {
    allowed: true,
    limit
  };
}

module.exports = {
  calculateBuyingLimit,
  checkBuyingLimit
};

