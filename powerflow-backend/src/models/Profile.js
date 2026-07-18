const mongoose = require('mongoose');

const ProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  fullName: { type: String, trim: true },
  email: { type: String, trim: true },
  phone: { type: String, trim: true },
  city: { type: String, trim: true },
  country: { type: String, trim: true },
  address: { type: String, trim: true },
  bio: { type: String, trim: true },
  avatarUrl: { type: String, default: null },
  kycStatus: {
    type: String,
    enum: ['unverified', 'pending', 'verified', 'rejected'],
    default: 'unverified',
  },
  kycCategory: {
    type: String,
    enum: ['Individual', 'Organization'],
    default: 'Individual',
  },
}, { timestamps: true });

module.exports = mongoose.models.Profile || mongoose.model('Profile', ProfileSchema);
