const mongoose = require('mongoose');

const energyListingSchema = new mongoose.Schema({
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  kwhAvailable: {
    type: Number,
    required: true,
    // Allow zero when a listing is fully sold out
    min: 0,
  },
  minPrice: {
    type: Number,
    required: true,
  },
  maxPrice: {
    type: Number,
    required: true,
  },
  demandPrice: {
    type: Number,
    required: true,
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
    enum: ['ACTIVE', 'SOLD', 'EXPIRED', 'DONATED'], // ✅ added DONATED
    default: 'ACTIVE',
  },
  isDonation: {
    type: Boolean,
    default: false, // ✅ new field to mark donations
  },
  beneficiary: {
    type: String, // NGO or hospital name
  },
}, { timestamps: true });

module.exports = mongoose.model('EnergyListing', energyListingSchema);
