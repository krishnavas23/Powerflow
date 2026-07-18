const User = require('../../models/User');
const Transaction = require('../../models/Transaction');
const EnergyListing = require('../../models/EnergyListing');
const Wallet = require('../../models/Wallet');
const mongoose = require('mongoose');

exports.getAnalyticsOverview = async (req, res) => {
  try {
    // === 1. Total Users ===
    const totalUsers = await User.countDocuments();

    // === 2. Active Users (logged in or had transaction in last 30 days) ===
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const activeUsers = await Transaction.distinct('buyer', {
      createdAt: { $gte: thirtyDaysAgo },
    });

    // === 3. Total Transactions ===
    const totalTransactions = await Transaction.countDocuments();

    // === 4. Platform Revenue ===
    const platformRevenueAgg = await Transaction.aggregate([
      { $match: { status: 'COMPLETED', type: { $in: ['TRADE', 'RECHARGE'] } } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]);
    const platformRevenue = platformRevenueAgg[0]?.total || 0;

    // === 5. Monthly Revenue Trend (past 6 months) ===
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const revenueTrend = await Transaction.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo }, status: 'COMPLETED' } },
      {
        $group: {
          _id: { month: { $month: '$createdAt' }, year: { $year: '$createdAt' } },
          totalRevenue: { $sum: '$totalAmount' },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    // === 6. Energy Trading by Source (6 months) ===
    const energyTradingBySource = await EnergyListing.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: '$source',
          totalKwh: { $sum: '$kwhAvailable' },
        },
      },
      { $sort: { totalKwh: -1 } },
    ]);

    // === 7. Energy Holding by Source ===
    const energyHoldingBySource = await EnergyListing.aggregate([
      { $match: { status: 'ACTIVE' } },
      {
        $group: {
          _id: '$source',
          totalKwh: { $sum: '$kwhAvailable' },
        },
      },
    ]);

    // === 8. 24-Hour User Activity ===
    const userActivity = await Transaction.aggregate([
      {
        $group: {
          _id: { hour: { $hour: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.hour': 1 } },
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        activeUsers: activeUsers.length,
        totalTransactions,
        platformRevenue,
        revenueTrend,
        energyTradingBySource,
        energyHoldingBySource,
        userActivity,
      },
    });
  } catch (error) {
    console.error('Analytics Error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};
