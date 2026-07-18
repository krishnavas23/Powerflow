const mongoose = require('mongoose');

const meterReadingSchema = new mongoose.Schema({
  meterId: {
    type: String,
    required: true,
    index: true,
    ref: 'User',
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true,
  },
  voltage: Number,
  current: Number,
  powerFactor: Number,
  activePowerKW: Number,
  cumulativeKWh: Number,
  status: {
    type: String,
    enum: ['OK', 'FAULT', 'OFFLINE'],
    default: 'OK',
  },
}, { timestamps: true });

meterReadingSchema.index({ meterId: 1, timestamp: -1 });

module.exports = mongoose.models.MeterReading || mongoose.model('MeterReading', meterReadingSchema);
