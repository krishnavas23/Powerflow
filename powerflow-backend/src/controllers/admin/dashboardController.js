const User = require("../../models/User");
const Transaction = require("../../models/Transaction");
const MeterReading = require("../../models/MeterReading");
const EnergyListing = require("../../models/EnergyListing");

exports.getAdminDashboard = async (req, res) => {
  try {
    // 🧮 1️⃣ Total Users
    const totalUsers = await User.countDocuments();

    // ⚡ 2️⃣ Active Energy — sum of last cumulativeKWh readings
    const latestReadings = await MeterReading.aggregate([
      { $sort: { meterId: 1, timestamp: -1 } },
      {
        $group: {
          _id: "$meterId",
          latestReading: { $first: "$cumulativeKWh" },
        },
      },
      {
        $group: {
          _id: null,
          totalEnergy: { $sum: "$latestReading" },
        },
      },
    ]);
    const activeEnergy = latestReadings[0]?.totalEnergy || 0;

    // 💰 3️⃣ Total Revenue — sum of all completed transaction amounts
    const totalRevenueAgg = await Transaction.aggregate([
      { $match: { status: "COMPLETED" } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ]);
    const totalRevenue = totalRevenueAgg[0]?.total || 0;

    // 📈 4️⃣ Today's Volume — total number of transactions today
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const todayVolume = await Transaction.countDocuments({
      createdAt: { $gte: startOfDay },
    });

    // 📊 5️⃣ 7-day revenue trend
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    const revenueTrend = await Transaction.aggregate([
      {
        $match: {
          createdAt: { $gte: sevenDaysAgo },
          status: "COMPLETED",
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          total: { $sum: "$totalAmount" },
        },
      },
      { $sort: { "_id": 1 } },
    ]);

    // 🔌 6️⃣ Energy Demand — Active (EnergyListing) vs Reserved (Transactions)
    const activeEnergyListings = await EnergyListing.aggregate([
      { $match: { status: "ACTIVE" } },
      {
        $group: {
          _id: null,
          totalActiveKWh: { $sum: "$kwhAvailable" },
        },
      },
    ]);

    const tradedEnergy = await Transaction.aggregate([
      { $match: { status: "COMPLETED" } },
      {
        $group: {
          _id: null,
          totalTradedKWh: { $sum: "$kwh" },
        },
      },
    ]);

    const energyDemand = {
      active: activeEnergyListings[0]?.totalActiveKWh || 0,
      reserved: tradedEnergy[0]?.totalTradedKWh || 0,
    };

    // 🕒 7️⃣ Recent Activity — latest 4 transactions with user and amounts
    const recentTxns = await Transaction.find()
      .sort({ createdAt: -1 })
      .limit(4)
      .populate({ path: 'buyer', select: 'name email' })
      .populate({ path: 'seller', select: 'name email' })
      .select('type totalAmount status createdAt buyer seller');

    const recentActivity = recentTxns.map(t => ({
      id: t._id,
      user: (t.buyer?.name || t.seller?.name || 'System'),
      action: t.type,
      amount: t.totalAmount,
      status: t.status,
      createdAt: t.createdAt,
    }));

    // 🚨 8️⃣ System Alerts — dynamic logic
    const alerts = [];
    if ((activeEnergyListings[0]?.totalActiveKWh || 0) < 100)
      alerts.push({
        type: "warning",
        message: "Energy Pool Running Low",
      });
    if (todayVolume > 1000)
      alerts.push({
        type: "info",
        message: "High Transaction Volume",
      });
    alerts.push({
      type: "success",
      message: "System Performance Good",
    });

    res.json({
      totalUsers,
      activeEnergy: activeEnergy.toFixed(2),
      totalRevenue: totalRevenue.toFixed(2),
      todayVolume,
      revenueTrend,
      energyDemand,
      recentActivity,
      alerts,
    });
  } catch (err) {
    console.error("Admin dashboard error:", err);
    res.status(500).json({ error: "Server error", details: err.message });
  }
};
