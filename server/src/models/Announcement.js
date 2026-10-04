const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['menu', 'event', 'impact'], required: true },
    title: { type: String, required: true, trim: true, maxlength: 100 },
    message: { type: String, required: true, trim: true, maxlength: 500 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    publishedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Announcement', announcementSchema);