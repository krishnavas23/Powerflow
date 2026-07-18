const asyncHandler = require('express-async-handler');
const fs = require('fs');
const path = require('path');
const Profile = require('../../models/Profile');
const KycDocument = require('../../models/KycDocument');
const VerificationRequest = require('../../models/VerificationRequest');

// 🧭 Get or create profile
exports.getProfile = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  let profile = await Profile.findOne({ userId });
  if (!profile) profile = await Profile.create({ userId });
  res.json(profile);
});

// 🛠 Update profile info
exports.updateProfile = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const updates = req.body || {};
  const profile = await Profile.findOneAndUpdate(
    { userId },
    { $set: updates },
    { new: true, upsert: true }
  );
  res.json(profile);
});

// 📄 Upload KYC Document (links to Verification Request)
exports.uploadKyc = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // Accept JSON (base64 fields)
  const isMultipart = false;
  const {
    category,
    docType,
    filename: bodyFilename,
    contentType: bodyContentType,
    base64: bodyBase64,
    size: bodySize,
  } = req.body || {};

  const filename = bodyFilename;
  const contentType = bodyContentType;
  const size = Number(bodySize);
  const base64 = bodyBase64;

  if (!category || !docType || !filename || !contentType || !base64 || !size) {
    res.status(400);
    throw new Error('Missing required KYC fields.');
  }

  // 🧩 Store raw doc in DB (KycDocument model)
  const doc = await KycDocument.create({
    userId,
    category,
    docType,
    filename,
    contentType,
    base64,
    size,
  });

  // 🗂 Save to filesystem (better than storing base64)
  const uploadDir = path.join(__dirname, '../../../uploads/kyc');
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

  const safeFilename = `${userId}_${Date.now()}_${filename.replace(/\s+/g, '_')}`;
  const filePath = path.join(uploadDir, safeFilename);

  const base64Data = base64.replace(/^data:.+;base64,/, '');
  fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));
  const fileUrl = `/uploads/kyc/${path.basename(filePath)}`;

  // 🔍 Create or update verification request (align with model schema)
  let request = await VerificationRequest.findOne({ userId });
  const newDocEntry = {
    docType, // e.g., 'Aadhaar' | 'PAN' | 'GST' | 'Passport' | 'Other'
    status: 'Pending',
    filename: path.basename(filePath),
    contentType,
    base64, // optional in schema; stored for admin preview if needed
  };

  if (!request) {
    // New request
    request = await VerificationRequest.create({
      userId,
      overallStatus: 'Pending',
      documents: [newDocEntry],
    });
  } else {
    // Update existing verification
    const existing = request.documents.find((d) => String(d.docType).toLowerCase() === String(docType).toLowerCase());
    if (existing) {
      existing.filename = path.basename(filePath);
      existing.contentType = contentType;
      existing.base64 = base64;
      existing.status = 'Pending';
    } else {
      request.documents.push(newDocEntry);
    }
    request.overallStatus = 'Under Review';
    await request.save();
  }

  // 🧾 Sync profile with KYC status
  await Profile.findOneAndUpdate(
    { userId },
    { kycStatus: 'pending', kycCategory: category },
    { upsert: true }
  );

  res.status(201).json({
    message: 'KYC submitted for review',
    documentId: doc._id,
    requestId: request._id,
  });
});

// 🧭 Map UI docType → backend enum
function mapDocType(docType) {
  const key = docType.trim().toLowerCase();
  if (key.includes('aadhaar') || key.includes('id')) return 'ID_PROOF';
  if (key.includes('address')) return 'ADDRESS_PROOF';
  if (key.includes('bank')) return 'BANK_STATEMENT';
  return 'ID_PROOF';
}
