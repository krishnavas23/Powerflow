const User = require('../../models/User');
const Transaction = require('../../models/Transaction');
const EnergyListing = require('../../models/EnergyListing');
const MeterReading = require('../../models/MeterReading');
const KycDocument = require('../../models/KycDocument');
const VerificationRequest = require('../../models/VerificationRequest');
const { sendDataset } = require('../../utils/powerbiResponse');

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

exports.getCatalog = (req, res) => {
  const base = '/api/admin/powerbi';
  res.json({
    success: true,
    message: 'Power BI datasets for PowerFlow. Append ?format=csv for CSV export.',
    auth: {
      optionA: 'Authorization: Bearer <admin-jwt>',
      optionB: 'X-PowerBI-Key: <POWERBI_API_KEY from .env>',
    },
    datasets: [
      { name: 'kpis', path: `${base}/kpis`, description: 'Platform KPI snapshot (one row per metric)' },
      { name: 'transactions', path: `${base}/transactions`, description: 'Transaction fact table' },
      { name: 'revenue-daily', path: `${base}/revenue-daily`, description: 'Daily revenue time series (last 90 days)' },
      { name: 'revenue-monthly', path: `${base}/revenue-monthly`, description: 'Monthly revenue (last 12 months)' },
      { name: 'energy-by-source', path: `${base}/energy-by-source`, description: 'Energy listings grouped by source' },
      { name: 'user-activity-hourly', path: `${base}/user-activity-hourly`, description: 'Transactions by hour of day' },
      { name: 'meter-daily', path: `${base}/meter-daily`, description: 'Meter readings aggregated by day' },
      { name: 'verification-summary', path: `${base}/verification-summary`, description: 'KYC and verification pipeline counts' },
    ],
  });
};

exports.getKpis = async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const [
      totalUsers,
      activeUserIds,
      totalTransactions,
      revenueAgg,
      todayTxnCount,
      activeListingsAgg,
      pendingTxns,
      failedTxns,
    ] = await Promise.all([
      User.countDocuments(),
      Transaction.distinct('buyer', { createdAt: { $gte: thirtyDaysAgo } }),
      Transaction.countDocuments(),
      Transaction.aggregate([
        {
          $match: {
            status: 'COMPLETED',
            type: { $in: ['TRADE', 'RECHARGE'] },
          },
        },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]),
      Transaction.countDocuments({ createdAt: { $gte: startOfDay } }),
      EnergyListing.aggregate([
        { $match: { status: 'ACTIVE' } },
        { $group: { _id: null, totalKwh: { $sum: '$kwhAvailable' } } },
      ]),
      Transaction.countDocuments({ status: 'PENDING' }),
      Transaction.countDocuments({ status: 'FAILED' }),
    ]);

    const rows = [
      { metric: 'Total Users', value: totalUsers, unit: 'count', category: 'Users' },
      { metric: 'Active Users (30d)', value: activeUserIds.length, unit: 'count', category: 'Users' },
      { metric: 'Total Transactions', value: totalTransactions, unit: 'count', category: 'Transactions' },
      { metric: 'Platform Revenue', value: revenueAgg[0]?.total || 0, unit: 'INR', category: 'Revenue' },
      { metric: 'Today Transaction Count', value: todayTxnCount, unit: 'count', category: 'Transactions' },
      { metric: 'Active Energy Listed', value: activeListingsAgg[0]?.totalKwh || 0, unit: 'kWh', category: 'Energy' },
      { metric: 'Pending Transactions', value: pendingTxns, unit: 'count', category: 'Transactions' },
      { metric: 'Failed Transactions', value: failedTxns, unit: 'count', category: 'Transactions' },
    ];

    return sendDataset(res, req, rows, 'powerflow_kpis');
  } catch (error) {
    console.error('Power BI KPIs error:', error);
    return res.status(500).json({ success: false, message: 'Failed to load KPI dataset', error: error.message });
  }
};

exports.getTransactionsFact = async (req, res) => {
  try {
    const transactions = await Transaction.find()
      .populate('buyer', 'name email accountType')
      .populate('seller', 'name email accountType')
      .sort({ createdAt: -1 })
      .lean();

    const rows = transactions.map((t) => ({
      transaction_id: String(t._id),
      type: t.type,
      status: t.status,
      amount_inr: Number(t.totalAmount || 0),
      kwh: Number(t.kwh || 0),
      buyer_name: t.buyer?.name || null,
      buyer_email: t.buyer?.email || null,
      seller_name: t.seller?.name || null,
      seller_email: t.seller?.email || null,
      beneficiary: t.beneficiary || null,
      external_ref_id: t.externalRefId || null,
      created_date: t.createdAt ? t.createdAt.toISOString().slice(0, 10) : null,
      created_at: t.createdAt ? t.createdAt.toISOString() : null,
    }));

    return sendDataset(res, req, rows, 'powerflow_transactions');
  } catch (error) {
    console.error('Power BI transactions error:', error);
    return res.status(500).json({ success: false, message: 'Failed to load transactions dataset', error: error.message });
  }
};

exports.getRevenueDaily = async (req, res) => {
  try {
    const since = new Date();
    since.setDate(since.getDate() - 90);

    const agg = await Transaction.aggregate([
      {
        $match: {
          createdAt: { $gte: since },
          status: 'COMPLETED',
          type: { $in: ['TRADE', 'RECHARGE'] },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue_inr: { $sum: '$totalAmount' },
          transaction_count: { $sum: 1 },
          energy_kwh: { $sum: '$kwh' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const rows = agg.map((r) => ({
      date: r._id,
      revenue_inr: Number(r.revenue_inr || 0),
      transaction_count: Number(r.transaction_count || 0),
      energy_kwh: Number(r.energy_kwh || 0),
    }));

    return sendDataset(res, req, rows, 'powerflow_revenue_daily');
  } catch (error) {
    console.error('Power BI revenue daily error:', error);
    return res.status(500).json({ success: false, message: 'Failed to load daily revenue dataset', error: error.message });
  }
};

exports.getRevenueMonthly = async (req, res) => {
  try {
    const since = new Date();
    since.setMonth(since.getMonth() - 12);

    const agg = await Transaction.aggregate([
      {
        $match: {
          createdAt: { $gte: since },
          status: 'COMPLETED',
          type: { $in: ['TRADE', 'RECHARGE'] },
        },
      },
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          revenue_inr: { $sum: '$totalAmount' },
          transaction_count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    const rows = agg.map((r) => ({
      year: r._id.year,
      month_number: r._id.month,
      month_name: monthNames[(r._id.month || 1) - 1],
      revenue_inr: Number(r.revenue_inr || 0),
      transaction_count: Number(r.transaction_count || 0),
    }));

    return sendDataset(res, req, rows, 'powerflow_revenue_monthly');
  } catch (error) {
    console.error('Power BI revenue monthly error:', error);
    return res.status(500).json({ success: false, message: 'Failed to load monthly revenue dataset', error: error.message });
  }
};

exports.getEnergyBySource = async (req, res) => {
  try {
    const agg = await EnergyListing.aggregate([
      {
        $group: {
          _id: '$source',
          total_kwh: { $sum: '$kwhAvailable' },
          listing_count: { $sum: 1 },
          active_listings: {
            $sum: { $cond: [{ $eq: ['$status', 'ACTIVE'] }, 1, 0] },
          },
        },
      },
      { $sort: { total_kwh: -1 } },
    ]);

    const rows = agg.map((r) => ({
      source: r._id || 'Unknown',
      total_kwh: Number(r.total_kwh || 0),
      listing_count: Number(r.listing_count || 0),
      active_listings: Number(r.active_listings || 0),
    }));

    return sendDataset(res, req, rows, 'powerflow_energy_by_source');
  } catch (error) {
    console.error('Power BI energy by source error:', error);
    return res.status(500).json({ success: false, message: 'Failed to load energy dataset', error: error.message });
  }
};

exports.getUserActivityHourly = async (req, res) => {
  try {
    const agg = await Transaction.aggregate([
      {
        $group: {
          _id: { hour: { $hour: '$createdAt' } },
          transaction_count: { $sum: 1 },
          revenue_inr: { $sum: '$totalAmount' },
        },
      },
      { $sort: { '_id.hour': 1 } },
    ]);

    const rows = agg.map((r) => ({
      hour: r._id.hour,
      hour_label: `${String(r._id.hour).padStart(2, '0')}:00`,
      transaction_count: Number(r.transaction_count || 0),
      revenue_inr: Number(r.revenue_inr || 0),
    }));

    return sendDataset(res, req, rows, 'powerflow_user_activity_hourly');
  } catch (error) {
    console.error('Power BI hourly activity error:', error);
    return res.status(500).json({ success: false, message: 'Failed to load hourly activity dataset', error: error.message });
  }
};

exports.getMeterDaily = async (req, res) => {
  try {
    const agg = await MeterReading.aggregate([
      {
        $group: {
          _id: {
            meter_id: '$meterId',
            date: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
          },
          total_kwh: { $max: '$cumulativeKWh' },
          avg_power_kw: { $avg: '$activePowerKW' },
          reading_count: { $sum: 1 },
        },
      },
      { $sort: { '_id.date': 1, '_id.meter_id': 1 } },
    ]);

    const rows = agg.map((r) => ({
      meter_id: r._id.meter_id,
      date: r._id.date,
      total_kwh: Number(r.total_kwh || 0),
      avg_power_kw: Number((r.avg_power_kw || 0).toFixed(3)),
      reading_count: Number(r.reading_count || 0),
    }));

    return sendDataset(res, req, rows, 'powerflow_meter_daily');
  } catch (error) {
    console.error('Power BI meter daily error:', error);
    return res.status(500).json({ success: false, message: 'Failed to load meter dataset', error: error.message });
  }
};

exports.getVerificationSummary = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [kycPending, kycApprovedToday, kycRejectedToday] = await Promise.all([
      KycDocument.countDocuments({ status: 'pending' }),
      KycDocument.countDocuments({ status: 'approved', updatedAt: { $gte: today } }),
      KycDocument.countDocuments({ status: 'rejected', updatedAt: { $gte: today } }),
    ]);

    const vrAgg = await VerificationRequest.aggregate([
      { $unwind: '$documents' },
      {
        $group: {
          _id: null,
          pending: { $sum: { $cond: [{ $eq: ['$documents.status', 'Pending'] }, 1, 0] } },
          under_review: { $sum: { $cond: [{ $eq: ['$documents.status', 'Under Review'] }, 1, 0] } },
          approved_today: {
            $sum: {
              $cond: [
                { $and: [{ $eq: ['$documents.status', 'Approved'] }, { $gte: ['$reviewedAt', today] }] },
                1,
                0,
              ],
            },
          },
          rejected_today: {
            $sum: {
              $cond: [
                { $and: [{ $eq: ['$documents.status', 'Rejected'] }, { $gte: ['$reviewedAt', today] }] },
                1,
                0,
              ],
            },
          },
        },
      },
    ]);

    const vr = vrAgg[0] || {};

    const rows = [
      { pipeline: 'KYC', status: 'Pending', count: kycPending },
      { pipeline: 'KYC', status: 'Approved Today', count: kycApprovedToday },
      { pipeline: 'KYC', status: 'Rejected Today', count: kycRejectedToday },
      { pipeline: 'Verification', status: 'Pending', count: vr.pending || 0 },
      { pipeline: 'Verification', status: 'Under Review', count: vr.under_review || 0 },
      { pipeline: 'Verification', status: 'Approved Today', count: vr.approved_today || 0 },
      { pipeline: 'Verification', status: 'Rejected Today', count: vr.rejected_today || 0 },
    ];

    return sendDataset(res, req, rows, 'powerflow_verification_summary');
  } catch (error) {
    console.error('Power BI verification summary error:', error);
    return res.status(500).json({ success: false, message: 'Failed to load verification dataset', error: error.message });
  }
};
