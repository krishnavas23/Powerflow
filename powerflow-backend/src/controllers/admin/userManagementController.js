const asyncHandler = require('express-async-handler');
const User = require('../../models/User');
const Profile = require('../../models/Profile');
const Wallet = require('../../models/Wallet');

// 📊 1️⃣ GET Overall User Stats
exports.getUserStats = asyncHandler(async (req, res) => {
  const totalUsers = await User.countDocuments({ role: { $ne: 'Admin' } });
  const verifiedUsers = await Profile.countDocuments({ kycStatus: 'verified' });
  const activeUsers = await User.countDocuments({ isVerified: true });
  const suspendedUsers = await User.countDocuments({ isVerified: false });

  res.json({
    totalUsers,
    activeUsers,
    verifiedUsers,
    suspendedUsers,
  });
});

// 📋 2️⃣ GET All Users (with optional search & filter)
exports.getAllUsers = asyncHandler(async (req, res) => {
  const { search, status } = req.query;
  const query = { role: { $ne: 'Admin' } };

  // search by name or email
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  // status filter: verified/unverified/suspended
  if (status) {
    if (status === 'verified') query.isVerified = true;
    else if (status === 'unverified') query.isVerified = false;
  }

  const users = await User.find(query)
    .sort({ createdAt: -1 })
    .lean();

  // enrich with wallet + profile info
  const userIds = users.map(u => u._id);
  const [profiles, wallets] = await Promise.all([
    Profile.find({ userId: { $in: userIds } }).lean(),
    Wallet.find({ userId: { $in: userIds } }).lean(),
  ]);

  const profileMap = Object.fromEntries(profiles.map(p => [p.userId.toString(), p]));
  const walletMap = Object.fromEntries(wallets.map(w => [w.userId.toString(), w]));

  const enriched = users.map(u => ({
    ...u,
    profile: profileMap[u._id.toString()] || {},
    wallet: walletMap[u._id.toString()] || {},
  }));

  res.json(enriched);
});

// ➕ 3️⃣ Add New User (admin-initiated)
exports.createUser = asyncHandler(async (req, res) => {
  const { name, email, passwordHash, role, accountType } = req.body;

  const existing = await User.findOne({ email });
  if (existing) {
    res.status(400);
    throw new Error('User with this email already exists');
  }

  const newUser = await User.create({
    name,
    email,
    passwordHash,
    role: role || 'Buyer',
    accountType: accountType || 'Individual',
    isVerified: false,
    meterId: `METER-${Date.now()}`,
  });

  await Profile.create({
    userId: newUser._id,
    fullName: name,
    email,
  });

  await Wallet.create({
    userId: newUser._id,
    walletBalance: 0,
    energyCredits: 0,
  });

  res.status(201).json({ message: 'User created successfully', newUser });
});

// 🚫 4️⃣ Suspend User
exports.suspendUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  user.isVerified = false;
  await user.save();

  res.json({ message: 'User suspended successfully' });
});

// ✅ 5️⃣ Activate User
exports.activateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  user.isVerified = true;
  await user.save();

  res.json({ message: 'User activated successfully' });
});
