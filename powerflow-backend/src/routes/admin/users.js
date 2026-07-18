const express = require('express');
const router = express.Router();
const {
  getUserStats,
  getAllUsers,
  createUser,
  suspendUser,
  activateUser,
} = require('../../controllers/admin/userManagementController');

const auth = require('../../middleware/auth');

// ✅ User management routes (ensure req.user is attached)
router.get('/stats', auth, getUserStats);
router.get('/', auth, getAllUsers);
router.post('/', auth, createUser);
router.put('/:id/suspend', auth, suspendUser);
router.put('/:id/activate', auth, activateUser);

module.exports = router;
