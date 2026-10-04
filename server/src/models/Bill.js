const mongoose = require('mongoose');

const mealEntrySchema = new mongoose.Schema({
  attendance: { type: mongoose.Schema.Types.ObjectId, ref: 'Attendance' },
  meal: { type: mongoose.Schema.Types.ObjectId, ref: 'Meal' },
  mealType: String,
  date: Date,
  consumed: { type: Boolean, default: false },
  amount: { type: Number, default: 0 },
});

const billSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    month: { type: Number, required: true }, // 1-12
    year: { type: Number, required: true },
    mealEntries: [mealEntrySchema],
    totalMealsConsumed: { type: Number, default: 0 },
    totalMealsOptedIn: { type: Number, default: 0 },
    grossAmount: { type: Number, default: 0 },
    rebateAmount: { type: Number, default: 0 }, // for opted-out meals
    finalAmount: { type: Number, default: 0 },
    status: { type: String, enum: ['pending', 'paid', 'overdue'], default: 'pending' },
    paidAt: { type: Date },
    generatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

billSchema.index({ student: 1, month: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('Bill', billSchema);
