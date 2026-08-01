const asyncHandler = require('express-async-handler');
const VerificationRequest = require('../../models/VerificationRequest');
const Profile = require('../../models/Profile');
const User = require('../../models/User');
const KycDocument = require('../../models/KycDocument');

// 📋 GET all verification requests
// Returns a FLAT list where EACH document is a separate item.
// This guarantees the UI reflects the exact number of KYC records in the DB.
exports.getAllVerifications = asyncHandler(async (req, res) => {
  // 1) Load all users map upfront
  const allUserIdsFromKyc = (await KycDocument.find().select('userId').lean()).map(d => String(d.userId));
  const allUserIdsFromReq = (await VerificationRequest.find().select('userId').lean()).map(d => String(d.userId));
  const allUserIds = Array.from(new Set([...allUserIdsFromKyc, ...allUserIdsFromReq]));
  const users = await User.find({ _id: { $in: allUserIds } }).select('name email').lean();
  const userMap = Object.fromEntries(users.map(u => [String(u._id), u]));

  const flat = [];

  // 2) Expand VerificationRequest documents into individual items
  // IMPORTANT: never include base64 in list response (too large; breaks admin UI)
  const requests = await VerificationRequest.find().populate('userId', 'name email').lean();
  for (const r of requests) {
    const uid = String(r.userId?._id || r.userId);
    if (Array.isArray(r.documents) && r.documents.length > 0) {
      for (const d of r.documents) {
        const status = (d.status || r.overallStatus || r.status || 'Pending').toString()
          .replace(/^pending$/i, 'Pending')
          .replace(/^under review$/i, 'Under Review')
          .replace(/^approved$/i, 'Approved')
          .replace(/^rejected$/i, 'Rejected');
        flat.push({
          _id: String(d._id || r._id),
          requestId: String(r._id),
          source: 'VerificationRequest',
          userId: r.userId || userMap[uid] || { _id: uid, name: 'User', email: '' },
          documents: [{
            docType: d.docType || d.type || 'Document',
            status,
            filename: d.filename,
            contentType: d.contentType,
            uploadedAt: d.uploadedAt || d.createdAt || r.createdAt,
          }],
          overallStatus: status,
          createdAt: d.uploadedAt || d.createdAt || r.createdAt,
          statusDate: r.reviewedAt || d.uploadedAt || r.createdAt,
        });
      }
    } else {
      // Request with no nested docs still shows as a queue item
      const status = (r.overallStatus || 'Pending').toString()
        .replace(/^pending$/i, 'Pending')
        .replace(/^under review$/i, 'Under Review')
        .replace(/^approved$/i, 'Approved')
        .replace(/^rejected$/i, 'Rejected');
      flat.push({
        _id: String(r._id),
        requestId: String(r._id),
        source: 'VerificationRequest',
        userId: r.userId || userMap[uid] || { _id: uid, name: 'User', email: '' },
        documents: [],
        overallStatus: status,
        createdAt: r.createdAt,
        statusDate: r.reviewedAt || r.createdAt,
      });
    }
  }

  // 3) Add KYC documents that aren't already represented (metadata only, no base64)
  const representedKeys = new Set(
    flat.map((i) => `${String(i.userId?._id || i.userId)}|${(i.documents[0] && i.documents[0].docType) || ''}|${(i.documents[0] && i.documents[0].filename) || ''}`)
  );
  const kycs = await KycDocument.find().select('-base64').lean();
  for (const d of kycs) {
    const uid = String(d.userId);
    const status = (d.status || 'pending').toString()
      .replace(/^pending$/i, 'Pending')
      .replace(/^approved$/i, 'Approved')
      .replace(/^rejected$/i, 'Rejected');
    const key = `${uid}|${d.docType}|${d.filename || ''}`;
    if (representedKeys.has(key)) continue;
    flat.push({
      _id: String(d._id),
      requestId: String(d._id),
      source: 'KycDocument',
      userId: userMap[uid] || { _id: uid, name: 'User', email: '' },
      documents: [{
        docType: d.docType,
        status,
        filename: d.filename,
        contentType: d.contentType,
        uploadedAt: d.createdAt,
      }],
      overallStatus: status,
      createdAt: d.createdAt,
      statusDate: d.updatedAt || d.createdAt,
    });
  }

  flat.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [kycPending, kycApprovedToday, kycRejectedToday] = await Promise.all([
    KycDocument.countDocuments({ status: 'pending' }),
    KycDocument.countDocuments({ status: 'approved', updatedAt: { $gte: today } }),
    KycDocument.countDocuments({ status: 'rejected', updatedAt: { $gte: today } }),
  ]);

  const vrAgg = await VerificationRequest.aggregate([
    { $unwind: { path: '$documents', preserveNullAndEmptyArrays: true } },
    {
      $group: {
        _id: null,
        pending: {
          $sum: {
            $cond: [
              { $in: [{ $ifNull: ['$documents.status', '$overallStatus'] }, ['Pending', 'pending']] },
              1,
              0,
            ],
          },
        },
        underReview: {
          $sum: {
            $cond: [{ $eq: ['$documents.status', 'Under Review'] }, 1, 0],
          },
        },
        approvedToday: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $in: ['$documents.status', ['Approved', 'approved']] },
                  { $gte: ['$reviewedAt', today] },
                ],
              },
              1,
              0,
            ],
          },
        },
        rejectedToday: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $in: ['$documents.status', ['Rejected', 'rejected']] },
                  { $gte: ['$reviewedAt', today] },
                ],
              },
              1,
              0,
            ],
          },
        },
      },
    },
  ]);
  const vrCounts = vrAgg[0] || { pending: 0, underReview: 0, approvedToday: 0, rejectedToday: 0 };

  // Prefer list-derived pending if aggregation undercounts empty-doc requests
  const listPending = flat.filter((i) => i.overallStatus === 'Pending').length;
  const listUnder = flat.filter((i) => i.overallStatus === 'Under Review').length;

  const counts = {
    pending: Math.max((vrCounts.pending || 0) + kycPending, listPending),
    underReview: Math.max(vrCounts.underReview || 0, listUnder),
    approvedToday: (vrCounts.approvedToday || 0) + kycApprovedToday,
    rejectedToday: (vrCounts.rejectedToday || 0) + kycRejectedToday,
  };

  res.json({ success: true, items: flat, counts, total: flat.length });
});

// 📄 GET single verification/doc by ID (request id, subdocument id, or KYC id)
exports.getVerificationById = asyncHandler(async (req, res) => {
  const id = req.params.id;
  // Try direct request id
  let request = await VerificationRequest.findById(id)
    .populate('userId', 'name email')
    .lean();

  // If not found, try finding a request that contains this document id
  if (!request) {
    const container = await VerificationRequest.findOne({ 'documents._id': id })
      .populate('userId', 'name email')
      .lean();
    if (container) {
      const doc = (container.documents || []).find(d => String(d._id) === String(id));
      if (!doc) {
        res.status(404);
        throw new Error('Document not found');
      }
      const contentType = doc.contentType || 'application/octet-stream';
      const base64Url = doc.base64 && !String(doc.base64).startsWith('data:')
        ? `data:${contentType};base64,${doc.base64}`
        : doc.base64;
      return res.json({
        _id: container._id,
        userId: container.userId,
        documents: [{
          docType: doc.docType || doc.type || 'Document',
          status: doc.status || 'Pending',
          filename: doc.filename,
          contentType,
          base64: base64Url,
          uploadedAt: doc.createdAt || container.createdAt,
        }],
        overallStatus: container.overallStatus || container.status || 'Pending',
        createdAt: container.createdAt,
      });
    }
  }

  // If still not found, try KYC document id
  if (!request) {
    const kyc = await KycDocument.findById(id).lean();
    if (!kyc) {
      res.status(404);
      throw new Error('Verification request not found');
    }
    const user = await User.findById(kyc.userId).select('name email').lean();
    return res.json({
      _id: kyc._id,
      userId: user || { _id: kyc.userId },
      documents: [{
        docType: kyc.docType || 'Document',
        status: kyc.status || 'Pending',
        filename: kyc.filename,
        contentType: kyc.contentType || 'application/octet-stream',
        base64: kyc.base64 && !String(kyc.base64).startsWith('data:') ? `data:${kyc.contentType || 'application/octet-stream'};base64,${kyc.base64}` : kyc.base64,
        uploadedAt: kyc.createdAt,
      }],
      overallStatus: kyc.status || 'Pending',
      createdAt: kyc.createdAt,
    });
  }

  const docs = Array.isArray(request.documents) ? request.documents : [];
  let enrichedDocs = docs.map((d) => {
    const contentType = d.contentType || 'application/octet-stream';
    // If already formatted as data URL, keep it. Else, build from base64 when present.
    const base64Url = d.base64 && !String(d.base64).startsWith('data:')
      ? `data:${contentType};base64,${d.base64}`
      : d.base64;
    return {
      docType: d.docType || d.type || 'Document',
      status: d.status || 'Pending',
      filename: d.filename,
      contentType,
      base64: base64Url,
      uploadedAt: d.createdAt || request.createdAt,
    };
  });

  // Fallback: if no docs or no base64 payloads, compose from KycDocument
  const needsFallback = enrichedDocs.length === 0 || enrichedDocs.every((d) => !d.base64);
  if (needsFallback && request.userId?._id) {
    const kycs = await KycDocument.find({ userId: request.userId._id }).sort({ createdAt: -1 }).lean();
    enrichedDocs = kycs.map((d) => ({
      docType: d.docType || 'Document',
      status: d.status || 'Pending',
      filename: d.filename,
      contentType: d.contentType || 'application/octet-stream',
      base64: d.base64 && !String(d.base64).startsWith('data:') ? `data:${d.contentType || 'application/octet-stream'};base64,${d.base64}` : d.base64,
      uploadedAt: d.createdAt,
    }));
  }

  res.json({
    _id: request._id,
    userId: request.userId,
    documents: enrichedDocs,
    overallStatus: request.overallStatus || request.status || 'Pending',
    createdAt: request.createdAt,
  });
});

// ✅ APPROVE verification or a single document (supports request id, subdoc id, or KYC id)
exports.approveVerification = asyncHandler(async (req, res) => {
  const id = req.params.id;
  const sendKycEmail = async (userId, status) => {
    try {
      const user = await User.findById(userId).select('name email');
      if (!user?.email || !process.env.EMAIL_USER) return;
      const nodemailer = require('nodemailer');
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
      });
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: user.email,
        subject: `PowerFlow KYC ${status}`,
        text: `Hi ${user.name || 'User'},\n\nYour KYC verification was ${status.toLowerCase()} by the PowerFlow admin team.\n\nThanks,\nPowerFlow`,
      });
    } catch (e) {
      console.error('KYC email failed:', e.message);
    }
  };

  // Try direct request approval
  let request = await VerificationRequest.findById(id);
  if (request) {
    request.overallStatus = 'Approved';
    request.documents.forEach((d) => (d.status = 'Approved'));
    request.reviewedAt = new Date();
    await request.save();
    await Profile.findOneAndUpdate({ userId: request.userId }, { kycStatus: 'verified' });
    await User.findByIdAndUpdate(request.userId, { isVerified: true });
    sendKycEmail(request.userId, 'Approved');
    return res.json({ message: 'Verification approved successfully', request });
  }

  // Try subdocument approval
  request = await VerificationRequest.findOne({ 'documents._id': id });
  if (request) {
    const document = request.documents.id(id);
    if (!document) {
      res.status(404);
      throw new Error('Document not found');
    }
    document.status = 'Approved';
    const docs = request.documents.map(d => d.status);
    request.overallStatus = docs.every(s => s === 'Approved') ? 'Approved' : docs.some(s => s === 'Rejected') ? 'Rejected' : docs.some(s => s === 'Pending') ? 'Under Review' : 'Under Review';
    request.reviewedAt = new Date();
    await request.save();
    if (request.overallStatus === 'Approved') {
      await Profile.findOneAndUpdate({ userId: request.userId }, { kycStatus: 'verified' });
      await User.findByIdAndUpdate(request.userId, { isVerified: true });
      sendKycEmail(request.userId, 'Approved');
    }
    return res.json({ message: 'Document approved', request });
  }

  // Try KYC doc
  const kyc = await KycDocument.findById(id);
  if (kyc) {
    kyc.status = 'approved';
    await kyc.save();
    await Profile.findOneAndUpdate({ userId: kyc.userId }, { kycStatus: 'verified' });
    await User.findByIdAndUpdate(kyc.userId, { isVerified: true });
    sendKycEmail(kyc.userId, 'Approved');
    return res.json({ message: 'KYC document approved', kyc });
  }

  res.status(404);
  throw new Error('Verification request/document not found');
});

// ❌ REJECT verification or single document (supports request id, subdoc id, or KYC id)
exports.rejectVerification = asyncHandler(async (req, res) => {
  const { remarks } = req.body;
  const id = req.params.id;
  const sendKycEmail = async (userId, status) => {
    try {
      const user = await User.findById(userId).select('name email');
      if (!user?.email || !process.env.EMAIL_USER) return;
      const nodemailer = require('nodemailer');
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
      });
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: user.email,
        subject: `PowerFlow KYC ${status}`,
        text: `Hi ${user.name || 'User'},\n\nYour KYC verification was ${status.toLowerCase()} by the PowerFlow admin team.${remarks ? `\nRemarks: ${remarks}` : ''}\n\nThanks,\nPowerFlow`,
      });
    } catch (e) {
      console.error('KYC email failed:', e.message);
    }
  };

  // Request-level reject
  let request = await VerificationRequest.findById(id);
  if (request) {
    request.overallStatus = 'Rejected';
    request.remarks = remarks || 'Rejected by admin';
    request.documents.forEach((d) => (d.status = 'Rejected'));
    request.reviewedAt = new Date();
    await request.save();
    await Profile.findOneAndUpdate({ userId: request.userId }, { kycStatus: 'rejected' });
    sendKycEmail(request.userId, 'Rejected');
    return res.json({ message: 'Verification rejected successfully', request });
  }

  // Subdocument-level reject
  request = await VerificationRequest.findOne({ 'documents._id': id });
  if (request) {
    const document = request.documents.id(id);
    if (!document) {
      res.status(404);
      throw new Error('Document not found');
    }
    document.status = 'Rejected';
    request.overallStatus = 'Rejected';
    request.reviewedAt = new Date();
    await request.save();
    await Profile.findOneAndUpdate({ userId: request.userId }, { kycStatus: 'rejected' });
    sendKycEmail(request.userId, 'Rejected');
    return res.json({ message: 'Document rejected', request });
  }

  // KYC doc-level reject
  const kyc = await KycDocument.findById(id);
  if (kyc) {
    kyc.status = 'rejected';
    await kyc.save();
    await Profile.findOneAndUpdate({ userId: kyc.userId }, { kycStatus: 'rejected' });
    sendKycEmail(kyc.userId, 'Rejected');
    return res.json({ message: 'KYC document rejected', kyc });
  }

  res.status(404);
  throw new Error('Verification request/document not found');
});

// 🧩 UPDATE specific document status (e.g. ID proof → approved)
exports.updateDocumentStatus = asyncHandler(async (req, res) => {
  const { docType, status } = req.body;

  const request = await VerificationRequest.findById(req.params.id);
  if (!request) {
    res.status(404);
    throw new Error('Verification request not found');
  }

  const document = request.documents.find(
    (d) => String(d.docType || d.type).toLowerCase() === String(docType).toLowerCase()
  );

  if (!document) {
    res.status(404);
    throw new Error(`Document type ${docType} not found`);
  }

  const normalized = String(status).toLowerCase();
  document.status = normalized === 'approved' ? 'Approved' : normalized === 'rejected' ? 'Rejected' : 'Pending';
  request.overallStatus = document.status === 'Pending' ? 'Under Review' : document.status;
  await request.save();

  res.json({ message: `Document ${docType} marked as ${status}`, request });
});
