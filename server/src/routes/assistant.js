const express = require('express');
const axios = require('axios');
const { body } = require('express-validator');
const Attendance = require('../models/Attendance');
const Bill = require('../models/Bill');
const Meal = require('../models/Meal');
const { protect, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

const router = express.Router();

router.post(
  '/chat',
  protect,
  authorize('student'),
  [body('message').isString().trim().isLength({ min: 1, max: 1000 })],
  validate,
  async (req, res, next) => {
    try {
      const now = new Date();
      const startOfDay = new Date(now);
      startOfDay.setHours(0, 0, 0, 0);
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const tomorrow = new Date(startOfDay);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const [meals, attendance, bill] = await Promise.all([
        Meal.find({ date: { $gte: startOfDay, $lt: tomorrow } }).sort({ mealType: 1 }),
        Attendance.find({
          student: req.user._id,
          status: 'success',
          scannedAt: { $gte: startOfMonth, $lt: tomorrow },
        }).populate('meal', 'mealType pricePerHead date menuItems'),
        Bill.findOne({ student: req.user._id, month: now.getMonth() + 1, year: now.getFullYear() }),
      ]);

      const mealCharges = attendance
        .filter((entry) => entry.meal)
        .map((entry) => ({
          mealType: entry.meal.mealType,
          date: entry.scannedAt.toISOString().slice(0, 10),
          amount: entry.meal.pricePerHead || 0,
        }));
      const context = {
        today: now.toISOString().slice(0, 10),
        menu: meals.map((meal) => ({
          mealType: meal.mealType,
          items: meal.menuItems.map((item) => item.name),
          pricePerHead: meal.pricePerHead,
        })),
        monthToDateBilling: {
          amount: mealCharges.reduce((total, entry) => total + entry.amount, 0),
          successfulMeals: mealCharges.length,
          status: bill?.status || 'not generated',
          entries: mealCharges,
        },
      };

      const reply = await createReply(req.body.message, context);
      res.json({ success: true, reply });
    } catch (err) {
      next(err);
    }
  }
);

async function createReply(message, context) {
  const fallbackReply = createGroundedFallback(message, context);
  if (!process.env.OPENAI_API_KEY) return fallbackReply;

  try {
    const response = await axios.post(
      process.env.OPENAI_API_URL || 'https://api.openai.com/v1/chat/completions',
      {
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        temperature: 0.2,
        max_tokens: 250,
        messages: [
          {
            role: 'system',
            content: 'You are MessMate, a concise student mess assistant. Answer only with facts in the supplied JSON context. Never invent menu items, prices, attendance, or bill status. The month-to-date amount is an estimate from successful scans, not a payment or final statement. If the context does not contain the answer, say so and direct the student to the relevant MessMate screen.',
          },
          { role: 'user', content: `Context: ${JSON.stringify(context)}\nQuestion: ${message}` },
        ],
      },
      {
        timeout: 12000,
        headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      }
    );
    return response.data.choices?.[0]?.message?.content?.trim() || fallbackReply;
  } catch (err) {
    console.error('Assistant provider request failed:', err.message);
    return fallbackReply;
  }
}

function createGroundedFallback(message, context) {
  const normalized = message.toLowerCase();
  if (/menu|food|breakfast|lunch|dinner|today/.test(normalized)) {
    if (!context.menu.length) return `There is no menu published for ${context.today} yet.`;
    return context.menu
      .map((meal) => `${capitalize(meal.mealType)}: ${meal.items.join(', ') || 'No items listed'}`)
      .join('\n');
  }

  if (/bill|billing|charge|amount|cost|owe|spend/.test(normalized)) {
    const { amount, successfulMeals, status } = context.monthToDateBilling;
    return `Your month-to-date total is ₹${amount.toFixed(2)} across ${successfulMeals} successful meal scans. Bill status: ${status}. This running total is not a final statement.`;
  }

  return 'I can help with today’s menu and your month-to-date meal charges. Try asking “What is for lunch today?” or “How much have I been charged this month?”';
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

module.exports = router;