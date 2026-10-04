const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    meal: { type: mongoose.Schema.Types.ObjectId, ref: 'Meal', required: true },
    // Per-dish ratings
    dishRatings: [
      {
        dishName: { type: String, required: true },
        rating: { type: Number, min: 1, max: 5, required: true },
      },
    ],
    overallRating: { type: Number, min: 1, max: 5, required: true },
    comment: { type: String, maxlength: 500 },
    isAnonymous: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// One feedback per student per meal
feedbackSchema.index({ student: 1, meal: 1 }, { unique: true });

module.exports = mongoose.model('Feedback', feedbackSchema);
