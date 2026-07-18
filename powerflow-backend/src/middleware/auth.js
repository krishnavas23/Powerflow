const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Wallet = require('../models/Wallet');

module.exports = async function (req, res, next) {
    //1. check for authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Authorization token missing or malformed' });
    }

    const token = authHeader.split(' ')[1];

    try {
        //2. verify token using secret
        const payload = jwt.verify(token, process.env.JWT_SECRET);

        //3. find user by id from payload
        const user = await User.findById(payload.id).select('name email walletBalance energyCredits role accountType isVerified');
        if (!user) {
            return res.status(401).json({ message: 'User not found (Invalid token payload)' });
        }

        //4. Ensure wallet exists and sync balances
        let wallet = await Wallet.findOne({ userId: user._id });
        if (!wallet) {
            wallet = await Wallet.create({ userId: user._id });
        }
        // If values differ, prefer wallet as source of truth and sync user doc
        const needsSync = (typeof user.walletBalance === 'number' && user.walletBalance !== wallet.walletBalance)
            || (typeof user.energyCredits === 'number' && user.energyCredits !== wallet.energyCredits);
        if (needsSync) {
            await User.findByIdAndUpdate(user._id, {
                walletBalance: wallet.walletBalance,
                energyCredits: wallet.energyCredits,
            });
            user.walletBalance = wallet.walletBalance;
            user.energyCredits = wallet.energyCredits;
        }

        //5. attach user and wallet to req for downstream controllers
        req.user = user;
        req.wallet = wallet;

        //6. proceed to next middleware/controller
        next();

    } catch (err) {
        console.error('JWT Verification Error:', err.message);
        return res.status(401).json({ message: 'Invalid or expired token', error: err.message });
    }
}