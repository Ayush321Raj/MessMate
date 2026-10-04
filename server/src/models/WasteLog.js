const mongoose = require('mongoose');

const wasteLogSchema = new mongoose.Schema(
  {
    category: { type: String, enum: ['food', 'preparation', 'packaging', 'other'], required: true },
    segregation: { type: String, enum: ['wet', 'dry', 'recyclable'], required: true },
    quantity: { type: Number, required: true, min: 0.01 },
    unit: { type: String, enum: ['kg', 'g', 'litre', 'ml', 'piece', 'pack'], default: 'kg' },
    meal: { type: mongoose.Schema.Types.ObjectId, ref: 'Meal' },
    notes: { type: String, trim: true, maxlength: 300 },
    loggedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    recordedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

wasteLogSchema.index({ recordedAt: -1, category: 1, segregation: 1 });

module.exports = mongoose.model('WasteLog', wasteLogSchema);