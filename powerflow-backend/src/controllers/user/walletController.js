const User = require('../../models/User');
const Wallet = require('../../models/Wallet');
const Transaction = require('../../models/Transaction');
const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');


// called only from webhook after payment success
//safely upddtes wallet balance and records transaction
exports.updateBalanceFromWebhook = async (userId, amount, transactionId) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const updatedWallet = await Wallet.findOneAndUpdate(
      { userId },
      { $inc: { walletBalance: parseFloat(amount) } },
      { new: true, runValidators: true, session }
    );

    if (!updatedWallet) throw new Error(`Wallet not found for user: ${userId}`);

    const transaction = new Transaction({
      type: 'RECHARGE',
      buyer: new mongoose.Types.ObjectId(userId),
      seller: null,
      kwh: 0,
      totalAmount: amount,
      status: 'COMPLETED',
      externalRefId: transactionId,
    });

    await transaction.save({ session });

    // keep User.walletBalance in sync for admin views or legacy reads
    await User.findByIdAndUpdate(
      userId,
      { walletBalance: updatedWallet.walletBalance },
      { session }
    );
    await session.commitTransaction();
    session.endSession();

    console.log(`[Wallet] Credited ₹${amount} to user ${userId}`);
    return { success: true, newBalance: updatedWallet.walletBalance };
  } catch (error) {
    if (session.inTransaction()) await session.abortTransaction();
    session.endSession();
    console.error(`[Wallet Error] Stripe credit failed for user ${userId}:`, error.message);
    return { success: false, error: error.message };
  }
};


//manually topup wallet (for testing)
//Route: POST /api/wallet/topup
exports.topUpWallet = asyncHandler(async (req, res) => {
  const { amount } = req.body;
  const userId = req.user._id;

  if (!amount || amount <= 0) {
    res.status(400);
    throw new Error('Please provide a valid top-up amount.');
  }

  const updatedWallet = await Wallet.findOneAndUpdate(
    { userId },
    { $inc: { walletBalance: parseFloat(amount) } },
    { new: true, runValidators: true }
  );

  if (!updatedWallet) {
    res.status(404);
    throw new Error('Wallet not found for this user.');
  }

  await Transaction.create({
    type: 'INTERNAL_TOPUP',
    buyer: userId,
    seller: null,
    kwh: 0,
    totalAmount: parseFloat(amount),
    status: 'COMPLETED',
  });

  // keep User.walletBalance in sync
  await User.findByIdAndUpdate(userId, { walletBalance: updatedWallet.walletBalance });

  res.json({
    message: `Wallet topped up successfully.`,
    newBalance: updatedWallet.walletBalance,
  });
});


//get wallet and energy balance
//Route: GET /api/wallet/balance
exports.getBalance = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  let wallet = await Wallet.findOne({ userId }).select('walletBalance energyCredits');

  //create wallet if not exists
  if (!wallet) {
    wallet = await Wallet.create({ userId });
  }

  // Ensure energyCredits is not stale vs User doc to avoid UI mismatch
  if (typeof req.user.energyCredits === 'number' && wallet.energyCredits !== req.user.energyCredits) {
    wallet.energyCredits = req.user.energyCredits;
    await wallet.save();
  }

  res.json({
    userId,
    walletBalance: wallet.walletBalance,
    energyCredits: wallet.energyCredits,
  });
});


//get transaction history
//route: GET /api/wallet/transactions
exports.getTransactions = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const transactions = await Transaction.find({
    $or: [{ seller: userId }, { buyer: userId }],
  })
    .sort({ createdAt: -1 })
    .populate('seller', 'name accountType')
    .populate('buyer', 'name accountType')
    .select('-__v')
    .limit(100);

  const formatted = transactions.map(tx => {
    const isSeller = tx.seller?._id.toString() === userId.toString();
    const party = isSeller ? tx.buyer : tx.seller;

    let description = '', flow = '', color = '', amount = tx.totalAmount;

    switch (tx.type) {
      case 'TRADE':
        if (isSeller) {
          description = `Sold ${tx.kwh} kWh to ${party?.name || 'Unknown'}`;
          flow = 'IN'; color = 'success';
        } else {
          description = `Bought ${tx.kwh} kWh from ${party?.name || 'Unknown'}`;
          flow = 'OUT'; color = 'danger';
        }
        break;

      case 'DONATION':
        amount = 0;
        if (isSeller) {
          description = `Donated ${tx.kwh} kWh to ${party?.name || 'Community Fund'}`;
          flow = 'OUT'; color = 'info';
        } else {
          description = `Received ${tx.kwh} kWh from ${party?.name || 'Unknown'}`;
          flow = 'IN'; color = 'success';
        }
        break;

      case 'RECHARGE':
      case 'INTERNAL_TOPUP':
        description = tx.type === 'RECHARGE' ? 'Card Recharge (Stripe)' : 'Internal Top-up';
        flow = 'IN'; color = 'primary';
        break;

      case 'WITHDRAW':
        description = 'Wallet withdrawal';
        flow = 'OUT'; color = 'warning';
        break;

      case 'REDEEM_CREDITS':
        description = 'Redeemed energy credits';
        flow = 'IN'; color = 'info';
        break;
    }

    return {
      id: tx._id,
      type: tx.type,
      kwh: tx.kwh,
      totalAmount: amount,
      timestamp: tx.createdAt,
      description,
      flow,
      color,
      isSeller,
    };
  });

  res.json(formatted);
});


//withdraw INR
//route: POST /api/wallet/withdraw
exports.withdrawFunds = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { amount } = req.body;
  const value = parseFloat(amount);

  if (!value || value <= 0) {
    res.status(400);
    throw new Error('Please provide a valid withdrawal amount.');
  }

  const wallet = await Wallet.findOne({ userId });
  if (!wallet) {
    res.status(404);
    throw new Error('Wallet not found for this user.');
  }

  if (wallet.walletBalance < value) {
    res.status(400);
    throw new Error('Insufficient wallet balance.');
  }

  wallet.walletBalance = parseFloat((wallet.walletBalance - value).toFixed(2));
  await wallet.save();

  await Transaction.create({
    type: 'WITHDRAW',
    buyer: null,
    seller: userId,
    kwh: 0,
    totalAmount: value,
    status: 'COMPLETED',
  });

  res.json({
    message: 'Withdrawal successful',
    newBalance: wallet.walletBalance,
  });

  // keep User.walletBalance in sync
  await User.findByIdAndUpdate(userId, { walletBalance: wallet.walletBalance });
});


//redeem energy credits tp INR
//100 credits = 450 INR (min)
//route: POST /api/wallet/redeem
exports.redeemCredits = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const MIN_BLOCK = 100;
  const RATE = 4.5;

  const wallet = await Wallet.findOne({ userId });
  if (!wallet) {
    res.status(404);
    throw new Error('Wallet not found for this user.');
  }

  if (wallet.energyCredits < MIN_BLOCK) {
    res.status(400);
    throw new Error('Minimum 100 energy credits required to redeem.');
  }

  const creditsToRedeem = MIN_BLOCK;
  const rupees = parseFloat((creditsToRedeem * RATE).toFixed(2));

  wallet.energyCredits -= creditsToRedeem;
  wallet.walletBalance = parseFloat((wallet.walletBalance + rupees).toFixed(2));
  await wallet.save();

  await Transaction.create({
    type: 'REDEEM_CREDITS',
    buyer: userId,
    seller: null,
    kwh: 0,
    totalAmount: rupees,
    status: 'COMPLETED',
  });

  res.json({
    message: `Redeemed ${creditsToRedeem} EC for ₹${rupees.toFixed(2)}`,
    newWalletBalance: wallet.walletBalance,
    newEnergyCredits: wallet.energyCredits,
  });

  // keep User.walletBalance and energyCredits in sync
  await User.findByIdAndUpdate(userId, {
    walletBalance: wallet.walletBalance,
    energyCredits: wallet.energyCredits,
  });
});
