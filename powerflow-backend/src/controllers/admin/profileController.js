const User = require('../../models/User');
const bcrypt = require('bcryptjs');

// @desc    Get Profile (admin page uses this for prefill)
// @route   GET /api/admin/profile
// @access  Private (Authenticated)
exports.getAdminProfile = async (req, res) => {
  try {
    res.status(200).json({
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        accountType: req.user.accountType,
      },
    });
  } catch (err) {
    console.error('Error fetching admin profile:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update Admin Profile
// @route   PUT /api/admin/profile
// @access  Private (Admin only)
exports.updateAdminProfile = async (req, res) => {
  try {
    if (String(req.user.role).toLowerCase() !== 'admin') {
      return res.status(403).json({ message: 'Access denied: Admins only' });
    }

    const { name, email, password } = req.body;
    const admin = await User.findById(req.user._id).select('+passwordHash');

    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    if (name) admin.name = name;
    if (email) admin.email = email;

    if (password) {
      const salt = await bcrypt.genSalt(10);
      admin.passwordHash = await bcrypt.hash(password, salt);
    }

    await admin.save();

    res.status(200).json({
      message: 'Profile updated successfully',
      user: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        accountType: admin.accountType,
      },
    });
  } catch (err) {
    console.error('Error updating admin profile:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};
