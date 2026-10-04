const express = require('express');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const Bill = require('../models/Bill');
const Attendance = require('../models/Attendance');
const Meal = require('../models/Meal');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');
const { sendBillEmail } = require('../utils/email');

const router = express.Router();

// GET /api/billing/ledger/:studentId?month=&year=
router.get('/ledger/:studentId', protect, async (req, res, next) => {
  try {
    if (req.user.role !== 'admin' && req.user._id.toString() !== req.params.studentId) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const currentDate = new Date();
    const month = Number(req.query.month) || currentDate.getMonth() + 1;
    const year = Number(req.query.year) || currentDate.getFullYear();
    if (month < 1 || month > 12 || year < 2000) {
      return res.status(400).json({ success: false, message: 'A valid month and year are required.' });
    }

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);
    const [attendance, bill] = await Promise.all([
      Attendance.find({
        student: req.params.studentId,
        status: 'success',
        scannedAt: { $gte: startDate, $lt: endDate },
      }).populate('meal', 'mealType pricePerHead'),
      Bill.findOne({ student: req.params.studentId, month, year }).select('status mealEntries'),
    ]);

    const entries = attendance.filter((record) => record.meal).map((record) => ({
      _id: record._id,
      mealType: record.meal.mealType,
      date: record.scannedAt,
      amount: bill?.mealEntries.find(
        (billEntry) => billEntry.attendance?.toString() === record._id.toString()
      )?.amount ?? record.meal.pricePerHead ?? 0,
      status: bill?.status || 'pending',
    }));

    res.json({
      success: true,
      month,
      year,
      totalMeals: entries.length,
      totalAmount: entries.reduce((total, entry) => total + entry.amount, 0),
      status: bill?.status || 'pending',
      entries,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/billing/:studentId — get bills for student
router.get('/:studentId', protect, async (req, res, next) => {
  try {
    // Students can only view their own bills; admins can view any
    if (req.user.role === 'student' && req.user._id.toString() !== req.params.studentId) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }
    const bills = await Bill.find({ student: req.params.studentId })
      .populate('student', 'name email roomNumber')
      .sort({ year: -1, month: -1 });
    res.json({ success: true, bills });
  } catch (err) {
    next(err);
  }
});

// POST /api/billing/generate — admin generates monthly bill for all students
router.post('/generate', protect, authorize('admin'), async (req, res, next) => {
  try {
    const { month, year } = req.body;
    if (!month || !year) return res.status(400).json({ success: false, message: 'Month and year are required.' });

    const students = await User.find({ role: 'student', isActive: true });
    const results = [];

    for (const student of students) {
      // Get all attended meals in this month/year
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59);

      const attendedRecords = await Attendance.find({
        student: student._id,
        status: 'success',
        scannedAt: { $gte: startDate, $lte: endDate },
      }).populate('meal');

      const mealEntries = attendedRecords.map((a) => ({
        attendance: a._id,
        meal: a.meal?._id,
        mealType: a.meal?.mealType,
        date: a.scannedAt,
        consumed: true,
        amount: a.meal?.pricePerHead || 0,
      }));

      const totalMealsConsumed = mealEntries.length;
      const grossAmount = mealEntries.reduce((sum, e) => sum + e.amount, 0);

      const bill = await Bill.findOneAndUpdate(
        { student: student._id, month, year },
        {
          mealEntries,
          totalMealsConsumed,
          totalMealsOptedIn: totalMealsConsumed,
          grossAmount,
          rebateAmount: 0,
          finalAmount: grossAmount,
        },
        { upsert: true, new: true }
      );

      // Send bill email
      sendBillEmail(student.email, student.name, month, year, grossAmount).catch(console.error);
      results.push(bill);
    }

    res.json({ success: true, message: `Bills generated for ${results.length} students.`, bills: results });
  } catch (err) {
    next(err);
  }
});

// GET /api/billing/:studentId/download?format=pdf|excel&month=&year=
router.get('/:studentId/download', protect, async (req, res, next) => {
  try {
    if (req.user.role === 'student' && req.user._id.toString() !== req.params.studentId) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }
    const { format = 'pdf', month, year } = req.query;
    const filter = { student: req.params.studentId };
    if (month) filter.month = Number(month);
    if (year) filter.year = Number(year);

    const bills = await Bill.find(filter)
      .populate('student', 'name email roomNumber department')
      .sort({ year: -1, month: -1 });

    if (!bills.length) return res.status(404).json({ success: false, message: 'No bills found.' });

    const student = bills[0].student;

    if (format === 'pdf') {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="bill-${student.name}-${month || 'all'}.pdf"`);

      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      doc.pipe(res);

      // Header
      doc.fontSize(22).fillColor('#16a34a').text('MessMate', { align: 'center' });
      doc.fontSize(14).fillColor('#1f2328').text('Mess Bill Statement', { align: 'center' });
      doc.moveDown();
      doc.fontSize(11).text(`Student: ${student.name}`);
      doc.text(`Email: ${student.email}`);
      doc.text(`Room: ${student.roomNumber || 'N/A'} | Department: ${student.department || 'N/A'}`);
      doc.moveDown();

      for (const bill of bills) {
        doc.fontSize(13).fillColor('#16a34a').text(`${getMonthName(bill.month)} ${bill.year}`);
        doc.fontSize(10).fillColor('#1f2328');
        doc.text(`Meals Consumed: ${bill.totalMealsConsumed}`);
        doc.text(`Gross Amount: ₹${bill.grossAmount.toFixed(2)}`);
        doc.text(`Rebate: -₹${bill.rebateAmount.toFixed(2)}`);
        doc.fontSize(12).text(`Total Due: ₹${bill.finalAmount.toFixed(2)}`, { underline: true });
        doc.text(`Status: ${bill.status.toUpperCase()}`);
        doc.moveDown();
        doc.moveTo(40, doc.y).lineTo(555, doc.y).strokeColor('#e5e7eb').stroke();
        doc.moveDown(0.5);
      }

      doc.end();
    } else if (format === 'excel') {
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'MessMate';
      const sheet = workbook.addWorksheet('Bill Statement');

      sheet.columns = [
        { header: 'Month', key: 'month', width: 12 },
        { header: 'Year', key: 'year', width: 8 },
        { header: 'Meals Consumed', key: 'mealsConsumed', width: 16 },
        { header: 'Gross Amount (₹)', key: 'gross', width: 18 },
        { header: 'Rebate (₹)', key: 'rebate', width: 14 },
        { header: 'Final Amount (₹)', key: 'final', width: 18 },
        { header: 'Status', key: 'status', width: 12 },
      ];

      bills.forEach((b) => {
        sheet.addRow({
          month: getMonthName(b.month),
          year: b.year,
          mealsConsumed: b.totalMealsConsumed,
          gross: b.grossAmount,
          rebate: b.rebateAmount,
          final: b.finalAmount,
          status: b.status,
        });
      });

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="bill-${student.name}-${month || 'all'}.xlsx"`);
      await workbook.xlsx.write(res);
      res.end();
    } else {
      res.status(400).json({ success: false, message: 'Invalid format. Use pdf or excel.' });
    }
  } catch (err) {
    next(err);
  }
});

// PUT /api/billing/:billId/mark-paid
router.put('/:billId/mark-paid', protect, authorize('admin'), async (req, res, next) => {
  try {
    const bill = await Bill.findByIdAndUpdate(req.params.billId, { status: 'paid', paidAt: new Date() }, { new: true });
    if (!bill) return res.status(404).json({ success: false, message: 'Bill not found.' });
    res.json({ success: true, bill });
  } catch (err) {
    next(err);
  }
});

function getMonthName(m) {
  return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][m - 1];
}

module.exports = router;
