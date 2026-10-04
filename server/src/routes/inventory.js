const express = require('express');
const { body } = require('express-validator');
const Inventory = require('../models/Inventory');
const { protect, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { sendLowStockAlert } = require('../utils/email');
const User = require('../models/User');

const router = express.Router();

// GET /api/inventory
router.get('/', protect, authorize('admin', 'kitchen'), async (req, res, next) => {
  try {
    const items = await Inventory.find().sort({ itemName: 1 });
    res.json({ success: true, count: items.length, inventory: items });
  } catch (err) {
    next(err);
  }
});

// GET /api/inventory/low-stock
router.get('/low-stock', protect, authorize('admin', 'kitchen'), async (req, res, next) => {
  try {
    const items = await Inventory.find({ $expr: { $lte: ['$quantityInStock', '$reorderThreshold'] } });
    res.json({ success: true, count: items.length, items });
  } catch (err) {
    next(err);
  }
});

// GET /api/inventory/:id
router.get('/:id', protect, authorize('admin', 'kitchen'), async (req, res, next) => {
  try {
    const item = await Inventory.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Item not found.' });
    res.json({ success: true, item });
  } catch (err) {
    next(err);
  }
});

// POST /api/inventory — create item
router.post(
  '/',
  protect,
  authorize('admin'),
  [
    body('itemName').trim().notEmpty().withMessage('Item name is required'),
    body('unit').isIn(['kg', 'g', 'litre', 'ml', 'piece', 'dozen', 'pack']).withMessage('Invalid unit'),
    body('quantityInStock').isNumeric({ min: 0 }).withMessage('Quantity must be a non-negative number'),
    body('reorderThreshold').isNumeric({ min: 0 }).withMessage('Reorder threshold must be a non-negative number'),
  ],
  validate,
  async (req, res, next) => {
    try {
      const item = await Inventory.create(req.body);
      res.status(201).json({ success: true, item });
    } catch (err) {
      if (err.code === 11000) return res.status(409).json({ success: false, message: 'Item already exists.' });
      next(err);
    }
  }
);

// PUT /api/inventory/:id
router.put('/:id', protect, authorize('admin'), async (req, res, next) => {
  try {
    const item = await Inventory.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!item) return res.status(404).json({ success: false, message: 'Item not found.' });

    // Check low stock after update and notify admin
    if (item.quantityInStock <= item.reorderThreshold && !item.lowStockAlertSent) {
      item.lowStockAlertSent = true;
      await item.save();
      const admins = await User.find({ role: 'admin' }).select('email');
      const adminEmails = admins.map((a) => a.email);
      if (adminEmails.length) {
        sendLowStockAlert(adminEmails.join(','), [item]).catch(console.error);
      }
      // Emit socket alert
      req.app.get('io').to('admin:dashboard').emit('inventory:low-stock', { item });
    }

    res.json({ success: true, item });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/inventory/:id
router.delete('/:id', protect, authorize('admin'), async (req, res, next) => {
  try {
    await Inventory.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Item deleted.' });
  } catch (err) {
    next(err);
  }
});

// POST /api/inventory/:id/restock
router.post('/:id/restock', protect, authorize('admin'), async (req, res, next) => {
  try {
    const { quantity } = req.body;
    if (!quantity || quantity <= 0) return res.status(400).json({ success: false, message: 'Quantity must be positive.' });
    const item = await Inventory.findByIdAndUpdate(
      req.params.id,
      { $inc: { quantityInStock: quantity }, lastRestockedAt: new Date(), lowStockAlertSent: false },
      { new: true }
    );
    if (!item) return res.status(404).json({ success: false, message: 'Item not found.' });
    res.json({ success: true, item });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
