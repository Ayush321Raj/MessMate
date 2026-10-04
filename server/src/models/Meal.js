const mongoose = require('mongoose');

const dishSchema = new mongoose.Schema({
  name: { type: String, required: true },
  imageUrl: { type: String },
  isVeg: { type: Boolean, default: true },
});

const mealSchema = new mongoose.Schema(
  {
    date: { type: Date, required: true },
    mealType: { type: String, enum: ['breakfast', 'lunch', 'dinner'], required: true },
    menuItems: [dishSchema],
    cutoffTime: { type: Date, required: true }, // Opt-in deadline
    pricePerHead: { type: Number, default: 0 },
    // Special day flag for AI forecasting
    specialDay: {
      isSpecial: { type: Boolean, default: false },
      label: { type: String }, // e.g. "Diwali", "Exam Week"
    },
    // Forecasted vs actual headcount (populated after meal)
    forecastedHeadcount: { type: Number, default: 0 },
    actualHeadcount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Compound index for unique meal per date+type
mealSchema.index({ date: 1, mealType: 1 }, { unique: true });

module.exports = mongoose.model('Meal', mealSchema);
