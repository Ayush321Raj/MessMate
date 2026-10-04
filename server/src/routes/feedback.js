const express = require('express');
const { body } = require('express-validator');
const Feedback = require('../models/Feedback');
const { protect, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

const router = express.Router();

// POST /api/feedback — student submits feedback
router.post(
  '/',
  protect,
  authorize('student'),
  [
    body('mealId').notEmpty().withMessage('mealId is required'),
    body('overallRating').isInt({ min: 1, max: 5 }).withMessage('Overall rating must be 1–5'),
    body('dishRatings').isArray().withMessage('dishRatings must be an array'),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { mealId, dishRatings, overallRating, comment, isAnonymous } = req.body;
      const feedback = await Feedback.findOneAndUpdate(
        { student: req.user._id, meal: mealId },
        { dishRatings, overallRating, comment, isAnonymous },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      res.status(201).json({ success: true, feedback });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/feedback/meal/:mealId — get aggregated feedback for a meal (admin/kitchen)
router.get('/meal/:mealId', protect, authorize('admin', 'kitchen'), async (req, res, next) => {
  try {
    const feedbacks = await Feedback.find({ meal: req.params.mealId })
      .populate('student', 'name')
      .sort({ createdAt: -1 });

    // Aggregate ratings
    const count = feedbacks.length;
    const avgOverall = count ? (feedbacks.reduce((s, f) => s + f.overallRating, 0) / count).toFixed(1) : 0;

    // Per-dish average
    const dishMap = {};
    feedbacks.forEach((f) => {
      f.dishRatings.forEach((d) => {
        if (!dishMap[d.dishName]) dishMap[d.dishName] = { total: 0, count: 0 };
        dishMap[d.dishName].total += d.rating;
        dishMap[d.dishName].count += 1;
      });
    });
    const dishAverages = Object.entries(dishMap).map(([name, v]) => ({
      dishName: name,
      avgRating: (v.total / v.count).toFixed(1),
      count: v.count,
    }));

    res.json({ success: true, count, avgOverall, dishAverages, feedbacks });
  } catch (err) {
    next(err);
  }
});

// GET /api/feedback/my — student views their own feedback
router.get('/my', protect, authorize('student'), async (req, res, next) => {
  try {
    const feedbacks = await Feedback.find({ student: req.user._id }).populate('meal').sort({ createdAt: -1 });
    res.json({ success: true, feedbacks });
  } catch (err) {
    next(err);
  }
});

// GET /api/feedback/summary — admin summary: top/bottom dishes
router.get('/summary', protect, authorize('admin'), async (req, res, next) => {
  try {
    const all = await Feedback.find();
    const dishMap = {};
    all.forEach((f) => {
      f.dishRatings.forEach((d) => {
        if (!dishMap[d.dishName]) dishMap[d.dishName] = { total: 0, count: 0 };
        dishMap[d.dishName].total += d.rating;
        dishMap[d.dishName].count += 1;
      });
    });
    const dishes = Object.entries(dishMap).map(([name, v]) => ({
      dishName: name,
      avgRating: parseFloat((v.total / v.count).toFixed(2)),
      count: v.count,
    })).sort((a, b) => b.avgRating - a.avgRating);

    res.json({
      success: true,
      topDishes: dishes.slice(0, 5),
      bottomDishes: dishes.slice(-5).reverse(),
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
