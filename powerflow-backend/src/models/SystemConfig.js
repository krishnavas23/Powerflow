const mongoose = require('mongoose');

const systemConfigSchema = new mongoose.Schema({
    general: {
        platformName: { type: String, default: 'POWERFLOW' },
        supportEmail: { type: String, default: 'support@powerflow.io' },
        maintenanceMessage: { type: String, default: 'Platform undergoing maintenance' },
        maintenanceMode: { type: Boolean, default: false },
    },

    notifications: {
        email: {
            transactionConfirmations: { type: Boolean, default: true },
            lowBalanceAlerts: { type: Boolean, default: true },
            securityAlerts: { type: Boolean, default: false },
        },
        sms: {
            largeTransactionAlerts: { type: Boolean, default: true },
            dailySummary: { type: Boolean, default: false },
            accountChanges: { type: Boolean, default: true },
        },
        push: {
            transactionAlerts: { type: Boolean, default: true },
            promotionalUpdates: { type: Boolean, default: true },
        }
    },

    security: {
        sessionTimeout: { type: Number, default: 30 },
        maxLoginAttempts: { type: Number, default: 5 },
        accountLockDuration: { type: Number, default: 30 },
        passwordExpiryDays: { type: Number, default: 90 },
        require2FA: { type: Boolean, default: true },
        enableIPWhitelisting: { type: Boolean, default: true },
    },

    integrations: {
        stripe: {
            apiKey: { type: String, default: '' },
            active: { type: Boolean, default: false },
        },
        aws: {
            apiKey: { type: String, default: '' },
            active: { type: Boolean, default: false },
        },
        sendgrid: {
            apiKey: { type: String, default: '' },
            active: { type: Boolean, default: false },
        },
    },

    updatedAt: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('SystemConfig', systemConfigSchema);
