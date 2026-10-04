const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema(
  {
    itemName: { type: String, required: true, unique: true, trim: true },
    unit: { type: String, required: true, enum: ['kg', 'g', 'litre', 'ml', 'piece', 'dozen', 'pack'] },
    quantityInStock: { type: Number, required: true, min: 0 },
    reorderThreshold: { type: Number, required: true, min: 0 },
    // Per-meal deduction rates (per student served)
    consumptionPerStudent: {
      breakfast: { type: Number, default: 0 },
      lunch: { type: Number, default: 0 },
      dinner: { type: Number, default: 0 },
    },
    costPerUnit: { type: Number, default: 0 },
    supplier: { type: String, trim: true },
    lastRestockedAt: { type: Date },
    lowStockAlertSent: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Inventory', inventorySchema);
