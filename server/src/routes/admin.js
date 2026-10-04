const express = require('express');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');

const router = express.Router();

// GET /api/admin/users
router.get('/users', protect, authorize('admin'), async (req, res, next) => {
  try {
    const { role, search } = req.query;
    const filter = {};
    if (role) filter.role = role;
    if (search) filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
    const users = await User.find(filter).select('-password').sort({ createdAt: -1 });
    res.json({ success: true, count: users.length, users });
  } catch (err) {
    next(err);
  }
});

// PUT /api/admin/users/:id — update user (role, active status, RFID)
router.put(
  '/users/:id',
  protect,
  authorize('admin'),
  [
    body('role').optional().isIn(['student', 'admin', 'kitchen']),
    body('isActive').optional().isBoolean(),
    body('rfidCardId').optional().trim(),
  ],
  validate,
  async (req, res, next) => {
    try {
      const allowed = ['role', 'isActive', 'rfidCardId', 'department', 'roomNumber', 'name'];
      const updates = {};
      allowed.forEach((k) => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });
      const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true }).select('-password');
      if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
      res.json({ success: true, user });
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /api/admin/users/:id
router.delete('/users/:id', protect, authorize('admin'), async (req, res, next) => {
  try {
    if (req.user._id.toString() === req.params.id) {
      return res.status(400).json({ success: false, message: 'Cannot delete your own account.' });
    }
    await User.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ success: true, message: 'User deactivated.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
