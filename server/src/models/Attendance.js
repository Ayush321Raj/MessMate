const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    meal: { type: mongoose.Schema.Types.ObjectId, ref: 'Meal', required: true },
    optin: { type: mongoose.Schema.Types.ObjectId, ref: 'Optin' },
    scanMethod: { type: String, enum: ['qr', 'rfid'], required: true },
    tokenOrCardId: { type: String, required: true },
    scannedAt: { type: Date, default: Date.now },
    scannedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // kitchen staff
    status: { type: String, enum: ['success', 'invalid', 'duplicate', 'expired'], required: true },
    denialReason: { type: String }, // populated if status != success
  },
  { timestamps: true }
);

module.exports = mongoose.model('Attendance', attendanceSchema);
