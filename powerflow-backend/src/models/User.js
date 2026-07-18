const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    email: {
        type: String,
        required: true,
        lowercase: true,
        unique: true,
        trim: true,
    },
    passwordHash: {
        type: String,
        required: true,
        select: false,
    },
    meterId: {
        type: String,
        ref: 'Meter',
        required: true,
    },
    walletBalance: {
        type: Number,
        default: 0,
        min: 0,
    },
    energyCredits: {
        type: Number,
        default: 0,
        min: 0,
    },
    role: {
        type: String,
        enum: ['Buyer', 'Producer', 'Admin'],
        default: 'Buyer',
        required: true,
    },
    accountType: {
        type: String,
        enum: ['Individual', 'Company', 'NGO', 'Hospital', 'Producer'],
        default: 'Individual',
        required: true,
    },
    isVerified: {
        type: Boolean,
        default: false,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    passwordResetToken: String,
    passwordResetExpires: Date,

});

module.exports = mongoose.models.User || mongoose.model('User', userSchema);