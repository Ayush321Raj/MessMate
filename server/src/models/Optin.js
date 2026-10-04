const mongoose = require('mongoose');

const optinSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    meal: { type: mongoose.Schema.Types.ObjectId, ref: 'Meal', required: true },
    status: { type: String, enum: ['opted-in', 'opted-out'], default: 'opted-in' },
    // QR token for this specific meal opt-in
    qrToken: { type: String, unique: true, sparse: true },
    qrTokenUsed: { type: Boolean, default: false },
    qrCodeImageUrl: { type: String }, // base64 or URL
    optedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// One optin record per student per meal
optinSchema.index({ student: 1, meal: 1 }, { unique: true });

module.exports = mongoose.model('Optin', optinSchema);
