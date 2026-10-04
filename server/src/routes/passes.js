const express = require('express');
const { body } = require('express-validator');
const Optin = require('../models/Optin');
const Attendance = require('../models/Attendance');
const Bill = require('../models/Bill');
const Meal = require('../models/Meal');
const Inventory = require('../models/Inventory');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { generateToken, generateQRCode } = require('../utils/qrcode');

const router = express.Router();

// POST /api/passes/generate — regenerate QR for a specific optin
router.post(
  '/generate',
  protect,
  authorize('student'),
  [body('mealId').notEmpty().withMessage('mealId is required')],
  validate,
  async (req, res, next) => {
    try {
      const meal = await Meal.findById(req.body.mealId);
      if (!meal) return res.status(404).json({ success: false, message: 'Meal not found.' });

      const optin = await Optin.findOne({ student: req.user._id, meal: meal._id, status: 'opted-in' });
      if (!optin) return res.status(404).json({ success: false, message: 'No active opt-in found for this meal.' });
      if (optin.qrTokenUsed) return res.status(400).json({ success: false, message: 'QR token already used.' });

      const token = generateToken();
      const qrImage = await generateQRCode(token);
      optin.qrToken = token;
      optin.qrCodeImageUrl = qrImage;
      optin.qrTokenUsed = false;
      await optin.save();

      res.json({ success: true, qrToken: token, qrCodeImageUrl: qrImage });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/passes/validate — scan QR or RFID at kitchen counter
router.post(
  '/validate',
  protect,
  authorize('kitchen', 'admin'),
  [
    body('mealId').notEmpty().withMessage('mealId is required'),
    body('scanMethod').isIn(['qr', 'rfid']).withMessage('scanMethod must be qr or rfid'),
    body('tokenOrCardId').notEmpty().withMessage('tokenOrCardId is required'),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { mealId, scanMethod, tokenOrCardId } = req.body;
      const io = req.app.get('io');

      const meal = await Meal.findById(mealId);
      if (!meal) return res.status(404).json({ success: false, message: 'Meal not found.' });

      let student = null;
      let optin = null;
      let denialReason = null;
      let attendanceStatus = 'invalid';

      if (scanMethod === 'qr') {
        // Find optin by QR token
        optin = await Optin.findOne({ qrToken: tokenOrCardId }).populate('student');
        if (!optin) {
          denialReason = 'Invalid QR token.';
        } else if (optin.meal.toString() !== mealId) {
          denialReason = 'QR token does not match this meal.';
        } else if (optin.status !== 'opted-in') {
          denialReason = 'Student did not opt in for this meal.';
        } else if (optin.qrTokenUsed) {
          attendanceStatus = 'duplicate';
          denialReason = 'QR token already used.';
        } else {
          student = optin.student;
          attendanceStatus = 'success';
        }
      } else if (scanMethod === 'rfid') {
        // Find student by RFID card
        student = await User.findOne({ rfidCardId: tokenOrCardId });
        if (!student) {
          denialReason = 'RFID card not registered.';
        } else {
          optin = await Optin.findOne({ student: student._id, meal: mealId });
          if (!optin || optin.status !== 'opted-in') {
            denialReason = 'Student has not opted in for this meal.';
          } else {
            // Check if already scanned today via RFID
            const existing = await Attendance.findOne({ student: student._id, meal: mealId, status: 'success' });
            if (existing) {
              attendanceStatus = 'duplicate';
              denialReason = 'RFID already scanned for this meal.';
            } else {
              attendanceStatus = 'success';
            }
          }
        }
      }

      // Log attendance
      const attendanceEntry = await Attendance.create({
        student: student ? student._id : null,
        meal: mealId,
        optin: optin ? optin._id : null,
        scanMethod,
        tokenOrCardId,
        scannedBy: req.user._id,
        status: attendanceStatus,
        denialReason: denialReason || undefined,
      });

      if (attendanceStatus === 'success') {
        // Mark QR token as used
        if (scanMethod === 'qr' && optin) {
          optin.qrTokenUsed = true;
          await optin.save();
        }

        const billMonth = attendanceEntry.scannedAt.getMonth() + 1;
        const billYear = attendanceEntry.scannedAt.getFullYear();
        const amount = meal.pricePerHead || 0;
        await Bill.updateOne(
          { student: student._id, month: billMonth, year: billYear },
          {
            $setOnInsert: { student: student._id, month: billMonth, year: billYear },
            $set: { status: 'pending' },
            $unset: { paidAt: 1 },
            $inc: {
              totalMealsConsumed: 1,
              totalMealsOptedIn: 1,
              grossAmount: amount,
              finalAmount: amount,
            },
            $push: {
              mealEntries: {
                attendance: attendanceEntry._id,
                meal: meal._id,
                mealType: meal.mealType,
                date: attendanceEntry.scannedAt,
                consumed: true,
                amount,
              },
            },
          },
          { upsert: true }
        );

        // Update meal actual headcount
        await Meal.findByIdAndUpdate(mealId, { $inc: { actualHeadcount: 1 } });

        // Auto-deduct inventory
        const inventoryItems = await Inventory.find({ [`consumptionPerStudent.${meal.mealType}`]: { $gt: 0 } });
        for (const item of inventoryItems) {
          const deduction = item.consumptionPerStudent[meal.mealType];
          item.quantityInStock = Math.max(0, item.quantityInStock - deduction);
          await item.save();
        }

        // Emit real-time headcount update
        const updatedMeal = await Meal.findById(mealId);
        io.to(`kitchen:${mealId}`).emit('headcount:update', {
          mealId,
          actualHeadcount: updatedMeal.actualHeadcount,
          studentName: student.name,
        });
        io.to('admin:dashboard').emit('headcount:update', {
          mealId,
          actualHeadcount: updatedMeal.actualHeadcount,
        });
        io.to(`student:${student._id}`).emit('billing:entry', {
          entry: {
            _id: attendanceEntry._id,
            mealType: meal.mealType,
            date: attendanceEntry.scannedAt,
            amount,
            status: 'pending',
          },
        });
      }

      res.json({
        success: attendanceStatus === 'success',
        status: attendanceStatus,
        message: attendanceStatus === 'success' ? `Entry granted. Welcome, ${student.name}!` : denialReason,
        attendance: attendanceEntry,
      });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/passes/my — student views their passes
router.get('/my', protect, authorize('student'), async (req, res, next) => {
  try {
    const optins = await Optin.find({ student: req.user._id, status: 'opted-in' })
      .populate('meal')
      .sort({ createdAt: -1 });
    res.json({ success: true, passes: optins });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
