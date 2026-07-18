const Transaction = require('../../models/Transaction');
const User = require('../../models/User');
const mongoose = require('mongoose');
const { Parser } = require('json2csv');

// 🧩 Helper: start of today
const startOfToday = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

// 📊 1️⃣ Dashboard stats
exports.getTransactionStats = async (req, res) => {
  try {
    const totalTransactions = await Transaction.countDocuments();

    const todayVolumeData = await Transaction.aggregate([
      { $match: { createdAt: { $gte: startOfToday() }, status: 'COMPLETED' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]);
    const todayVolume = todayVolumeData[0]?.total || 0;

    const pending = await Transaction.countDocuments({ status: 'PENDING' });
    const failed = await Transaction.countDocuments({ status: 'FAILED' });

    res.json({
      totalTransactions,
      todayVolume,
      pending,
      failed,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load transaction stats' });
  }
};

// 📋 2️⃣ Paginated list + filter + search
exports.getAllTransactions = async (req, res) => {
  try {
    const { status, type, search, page = 1, limit = 20 } = req.query;
    const query = {};

    if (status) query.status = status;
    if (type) query.type = type;

    if (search) {
      const users = await User.find({
        $or: [
          { name: new RegExp(search, 'i') },
          { email: new RegExp(search, 'i') },
        ],
      }).select('_id');
      query.$or = [
        { buyer: { $in: users.map(u => u._id) } },
        { seller: { $in: users.map(u => u._id) } },
        { externalRefId: new RegExp(search, 'i') },
      ];
    }

    const transactions = await Transaction.find(query)
      .populate('buyer', 'name email')
      .populate('seller', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Transaction.countDocuments(query);

    res.json({
      page: Number(page),
      totalPages: Math.ceil(total / limit),
      total,
      transactions,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
};

// 📤 3️⃣ Export as CSV
exports.exportTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find()
      .populate('buyer', 'name email')
      .populate('seller', 'name email')
      .sort({ createdAt: -1 });

    const data = transactions.map(t => ({
      id: t._id,
      type: t.type,
      buyer: t.buyer ? t.buyer.email : '-',
      seller: t.seller ? t.seller.email : '-',
      amount: t.totalAmount,
      status: t.status,
      createdAt: t.createdAt,
    }));

    const parser = new Parser({ fields: Object.keys(data[0] || {}) });
    const csv = parser.parse(data);

    res.header('Content-Type', 'text/csv');
    res.attachment('transactions_report.csv');
    res.send(csv);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to export report' });
  }
};
