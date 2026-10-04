const express = require('express');
const { body } = require('express-validator');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

const router = express.Router();

const signToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

// POST /api/auth/register
router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role').optional().isIn(['student', 'admin', 'kitchen']).withMessage('Invalid role'),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { name, email, password, role, department, roomNumber } = req.body;
      const existing = await User.findOne({ email });
      if (existing) {
        return res.status(409).json({ success: false, message: 'Email already registered.' });
      }
      const user = await User.create({ name, email, password, role: role || 'student', department, roomNumber });
      const token = signToken(user);
      res.status(201).json({
        success: true,
        message: 'Registration successful',
        token,
        user: { _id: user._id, name: user.name, email: user.email, role: user.role },
      });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/auth/login
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { email, password } = req.body;
      const user = await User.findOne({ email }).select('+password');
      if (!user || !(await user.comparePassword(password))) {
        return res.status(401).json({ success: false, message: 'Invalid email or password.' });
      }
      if (!user.isActive) {
        return res.status(403).json({ success: false, message: 'Account has been deactivated.' });
      }
      const token = signToken(user);
      res.json({
        success: true,
        token,
        user: { _id: user._id, name: user.name, email: user.email, role: user.role, department: user.department, roomNumber: user.roomNumber },
      });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/auth/me
router.get('/me', protect, (req, res) => {
  res.json({ success: true, user: req.user });
});

// PUT /api/auth/profile
router.put(
  '/profile',
  protect,
  [
    body('name').optional().trim().notEmpty(),
    body('department').optional().trim(),
    body('roomNumber').optional().trim(),
  ],
  validate,
  async (req, res, next) => {
    try {
      const updates = {};
      if (req.body.name) updates.name = req.body.name;
      if (req.body.department) updates.department = req.body.department;
      if (req.body.roomNumber) updates.roomNumber = req.body.roomNumber;
      const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true });
      res.json({ success: true, user });
    } catch (err) {
      next(err);
    }
  }
);

// PUT /api/auth/change-password
router.put(
  '/change-password',
  protect,
  [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
  ],
  validate,
  async (req, res, next) => {
    try {
      const user = await User.findById(req.user._id).select('+password');
      if (!(await user.comparePassword(req.body.currentPassword))) {
        return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
      }
      user.password = req.body.newPassword;
      await user.save();
      res.json({ success: true, message: 'Password changed successfully.' });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
