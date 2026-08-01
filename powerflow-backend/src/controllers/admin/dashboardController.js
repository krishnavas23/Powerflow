const User = require("../../models/User");
const Transaction = require("../../models/Transaction");
const EnergyListing = require("../../models/EnergyListing");
const Profile = require("../../models/Profile");

function pctChange(current, previous) {
  if (!previous) return current > 0 ? 100 : 0;
  return Number((((current - previous) / previous) * 100).toFixed(1));
}

exports.getAdminDashboard = async (req, res) => {
  try {
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    const fourteenDaysAgo = new Date(now);
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 13);
    const yesterday = new Date(startOfDay);
    yesterday.setDate(yesterday.getDate() - 1);

    const totalUsers = await User.countDocuments();
    const usersLast7 = await User.countDocuments({ createdAt: { $gte: sevenDaysAgo } });
    const usersPrev7 = await User.countDocuments({
      createdAt: { $gte: fourteenDaysAgo, $lt: sevenDaysAgo },
    });

    const totalRevenueAgg = await Transaction.aggregate([
      {
        $match: {
          status: "COMPLETED",
          type: { $in: ["TRADE", "RECHARGE"] },
        },
      },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ]);
    const totalRevenue = totalRevenueAgg[0]?.total || 0;

    const revLast7Agg = await Transaction.aggregate([
      {
        $match: {
          status: "COMPLETED",
          type: { $in: ["TRADE", "RECHARGE"] },
          createdAt: { $gte: sevenDaysAgo },
        },
      },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ]);
    const revPrev7Agg = await Transaction.aggregate([
      {
        $match: {
          status: "COMPLETED",
          type: { $in: ["TRADE", "RECHARGE"] },
          createdAt: { $gte: fourteenDaysAgo, $lt: sevenDaysAgo },
        },
      },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ]);
    const revLast7 = revLast7Agg[0]?.total || 0;
    const revPrev7 = revPrev7Agg[0]?.total || 0;

    const todayVolume = await Transaction.countDocuments({
      createdAt: { $gte: startOfDay },
    });
    const yesterdayVolume = await Transaction.countDocuments({
      createdAt: { $gte: yesterday, $lt: startOfDay },
    });

    let revenueTrend = await Transaction.aggregate([
      {
        $match: {
          createdAt: { $gte: sevenDaysAgo },
          status: "COMPLETED",
          type: { $in: ["TRADE", "RECHARGE"] },
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
      { $sort: { _id: 1 } },
    ]);

    // If no completed revenue in last 7 days, fall back to last 30 days
    if (!revenueTrend.length) {
      const thirtyDaysAgo = new Date(now);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
      revenueTrend = await Transaction.aggregate([
        {
          $match: {
            createdAt: { $gte: thirtyDaysAgo },
            status: "COMPLETED",
            type: { $in: ["TRADE", "RECHARGE"] },
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
        { $sort: { _id: 1 } },
      ]);
    }

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
    // Active Energy KPI = marketplace pool (ACTIVE listings), not fake meter ticks
    const activeEnergy = energyDemand.active;

    // Prefer recent activity with non-zero amounts when available
    const recentTxns = await Transaction.find()
      .sort({ createdAt: -1 })
      .limit(20)
      .populate({ path: "buyer", select: "name email" })
      .populate({ path: "seller", select: "name email" })
      .select("type totalAmount status createdAt buyer seller");

    const recentActivity = recentTxns
      .filter((t) => Number(t.totalAmount || 0) > 0 || t.type === "DONATION" || t.type === "TRADE")
      .slice(0, 4)
      .map((t) => ({
        id: t._id,
        user: t.buyer?.name || t.seller?.name || "System",
        action: t.type,
        amount: t.totalAmount,
        status: t.status,
        createdAt: t.createdAt,
      }));

    const kycPending = await Profile.countDocuments({ kycStatus: "pending" });
    const failedToday = await Transaction.countDocuments({
      status: "FAILED",
      createdAt: { $gte: startOfDay },
    });

    const alerts = [];
    if ((activeEnergyListings[0]?.totalActiveKWh || 0) < 100) {
      alerts.push({
        type: "warning",
        message: "Energy Pool Running Low",
        description: "Active listed energy is below 100 kWh. Consider reviewing supply.",
      });
    }
    if (kycPending > 0) {
      alerts.push({
        type: "warning",
        message: "KYC backlog",
        description: `${kycPending} profile(s) awaiting verification.`,
      });
    }
    if (failedToday > 0) {
      alerts.push({
        type: "info",
        message: "Failed transactions today",
        description: `${failedToday} failed transaction(s) recorded today.`,
      });
    }
    if (todayVolume > 1000) {
      alerts.push({
        type: "info",
        message: "High Transaction Volume",
        description: "Today's volume exceeded 1000 transactions.",
      });
    }
    if (!alerts.length) {
      alerts.push({
        type: "success",
        message: "System Performance Good",
        description: "No critical operational issues detected.",
      });
    }

    res.json({
      totalUsers,
      activeEnergy: Number(activeEnergy).toFixed(2),
      totalRevenue: Number(totalRevenue).toFixed(2),
      todayVolume,
      revenueTrend,
      energyDemand,
      recentActivity,
      alerts,
      changes: {
        totalUsers: pctChange(usersLast7, usersPrev7),
        totalRevenue: pctChange(revLast7, revPrev7),
        todayVolume: pctChange(todayVolume, yesterdayVolume),
        activeEnergy: pctChange(energyDemand.active, energyDemand.reserved || 1),
      },
    });
  } catch (err) {
    console.error("Admin dashboard error:", err);
    res.status(500).json({ error: "Server error", details: err.message });
  }
};
