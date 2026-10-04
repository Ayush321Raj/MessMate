const express = require('express');
const { body } = require('express-validator');
const WasteLog = require('../models/WasteLog');
const { protect, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

const router = express.Router();
const categories = ['food', 'preparation', 'packaging', 'other'];
const segregationTypes = ['wet', 'dry', 'recyclable'];
const units = ['kg', 'g', 'litre', 'ml', 'piece', 'pack'];

router.get('/', protect, authorize('admin', 'kitchen'), async (req, res, next) => {
  try {
    const entries = await WasteLog.find()
      .populate('meal', 'date mealType')
      .populate('loggedBy', 'name role')
      .sort({ recordedAt: -1 })
      .limit(100);
    res.json({ success: true, entries });
  } catch (err) {
    next(err);
  }
});

router.post(
  '/',
  protect,
  authorize('admin', 'kitchen'),
  [
    body('category').isIn(categories),
    body('segregation').isIn(segregationTypes),
    body('quantity').isFloat({ gt: 0 }),
    body('unit').isIn(units),
    body('mealId').optional({ checkFalsy: true }).isMongoId(),
    body('notes').optional().trim().isLength({ max: 300 }),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { category, segregation, quantity, unit, mealId, notes } = req.body;
      const entry = await WasteLog.create({
        category,
        segregation,
        quantity,
        unit,
        meal: mealId || undefined,
        notes,
        loggedBy: req.user._id,
      });
      await entry.populate([
        { path: 'meal', select: 'date mealType' },
        { path: 'loggedBy', select: 'name role' },
      ]);
      res.status(201).json({ success: true, entry });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;