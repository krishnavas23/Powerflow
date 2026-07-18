const mongoose = require('mongoose');

const KycDocumentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  category: {
    type: String,
    enum: ['Individual', 'Organization'],
    required: true,
  },
  docType: {
    type: String,
    enum: ['Aadhaar', 'PAN', 'GST', 'Passport', 'Other'],
    required: true,
  },
  filename: { type: String, required: true },
  contentType: { type: String, required: true },
  base64: { type: String, required: true },
  size: { type: Number, required: true },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
}, { timestamps: true });

module.exports = mongoose.models.KycDocument || mongoose.model('KycDocument', KycDocumentSchema);
