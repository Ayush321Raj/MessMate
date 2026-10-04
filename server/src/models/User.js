const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: ['student', 'admin', 'kitchen'], default: 'student' },
    department: { type: String, trim: true },
    roomNumber: { type: String, trim: true },
    rfidCardId: { type: String, unique: true, sparse: true },
    avatar: { type: String },
    isActive: { type: Boolean, default: true },
    // Billing plan
    messSubscription: {
      isSubscribed: { type: Boolean, default: false },
      plan: { type: String, enum: ['full', 'lunch-only', 'custom', null], default: null },
      startDate: { type: Date },
    },
  },
  { timestamps: true }
);

// Hash password before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare passwords
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
