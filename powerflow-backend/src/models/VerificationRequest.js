const mongoose = require('mongoose');

const verificationRequestSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  documents: [
    {
      docType: { type: String, required: true }, // Aadhaar, PAN, etc.
      status: {
        type: String,
        enum: ['Pending', 'Under Review', 'Approved', 'Rejected'],
        default: 'Pending',
      },
      filename: String,
      contentType: String,
      base64: String,
      uploadedAt: { type: Date, default: Date.now },
    },
  ],
  overallStatus: {
    type: String,
    enum: ['Pending', 'Under Review', 'Approved', 'Rejected'],
    default: 'Pending',
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
  },
  reviewedAt: Date,
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('VerificationRequest', verificationRequestSchema);
