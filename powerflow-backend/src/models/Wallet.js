const mongoose = require('mongoose');

/**
 * Enhanced Wallet Schema for Energy Management System
 * Includes DAT (Digital Asset Token) rewards system
 * Supports energy trading, rewards, and comprehensive transaction tracking
 */
const WalletSchema = new mongoose.Schema({
    // User reference - links wallet to specific user
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true,
        index: true,
    },

    // Traditional wallet balance in INR
    walletBalance: {
        type: Number,
        default: 0,
        min: 0,
    },

    // Energy Credits for energy trading
    energyCredits: {
        type: Number,
        default: 0,
        min: 0,
    },

    // DAT Token Balance - Digital Asset Tokens for rewards
    datTokens: {
        type: Number,
        default: 1000, // Starting bonus of 1000 DAT tokens
        min: 0,
    },

    // Total DAT rewards earned (lifetime)
    totalDatEarned: {
        type: Number,
        default: 1000, // Starting with 1000 DAT
        min: 0,
    },

    // Energy currently listed for sale
    listedEnergy: {
        type: Number,
        default: 0,
        min: 0,
    },

    // Reward multiplier for faster earning (1x to 5x)
    rewardMultiplier: {
        type: Number,
        default: 1,
        min: 1,
        max: 5,
    },

    // Last reward claim timestamp
    lastRewardClaim: {
        type: Date,
        default: Date.now,
    },

    // Daily energy consumption tracking
    dailyConsumption: {
        type: Number,
        default: 0,
        min: 0,
    },

    // Daily energy production tracking
    dailyProduction: {
        type: Number,
        default: 0,
        min: 0,
    },

    // Comprehensive transaction history
    transactions: [
        {
            type: {
                type: String,
                enum: [
                    'addFunds', 'buyEnergy', 'sellEnergy', 'redeem', 'withdraw',
                    'datReward', 'datSpend', 'energyConsumption', 'energyProduction',
                    'dailyBonus', 'achievementReward', 'referralBonus'
                ],
                required: true,
            },
            amount: { 
                type: Number, 
                required: true 
            },
            unit: { 
                type: String, 
                enum: ['INR', 'EC', 'kWh', 'DAT'], 
                required: true 
            },
            description: { 
                type: String,
                required: true
            },
            balanceBefore: {
                type: Number,
                required: true
            },
            balanceAfter: {
                type: Number,
                required: true
            },
            relatedListing: { 
                type: mongoose.Schema.Types.ObjectId, 
                ref: 'EnergyListing' 
            },
            metadata: {
                type: mongoose.Schema.Types.Mixed, // For additional transaction data
                default: {}
            },
            createdAt: { 
                type: Date, 
                default: Date.now 
            },
        },
    ],

    // Achievement tracking for gamification
    achievements: [
        {
            name: {
                type: String,
                required: true
            },
            description: {
                type: String,
                required: true
            },
            datReward: {
                type: Number,
                required: true
            },
            unlockedAt: {
                type: Date,
                default: Date.now
            }
        }
    ],

    // Energy efficiency score (0-100)
    efficiencyScore: {
        type: Number,
        default: 50,
        min: 0,
        max: 100
    },

    // Streak counters for bonus rewards
    streaks: {
        dailyLogin: {
            type: Number,
            default: 0
        },
        energySaving: {
            type: Number,
            default: 0
        },
        solarProduction: {
            type: Number,
            default: 0
        }
    }

}, { 
    timestamps: true,
    // Add indexes for better query performance
    indexes: [
        { userId: 1 },
        { datTokens: -1 },
        { totalDatEarned: -1 },
        { 'transactions.createdAt': -1 }
    ]
});

// Instance methods for wallet operations

/**
 * Add DAT tokens to wallet with transaction logging
 * @param {Number} amount - Amount of DAT tokens to add
 * @param {String} reason - Reason for adding tokens
 * @param {Object} metadata - Additional transaction metadata
 */
WalletSchema.methods.addDatTokens = function(amount, reason, metadata = {}) {
    const balanceBefore = this.datTokens;
    this.datTokens += amount * this.rewardMultiplier;
    this.totalDatEarned += amount * this.rewardMultiplier;
    
    this.transactions.push({
        type: 'datReward',
        amount: amount * this.rewardMultiplier,
        unit: 'DAT',
        description: reason,
        balanceBefore,
        balanceAfter: this.datTokens,
        metadata
    });
    
    return this.save();
};

/**
 * Spend DAT tokens with transaction logging
 * @param {Number} amount - Amount of DAT tokens to spend
 * @param {String} reason - Reason for spending tokens
 */
WalletSchema.methods.spendDatTokens = function(amount, reason) {
    if (this.datTokens < amount) {
        throw new Error('Insufficient DAT tokens');
    }
    
    const balanceBefore = this.datTokens;
    this.datTokens -= amount;
    
    this.transactions.push({
        type: 'datSpend',
        amount: -amount,
        unit: 'DAT',
        description: reason,
        balanceBefore,
        balanceAfter: this.datTokens
    });
    
    return this.save();
};

/**
 * Calculate and award daily rewards based on energy efficiency
 */
WalletSchema.methods.calculateDailyReward = function() {
    const baseReward = 10; // Base 10 DAT per day
    const efficiencyBonus = Math.floor(this.efficiencyScore / 10); // 1 DAT per 10 efficiency points
    const streakBonus = Math.min(this.streaks.dailyLogin * 2, 50); // Max 50 DAT streak bonus
    
    const totalReward = (baseReward + efficiencyBonus + streakBonus) * this.rewardMultiplier;
    
    return this.addDatTokens(totalReward, 'Daily reward', {
        baseReward,
        efficiencyBonus,
        streakBonus,
        multiplier: this.rewardMultiplier
    });
};

/**
 * Update energy consumption and calculate efficiency
 * @param {Number} consumption - Energy consumed in kWh
 */
WalletSchema.methods.updateEnergyConsumption = function(consumption) {
    this.dailyConsumption = consumption;
    this.updateEfficiencyScore();
    
    // Award tokens for energy monitoring
    return this.addDatTokens(5, 'Energy consumption tracking', { consumption });
};

/**
 * Update energy production and calculate efficiency
 * @param {Number} production - Energy produced in kWh
 */
WalletSchema.methods.updateEnergyProduction = function(production) {
    this.dailyProduction = production;
    this.updateEfficiencyScore();
    
    // Award tokens for renewable energy production
    const productionReward = Math.floor(production * 2); // 2 DAT per kWh produced
    return this.addDatTokens(productionReward, 'Solar energy production', { production });
};

/**
 * Calculate and update efficiency score based on consumption vs production
 */
WalletSchema.methods.updateEfficiencyScore = function() {
    if (this.dailyConsumption === 0) {
        this.efficiencyScore = 100;
        return;
    }
    
    const ratio = this.dailyProduction / this.dailyConsumption;
    if (ratio >= 1) {
        this.efficiencyScore = 100; // Net positive or neutral
    } else {
        this.efficiencyScore = Math.max(10, Math.floor(ratio * 100));
    }
};

/**
 * Unlock achievement and award DAT tokens
 * @param {String} name - Achievement name
 * @param {String} description - Achievement description
 * @param {Number} datReward - DAT tokens to award
 */
WalletSchema.methods.unlockAchievement = function(name, description, datReward) {
    // Check if achievement already exists
    const existingAchievement = this.achievements.find(a => a.name === name);
    if (existingAchievement) {
        return Promise.resolve(this);
    }
    
    this.achievements.push({
        name,
        description,
        datReward
    });
    
    return this.addDatTokens(datReward, `Achievement unlocked: ${name}`, { achievement: name });
};

module.exports = mongoose.models.Wallet || mongoose.model('Wallet', WalletSchema);
