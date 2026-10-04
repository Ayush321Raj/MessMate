const express = require('express');
const { body, query } = require('express-validator');
const Meal = require('../models/Meal');
const Optin = require('../models/Optin');
const { protect, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { generateToken, generateQRCode } = require('../utils/qrcode');
const { sendQRPassEmail } = require('../utils/email');

const router = express.Router();

// GET /api/meals — list meals (optionally filter by date range)
router.get('/', protect, async (req, res, next) => {
  try {
    const { startDate, endDate, mealType } = req.query;
    const filter = {};
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }
    if (mealType) filter.mealType = mealType;

    const meals = await Meal.find(filter).sort({ date: 1, mealType: 1 });

    // If student, also attach their optin status
    let optins = {};
    if (req.user.role === 'student') {
      const mealIds = meals.map((m) => m._id);
      const studentOptins = await Optin.find({ student: req.user._id, meal: { $in: mealIds } });
      studentOptins.forEach((o) => { optins[o.meal.toString()] = o; });
    }

    const data = meals.map((m) => ({
      ...m.toObject(),
      optin: optins[m._id.toString()] || null,
    }));

    res.json({ success: true, count: data.length, meals: data });
  } catch (err) {
    next(err);
  }
});

// GET /api/meals/:id
router.get('/:id', protect, async (req, res, next) => {
  try {
    const meal = await Meal.findById(req.params.id);
    if (!meal) return res.status(404).json({ success: false, message: 'Meal not found.' });
    res.json({ success: true, meal });
  } catch (err) {
    next(err);
  }
});

// POST /api/meals — admin creates a meal
router.post(
  '/',
  protect,
  authorize('admin'),
  [
    body('date').isISO8601().withMessage('Valid date required'),
    body('mealType').isIn(['breakfast', 'lunch', 'dinner']).withMessage('Invalid meal type'),
    body('cutoffTime').isISO8601().withMessage('Valid cutoff time required'),
    body('menuItems').isArray({ min: 1 }).withMessage('At least one menu item is required'),
    body('pricePerHead').isNumeric().withMessage('Price must be a number'),
  ],
  validate,
  async (req, res, next) => {
    try {
      const meal = await Meal.create(req.body);
      res.status(201).json({ success: true, meal });
    } catch (err) {
      if (err.code === 11000) {
        return res.status(409).json({ success: false, message: 'A meal of this type already exists for that date.' });
      }
      next(err);
    }
  }
);

// PUT /api/meals/:id
router.put('/:id', protect, authorize('admin'), async (req, res, next) => {
  try {
    const meal = await Meal.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!meal) return res.status(404).json({ success: false, message: 'Meal not found.' });
    res.json({ success: true, meal });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/meals/:id
router.delete('/:id', protect, authorize('admin'), async (req, res, next) => {
  try {
    await Meal.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Meal deleted.' });
  } catch (err) {
    next(err);
  }
});

// POST /api/meals/:id/optin — student opts into a meal
router.post('/:id/optin', protect, authorize('student'), async (req, res, next) => {
  try {
    const meal = await Meal.findById(req.params.id);
    if (!meal) return res.status(404).json({ success: false, message: 'Meal not found.' });
    if (new Date() > meal.cutoffTime) {
      return res.status(400).json({ success: false, message: 'Opt-in window has closed for this meal.' });
    }

    // Generate QR token
    const token = generateToken();
    const qrImage = await generateQRCode(token);

    const optin = await Optin.findOneAndUpdate(
      { student: req.user._id, meal: meal._id },
      { status: 'opted-in', qrToken: token, qrCodeImageUrl: qrImage, qrTokenUsed: false },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Send QR email (non-blocking)
    const mealLabel = `${meal.mealType.charAt(0).toUpperCase() + meal.mealType.slice(1)} — ${new Date(meal.date).toDateString()}`;
    sendQRPassEmail(req.user.email, req.user.name, mealLabel, qrImage).catch(console.error);

    res.json({ success: true, message: 'Opted in successfully. QR pass sent to your email.', optin });
  } catch (err) {
    next(err);
  }
});

// POST /api/meals/:id/optout — student opts out of a meal
router.post('/:id/optout', protect, authorize('student'), async (req, res, next) => {
  try {
    const meal = await Meal.findById(req.params.id);
    if (!meal) return res.status(404).json({ success: false, message: 'Meal not found.' });
    if (new Date() > meal.cutoffTime) {
      return res.status(400).json({ success: false, message: 'Opt-out window has closed for this meal.' });
    }

    const optin = await Optin.findOneAndUpdate(
      { student: req.user._id, meal: meal._id },
      { status: 'opted-out', qrToken: null, qrCodeImageUrl: null, qrTokenUsed: false },
      { upsert: true, new: true }
    );

    res.json({ success: true, message: 'Opted out successfully.', optin });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
