const express = require('express');
const Attendance = require('../models/Attendance');
const Meal = require('../models/Meal');
const Optin = require('../models/Optin');
const Inventory = require('../models/Inventory');
const Bill = require('../models/Bill');
const User = require('../models/User');
const Feedback = require('../models/Feedback');
const { protect, authorize } = require('../middleware/auth');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');

const router = express.Router();

// GET /api/analytics/attendance?startDate=&endDate=
router.get('/attendance', protect, authorize('admin', 'kitchen'), async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const matchStage = { status: 'success' };
    if (startDate || endDate) {
      matchStage.scannedAt = {};
      if (startDate) matchStage.scannedAt.$gte = new Date(startDate);
      if (endDate) matchStage.scannedAt.$lte = new Date(endDate);
    }

    const daily = await Attendance.aggregate([
      { $match: matchStage },
      {
        $lookup: {
          from: 'meals',
          localField: 'meal',
          foreignField: '_id',
          as: 'mealData',
        },
      },
      { $unwind: '$mealData' },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$scannedAt' } },
            mealType: '$mealData.mealType',
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.date': 1 } },
    ]);

    // Forecast vs actual per meal
    const meals = await Meal.find(
      startDate || endDate
        ? { date: matchStage.scannedAt }
        : {}
    ).select('date mealType forecastedHeadcount actualHeadcount');

    res.json({ success: true, dailyAttendance: daily, forecastVsActual: meals });
  } catch (err) {
    next(err);
  }
});

// GET /api/analytics/caterer — operational forecasts and dish quality
router.get('/caterer', protect, authorize('admin', 'kitchen'), async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekEnd = new Date(today);
    weekEnd.setDate(weekEnd.getDate() + 7);
    const historyStart = new Date(today);
    historyStart.setDate(historyStart.getDate() - 30);

    const [recentMeals, upcomingMeals] = await Promise.all([
      Meal.find({ date: { $gte: historyStart, $lt: today }, actualHeadcount: { $gt: 0 } })
        .select('date mealType forecastedHeadcount actualHeadcount')
        .sort({ date: -1 }),
      Meal.find({ date: { $gte: today, $lt: weekEnd } })
        .select('date mealType menuItems forecastedHeadcount actualHeadcount')
        .sort({ date: 1, mealType: 1 }),
    ]);

    const feedbacks = recentMeals.length
      ? await Feedback.find({ meal: { $in: recentMeals.map((meal) => meal._id) } }).select('dishRatings')
      : [];
    const dishRatings = {};
    feedbacks.forEach((feedback) => {
      feedback.dishRatings.forEach(({ dishName, rating }) => {
        if (!dishRatings[dishName]) dishRatings[dishName] = { total: 0, count: 0 };
        dishRatings[dishName].total += rating;
        dishRatings[dishName].count += 1;
      });
    });

    const dishQuality = Object.entries(dishRatings)
      .map(([dishName, rating]) => ({
        dishName,
        avgRating: Number((rating.total / rating.count).toFixed(1)),
        responses: rating.count,
      }))
      .sort((left, right) => left.avgRating - right.avgRating);

    const mealPlans = await Promise.all(upcomingMeals.map(async (meal) => {
      const comparableMeals = recentMeals.filter(
        (recent) => recent.mealType === meal.mealType && recent.forecastedHeadcount > 0
      );
      const optinCount = await Optin.countDocuments({ meal: meal._id, status: 'opted-in' });
      const averageVariance = comparableMeals.length
        ? comparableMeals.reduce(
          (total, recent) => total + ((recent.actualHeadcount - recent.forecastedHeadcount) / recent.forecastedHeadcount) * 100,
          0
        ) / comparableMeals.length
        : null;

      let quantityRecommendation = 'Not enough recent forecast data to compare demand.';
      if (averageVariance !== null && averageVariance > 10) {
        quantityRecommendation = `Recent ${meal.mealType} attendance averaged ${averageVariance.toFixed(0)}% above forecast; review the preparation target.`;
      } else if (averageVariance !== null && averageVariance < -10) {
        quantityRecommendation = `Recent ${meal.mealType} attendance averaged ${Math.abs(averageVariance).toFixed(0)}% below forecast; review the batch size.`;
      } else if (averageVariance !== null) {
        quantityRecommendation = 'Recent attendance was generally close to forecast.';
      }

      return {
        _id: meal._id,
        date: meal.date,
        mealType: meal.mealType,
        menuItems: meal.menuItems.map((item) => item.name),
        forecastedHeadcount: meal.forecastedHeadcount,
        optinCount,
        quantityRecommendation,
      };
    }));

    const qualityRecommendations = dishQuality
      .filter((dish) => dish.responses >= 3 && dish.avgRating < 3.5)
      .map((dish) => ({
        type: 'quality',
        dishName: dish.dishName,
        message: `Review the quality of ${dish.dishName}; its recent rating is ${dish.avgRating}/5.`,
      }));

    res.json({
      success: true,
      upcomingMeals: mealPlans,
      dishQuality,
      qualityRecommendations,
      periodDays: 30,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/analytics/wastage — food waste estimate
router.get('/wastage', protect, authorize('admin'), async (req, res, next) => {
  try {
    const meals = await Meal.find({ actualHeadcount: { $gt: 0 }, forecastedHeadcount: { $gt: 0 } })
      .sort({ date: -1 })
      .limit(30);

    const wastageData = meals.map((m) => {
      const excess = Math.max(0, m.forecastedHeadcount - m.actualHeadcount);
      const wastePct = m.forecastedHeadcount > 0 ? ((excess / m.forecastedHeadcount) * 100).toFixed(1) : 0;
      return {
        date: m.date.toISOString().split('T')[0],
        mealType: m.mealType,
        forecasted: m.forecastedHeadcount,
        actual: m.actualHeadcount,
        excess,
        wastePercent: parseFloat(wastePct),
      };
    });

    const avgWaste = wastageData.length
      ? (wastageData.reduce((s, d) => s + d.wastePercent, 0) / wastageData.length).toFixed(1)
      : 0;

    res.json({ success: true, wastageData, avgWastePercent: parseFloat(avgWaste) });
  } catch (err) {
    next(err);
  }
});

// GET /api/analytics/cost-per-meal
router.get('/cost-per-meal', protect, authorize('admin'), async (req, res, next) => {
  try {
    const meals = await Meal.find({ actualHeadcount: { $gt: 0 } }).sort({ date: -1 }).limit(30);
    const inventoryItems = await Inventory.find();
    const totalInventoryCost = inventoryItems.reduce((s, i) => s + i.quantityInStock * i.costPerUnit, 0);
    const totalMeals = meals.reduce((s, m) => s + m.actualHeadcount, 0);
    const costPerMeal = totalMeals > 0 ? (totalInventoryCost / totalMeals).toFixed(2) : 0;

    res.json({ success: true, costPerMeal: parseFloat(costPerMeal), totalMeals, totalInventoryCost });
  } catch (err) {
    next(err);
  }
});

// GET /api/analytics/overview — dashboard summary cards
router.get('/overview', protect, authorize('admin'), async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [todayAttendance, totalStudents, lowStockCount, pendingBills] = await Promise.all([
      Attendance.countDocuments({ status: 'success', scannedAt: { $gte: today, $lt: tomorrow } }),
      User.countDocuments({ role: 'student', isActive: true }),
      Inventory.countDocuments({ $expr: { $lte: ['$quantityInStock', '$reorderThreshold'] } }),
      Bill.countDocuments({ status: 'pending' }),
    ]);

    res.json({ success: true, todayAttendance, totalStudents, lowStockCount, pendingBills });
  } catch (err) {
    next(err);
  }
});

// GET /api/analytics/reports/attendance?format=pdf|excel
router.get('/reports/attendance', protect, authorize('admin'), async (req, res, next) => {
  try {
    const { format = 'excel', startDate, endDate } = req.query;
    const filter = { status: 'success' };
    if (startDate) filter.scannedAt = { $gte: new Date(startDate) };
    if (endDate) filter.scannedAt = { ...filter.scannedAt, $lte: new Date(endDate) };

    const records = await Attendance.find(filter)
      .populate('student', 'name email roomNumber')
      .populate('meal', 'date mealType')
      .sort({ scannedAt: -1 });

    if (format === 'excel') {
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet('Attendance');
      ws.columns = [
        { header: 'Student', key: 'student', width: 25 },
        { header: 'Email', key: 'email', width: 30 },
        { header: 'Room', key: 'room', width: 10 },
        { header: 'Meal Type', key: 'mealType', width: 14 },
        { header: 'Date', key: 'date', width: 14 },
        { header: 'Scanned At', key: 'scannedAt', width: 22 },
        { header: 'Method', key: 'method', width: 10 },
      ];
      records.forEach((r) => {
        ws.addRow({
          student: r.student?.name || 'N/A',
          email: r.student?.email || '',
          room: r.student?.roomNumber || '',
          mealType: r.meal?.mealType || '',
          date: r.meal?.date?.toISOString().split('T')[0] || '',
          scannedAt: r.scannedAt?.toISOString() || '',
          method: r.scanMethod,
        });
      });
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="attendance-report.xlsx"');
      await wb.xlsx.write(res);
      res.end();
    } else {
      res.status(400).json({ success: false, message: 'Only excel format supported for attendance reports.' });
    }
  } catch (err) {
    next(err);
  }
});

module.exports = router;
