const express = require('express');
const { body } = require('express-validator');
const Announcement = require('../models/Announcement');
const { protect, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

const router = express.Router();

router.get('/', protect, async (req, res, next) => {
  try {
    const announcements = await Announcement.find()
      .populate('createdBy', 'name')
      .sort({ publishedAt: -1 })
      .limit(50);
    res.json({ success: true, announcements });
  } catch (err) {
    next(err);
  }
});

router.post(
  '/',
  protect,
  authorize('admin'),
  [
    body('type').isIn(['menu', 'event', 'impact']),
    body('title').trim().notEmpty().isLength({ max: 100 }),
    body('message').trim().notEmpty().isLength({ max: 500 }),
  ],
  validate,
  async (req, res, next) => {
    try {
      const announcement = await Announcement.create({
        type: req.body.type,
        title: req.body.title,
        message: req.body.message,
        createdBy: req.user._id,
      });
      await announcement.populate('createdBy', 'name');
      res.status(201).json({ success: true, announcement });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;