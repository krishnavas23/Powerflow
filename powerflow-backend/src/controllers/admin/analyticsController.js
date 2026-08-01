const User = require('../../models/User');
const Transaction = require('../../models/Transaction');
const EnergyListing = require('../../models/EnergyListing');
const KycDocument = require('../../models/KycDocument');
const VerificationRequest = require('../../models/VerificationRequest');
const Profile = require('../../models/Profile');

function pctChange(current, previous) {
  if (!previous) return current > 0 ? 100 : 0;
  return Number((((current - previous) / previous) * 100).toFixed(1));
}

exports.getAnalyticsOverview = async (req, res) => {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const sixtyDaysAgo = new Date(now);
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
    const sixMonthsAgo = new Date(now);
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);

    const totalUsers = await User.countDocuments();
    const activeUserIds = await Transaction.distinct('buyer', {
      createdAt: { $gte: thirtyDaysAgo },
    });
    const prevActiveUserIds = await Transaction.distinct('buyer', {
      createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo },
    });

    const totalTransactions = await Transaction.countDocuments();
    const recentTxns = await Transaction.countDocuments({ createdAt: { $gte: thirtyDaysAgo } });
    const prevTxns = await Transaction.countDocuments({
      createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo },
    });

    const platformRevenueAgg = await Transaction.aggregate([
      { $match: { status: 'COMPLETED', type: { $in: ['TRADE', 'RECHARGE'] } } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]);
    const platformRevenue = platformRevenueAgg[0]?.total || 0;

    const recentRevenueAgg = await Transaction.aggregate([
      {
        $match: {
          status: 'COMPLETED',
          type: { $in: ['TRADE', 'RECHARGE'] },
          createdAt: { $gte: thirtyDaysAgo },
        },
      },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]);
    const prevRevenueAgg = await Transaction.aggregate([
      {
        $match: {
          status: 'COMPLETED',
          type: { $in: ['TRADE', 'RECHARGE'] },
          createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo },
        },
      },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]);
    const recentRevenue = recentRevenueAgg[0]?.total || 0;
    const prevRevenue = prevRevenueAgg[0]?.total || 0;

    const revenueTrend = await Transaction.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo }, status: 'COMPLETED' } },
      {
        $group: {
          _id: { month: { $month: '$createdAt' }, year: { $year: '$createdAt' } },
          totalRevenue: { $sum: '$totalAmount' },
          txnCount: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

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

    const energyHoldingBySource = await EnergyListing.aggregate([
      { $match: { status: 'ACTIVE' } },
      {
        $group: {
          _id: '$source',
          totalKwh: { $sum: '$kwhAvailable' },
        },
      },
    ]);

    const userActivity = await Transaction.aggregate([
      {
        $group: {
          _id: { hour: { $hour: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.hour': 1 } },
    ]);

    const failedCount = await Transaction.countDocuments({ status: 'FAILED' });
    const pendingCount = await Transaction.countDocuments({ status: 'PENDING' });
    const completedCount = await Transaction.countDocuments({ status: 'COMPLETED' });

    let kycPending = 0;
    let kycVerified = 0;
    let kycRejected = 0;
    let kycDocPending = 0;
    let verificationTrend = [];
    try {
      [kycPending, kycVerified, kycRejected] = await Promise.all([
        Profile.countDocuments({ kycStatus: 'pending' }),
        Profile.countDocuments({ kycStatus: 'verified' }),
        Profile.countDocuments({ kycStatus: 'rejected' }),
      ]);
      kycDocPending = await KycDocument.countDocuments({ status: 'pending' });

      // Also count VerificationRequest overall statuses so chart is never empty when queue has items
      const vrStatus = await VerificationRequest.aggregate([
        { $group: { _id: '$overallStatus', count: { $sum: 1 } } },
      ]);
      vrStatus.forEach((row) => {
        const s = String(row._id || '').toLowerCase();
        const c = Number(row.count || 0);
        if (s === 'pending' || s === 'under review') kycPending += c;
        else if (s === 'approved') kycVerified += c;
        else if (s === 'rejected') kycRejected += c;
      });

      const kycDocStatus = await KycDocument.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]);
      kycDocStatus.forEach((row) => {
        const s = String(row._id || '').toLowerCase();
        const c = Number(row.count || 0);
        if (s === 'pending') kycPending += c;
        else if (s === 'approved') kycVerified += c;
        else if (s === 'rejected') kycRejected += c;
      });

      verificationTrend = await VerificationRequest.aggregate([
        { $match: { createdAt: { $gte: sixMonthsAgo } } },
        {
          $group: {
            _id: {
              month: { $month: '$createdAt' },
              year: { $year: '$createdAt' },
              status: '$overallStatus',
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]);
    } catch (kycErr) {
      console.error('Analytics KYC enrichment warning:', kycErr.message);
    }

    const peakHour = userActivity.reduce(
      (best, row) => (Number(row.count) > Number(best.count || 0) ? row : best),
      { _id: { hour: 0 }, count: 0 }
    );
    const topSource = energyTradingBySource[0] || { _id: 'N/A', totalKwh: 0 };
    const failedRate = totalTransactions
      ? Number(((failedCount / totalTransactions) * 100).toFixed(1))
      : 0;

    const insights = [
      {
        id: 'peak_hour',
        title: 'Peak trading hour',
        detail: `Most transactions happen around ${String(peakHour._id?.hour || 0).padStart(2, '0')}:00 (${peakHour.count || 0} txns).`,
        severity: 'info',
      },
      {
        id: 'top_source',
        title: 'Top energy source',
        detail: `${topSource._id || 'Unknown'} leads listings with ${Number(topSource.totalKwh || 0).toLocaleString()} kWh.`,
        severity: 'success',
      },
      {
        id: 'kyc_backlog',
        title: 'KYC backlog',
        detail: `${kycPending} verification item(s) in pending/under-review queues.`,
        severity: kycPending > 0 ? 'warning' : 'success',
      },
      {
        id: 'failed_rate',
        title: 'Failed transaction rate',
        detail: `${failedRate}% of transactions failed (${failedCount} failed / ${totalTransactions} total).`,
        severity: failedRate > 5 ? 'warning' : 'info',
      },
      {
        id: 'revenue_mom',
        title: 'Revenue (last 30 days vs prior 30)',
        detail: `₹${recentRevenue.toLocaleString()} vs ₹${prevRevenue.toLocaleString()} (${pctChange(recentRevenue, prevRevenue)}%).`,
        severity: recentRevenue >= prevRevenue ? 'success' : 'warning',
      },
      {
        id: 'txn_mix',
        title: 'Transaction status mix',
        detail: `Completed ${completedCount}, Pending ${pendingCount}, Failed ${failedCount}.`,
        severity: pendingCount > completedCount * 0.2 ? 'warning' : 'info',
      },
    ];

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        activeUsers: activeUserIds.length,
        totalTransactions,
        platformRevenue,
        revenueTrend,
        energyTradingBySource,
        energyHoldingBySource,
        userActivity,
        verificationTrend,
        verificationSummary: {
          pending: kycPending,
          verified: kycVerified,
          rejected: kycRejected,
        },
        txnStatusBreakdown: {
          completed: completedCount,
          pending: pendingCount,
          failed: failedCount,
        },
        changes: {
          activeUsers: pctChange(activeUserIds.length, prevActiveUserIds.length),
          transactions: pctChange(recentTxns, prevTxns),
          revenue: pctChange(recentRevenue, prevRevenue),
        },
        insights,
      },
    });
  } catch (error) {
    console.error('Analytics Error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/** Email analytics summary as CSV attachment (admin email automation) */
exports.emailAnalyticsReport = async (req, res) => {
  try {
    const to = req.body?.email || req.user?.email;
    if (!to) {
      return res.status(400).json({ success: false, message: 'Recipient email required' });
    }

    let overview = null;
    await new Promise((resolve) => {
      const fakeRes = {
        status() { return this; },
        json(payload) { overview = payload; resolve(payload); },
      };
      exports.getAnalyticsOverview(req, fakeRes).catch((err) => {
        overview = { success: false, error: err.message };
        resolve(overview);
      });
    });

    const d = overview?.data;
    if (!d) {
      return res.status(500).json({ success: false, message: 'Failed to build report' });
    }

    const lines = [
      'Section,Metric,Value',
      `KPI,Total Users,${d.totalUsers}`,
      `KPI,Active Users,${d.activeUsers}`,
      `KPI,Total Transactions,${d.totalTransactions}`,
      `KPI,Platform Revenue,${d.platformRevenue}`,
    ];
    (d.insights || []).forEach((insight) => {
      lines.push(`Insight,"${insight.title}","${String(insight.detail || '').replace(/"/g, "'")}"`);
    });
    (d.energyTradingBySource || []).forEach((r) => {
      lines.push(`Energy By Source,${r._id || 'Unknown'},${r.totalKwh || 0}`);
    });

    const csv = '\uFEFF' + lines.join('\n');
    const nodemailer = require('nodemailer');
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      return res.status(500).json({
        success: false,
        message: 'EMAIL_USER / EMAIL_PASS not configured on server',
      });
    }
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject: `PowerFlow Analytics Report — ${new Date().toISOString().slice(0, 10)}`,
      text: 'Attached is your PowerFlow admin analytics report (Excel-compatible CSV).',
      attachments: [
        {
          filename: `powerflow_analytics_${new Date().toISOString().slice(0, 10)}.csv`,
          content: csv,
        },
      ],
    });

    res.json({ success: true, message: `Analytics report emailed to ${to}` });
  } catch (error) {
    console.error('Email analytics report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to email report. Check EMAIL_USER / EMAIL_PASS.',
      error: error.message,
    });
  }
};
