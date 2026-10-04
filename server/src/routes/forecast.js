const express = require('express');
const axios = require('axios');
const Attendance = require('../models/Attendance');
const Meal = require('../models/Meal');
const Optin = require('../models/Optin');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// GET /api/forecast/:mealId — proxy to FastAPI microservice
router.get('/:mealId', protect, authorize('admin', 'kitchen'), async (req, res, next) => {
  try {
    const meal = await Meal.findById(req.params.mealId);
    if (!meal) return res.status(404).json({ success: false, message: 'Meal not found.' });

    // Gather historical data for the last 30 days of this meal type
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const historicalMeals = await Meal.find({
      mealType: meal.mealType,
      date: { $gte: thirtyDaysAgo, $lt: meal.date },
    }).sort({ date: 1 });

    const historicalData = await Promise.all(
      historicalMeals.map(async (hm) => {
        const optinCount = await Optin.countDocuments({ meal: hm._id, status: 'opted-in' });
        const attendanceCount = await Attendance.countDocuments({ meal: hm._id, status: 'success' });
        return {
          date: hm.date.toISOString().split('T')[0],
          mealType: hm.mealType,
          optinCount,
          attendanceCount,
          dayOfWeek: hm.date.getDay(),
          isSpecialDay: hm.specialDay?.isSpecial || false,
        };
      })
    );

    // Current meal's optin count
    const currentOptinCount = await Optin.countDocuments({ meal: meal._id, status: 'opted-in' });

    // Call FastAPI microservice
    const aiRes = await axios.post(`${process.env.AI_SERVICE_URL}/forecast`, {
      meal_id: meal._id.toString(),
      meal_type: meal.mealType,
      target_date: meal.date.toISOString().split('T')[0],
      current_optins: currentOptinCount,
      is_special_day: meal.specialDay?.isSpecial || false,
      special_day_label: meal.specialDay?.label || null,
      historical_data: historicalData,
    });

    // Store forecast on meal
    await Meal.findByIdAndUpdate(req.params.mealId, { forecastedHeadcount: aiRes.data.forecasted_headcount });

    res.json({
      success: true,
      mealId: meal._id,
      mealType: meal.mealType,
      date: meal.date,
      currentOptins: currentOptinCount,
      forecastedHeadcount: aiRes.data.forecasted_headcount,
      confidence: aiRes.data.confidence,
      model: aiRes.data.model_used,
    });
  } catch (err) {
    if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
      return res.status(503).json({ success: false, message: 'AI forecasting service is unavailable. Using fallback.', forecastedHeadcount: null });
    }
    next(err);
  }
});

module.exports = router;
