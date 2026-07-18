const mongoose = require('mongoose');

const DonationSchema = new mongoose.Schema({
  donor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  beneficiary: {
    type: String,
    required: true,
  },
  kwh: {
    type: Number,
    required: true,
    min: 0.1,
  },
  source: {
    type: String,
    default: 'Solar Rooftop',
  },
  location: {
    type: String,
  },
  status: {
    type: String,
    enum: ['COMPLETED', 'PENDING'],
    default: 'COMPLETED',
  },
}, { timestamps: true });

module.exports = mongoose.model('Donation', DonationSchema);
