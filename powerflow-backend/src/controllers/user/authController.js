const User = require('../../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const asyncHandler = require('express-async-handler');
const Wallet = require('../../models/Wallet');
const crypto = require('crypto');


// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
exports.register = asyncHandler(async (req, res) => {
    const { name, email, password, role, meterId, accountType, isVerified, adminKey} = req.body;

    //check for all required fields
    if (!name || !email || !password || !role || !accountType) {
        res.status(400);
        throw new Error('Please enter all required fields: name, email, password, role, and accountType.');
    }

    const userExists = await User.findOne({ email });

    if(userExists) {
        res.status(400);
        throw new Error('User already exists.');
    }

    //1. Hash the pssword
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    //admin role allowed only if valid adminKey provided
    let finalRole = role;
    if(role && role.toLowerCase() === 'admin') {
        if(adminKey !== process.env.ADMIN_KEY) {
            res.status(403);
            throw new Error('Invalid admin key provided for admin registration.');
        }
        // User model enum is ['Buyer', 'Producer', 'Admin'] — must match casing
        finalRole = 'Admin';
    }

    //2. Create user instance with all necessary new fields
    const user = await User.create({
        name,
        email,
        passwordHash: hashedPassword,
        meterId,
        role: finalRole,
        accountType: accountType,
        isVerified: isVerified !== undefined ? isVerified : false,
        //walletBalance and energyCredits = 0 as per default.
    })

    if(user) {
        //ensure wallet profile exists for thsi user
        try{
            await Wallet.findOneAndUpdate(
                { userId : user._id},
                { $setOnInsert: { walletBalance: 0, energyCredits: 0 } },
                { upsert: true, new: true }
            );
        }catch(err) {
            console.error('Error creating wallet for new user:', err.message);
        }

        //3. generate token for immediate login
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' }
        );

        //4. send response, including new fields for client
        res.status(201).json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                accountType: user.accountType,
                isVerified: user.isVerified,
                walletBalance: user.walletBalance,
                energyCredits: user.energyCredits,
            }
        });
    } else {
        res.status(400);
        throw new Error('Invalid user data.');
    }
});

// @desc    Authenticate a user 
// @route   POST /api/auth/login
// @access  Public
exports.login = asyncHandler(async (req, res) => {
    const { email, password, adminKey } = req.body;

    if(!email || !password) {
        res.status(400);
        throw new Error('Please provide both email and password.');
    }

    //1. fimd user, explicitly include passwordUash field bc it has select: false in model
    const user = await User.findOne({ email }).select('+passwordHash');
    if(!user) {
        res.status(401);
        throw new Error('Invalid credentials.');
    }

    //2. check password
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if(!isMatch) {
        res.status(401);
        throw new Error('Invalid credentials.');
    }

    //if admin login, verify adminKey
    if(String(user.role).toLowerCase() === 'admin' && adminKey !== process.env.ADMIN_KEY) {
        res.status(403);
        throw new Error('Invalid admin key provided for admin login.');
    }

    //3. generate token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' });

    //ensure wallet profile exists for this user
    try{
        await Wallet.findOneAndUpdate(
            { userId : user._id},
            { $setOnInsert: { walletBalance: 0, energyCredits: 0 } },
            { upsert: true, new: true }
        );
    }catch(err) {
        console.error('Error ensuring wallet for user login:', err.message);
    }

    //4. Send respomse
    res.status(200).json({
        token,
        user: {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            accountType: user.accountType,
            isVerified: user.isVerified,
            walletBalance: user.walletBalance,
            energyCredits: user.energyCredits,
        }
    });
});

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
exports.getProfile = asyncHandler(async (req, res) => {
    //req.user is set in auth middleware
    const user = req.user;
    if(!user) {
        res.status(404);
        throw new Error('User not found.');
    }
    res.status(200).json({
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            accountType: user.accountType,
            isVerified: user.isVerified,
            walletBalance: user.walletBalance,
            energyCredits: user.energyCredits,
        }
    });
});

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    // Generate token
    const resetToken = crypto.randomBytes(20).toString('hex');

    // Set token and expiry
    user.passwordResetToken = resetToken;
    user.passwordResetExpires = Date.now() + 3600000; // 1 hour

    await user.save();

    // Create reset URL
    const resetUrl = `${req.protocol}://${req.get('host')}/reset-password/${resetToken}`;

    // For now, just log the reset URL
    console.log(resetUrl);

    res.status(200).json({ success: true, message: 'Password reset link sent to your email.' });
});

// @desc    Reset password
// @route   POST /api/auth/reset-password
// @access  Public
exports.resetPassword = asyncHandler(async (req, res) => {
    const { token, password } = req.body;

    const user = await User.findOne({
        passwordResetToken: token,
        passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
        res.status(400);
        throw new Error('Invalid or expired token');
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(password, salt);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    await user.save();

    res.status(200).json({ success: true, message: 'Password reset successful' });
});