const asyncHandler = require('express-async-handler');
const EnergyListing = require('../../models/EnergyListing');
const User = require('../../models/User');
const Transaction = require('../../models/Transaction');

// 🧭 Dashboard Overview Controller
exports.getDashboardOverview = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // Fetch global metrics
  const [availableEnergyAgg, activeHomes, poolLiquidityAgg] = await Promise.all([
    EnergyListing.aggregate([
      { $match: { status: 'ACTIVE' } },
      { $group: { _id: null, totalKwh: { $sum: '$kwhAvailable' } } }
    ]),
    User.countDocuments(),
    // Sum canonical wallet balance across users
    User.aggregate([
      { $group: { _id: null, totalINR: { $sum: '$walletBalance' } } }
    ])
  ]);

  const availableEnergy = availableEnergyAgg[0]?.totalKwh || 0;
  const poolLiquidity = poolLiquidityAgg[0]?.totalINR || 0;

  // Fetch user-specific data
  // Use canonical fields from User model
  const user = await User.findById(userId).select('walletBalance energyCredits');
  const myListingsAgg = await EnergyListing.aggregate([
    { $match: { seller: userId, status: 'ACTIVE' } },
    { $group: { _id: null, totalKwh: { $sum: '$kwhAvailable' } } }
  ]);

  const myListingsEnergy = myListingsAgg[0]?.totalKwh || 0;

  const recentTransactions = await Transaction.find({
    $or: [{ buyer: userId }, { seller: userId }]
  })
    .sort({ createdAt: -1 })
    .limit(5)
    .select('type kwh totalAmount status createdAt');

  res.status(200).json({
    success: true,
    data: {
      global: {
        availableEnergy: availableEnergy.toFixed(2), // in kWh or GWh (frontend can convert)
        activeHomes,
        poolLiquidity: poolLiquidity.toFixed(2)
      },
      user: {
        // Keep response shape stable for frontend: map walletBalance -> walletINR
        walletINR: user.walletBalance || 0,
        energyCredits: user.energyCredits || 0,
        listingsEnergy: myListingsEnergy.toFixed(2),
        recentTransactions
      }
    }
  });
});
