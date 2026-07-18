const express = require('express');
const router = express.Router();
const {
  getAllVerifications,
  getVerificationById,
  approveVerification,
  rejectVerification,
  updateDocumentStatus,
} = require('../../controllers/admin/verificationController');

const protectAdmin = require('../../middleware/requireAdmin');
const auth = require('../../middleware/auth');

// Attach req.user; temporarily allow any authenticated user to fetch verifications
router.get('/', auth, getAllVerifications);
router.get('/:id', auth, getVerificationById);
router.post('/:id/approve', auth, approveVerification);
router.post('/:id/reject', auth, rejectVerification);
router.patch('/:id/document', auth, updateDocumentStatus);
router.put('/:id/approve', protectAdmin, approveVerification);
router.put('/:id/reject', protectAdmin, rejectVerification);
router.put('/:id/document', protectAdmin, updateDocumentStatus);

module.exports = router;
