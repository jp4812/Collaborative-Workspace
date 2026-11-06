const mongoose = require('mongoose');

const OtpCodeSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    index: true
  },
  purpose: {
    type: String,
    enum: ['register', 'reset', 'login'],
    required: true
  },
  codeHash: {
    type: String,
    required: true
  },
  attempts: {
    type: Number,
    default: 0
  },
  maxAttempts: {
    type: Number,
    default: 5
  },
  consumedAt: {
    type: Date,
    default: null
  },
  ip: {
    type: String
  },
  expiresAt: {
    type: Date,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// TTL Index: automatically delete document shortly after expiresAt
OtpCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Compound index for querying latest code for specific email & purpose
OtpCodeSchema.index({ email: 1, purpose: 1, createdAt: -1 });

module.exports = mongoose.model('OtpCode', OtpCodeSchema);

