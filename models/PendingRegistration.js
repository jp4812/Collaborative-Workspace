const mongoose = require('mongoose');

const PendingRegistrationSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    index: true
  },
  payload: {
    org_name: { type: String, required: true, trim: true },
    org_id: { type: String, required: true, trim: true, uppercase: true },
    allowed_domains: [{ type: String, lowercase: true, trim: true }],
    website: { type: String, trim: true, default: '' },
    description: { type: String, trim: true, default: '' },
    admin_name: { type: String, required: true, trim: true },
    passwordHash: { type: String, required: true }
  },
  expiresAt: {
    type: Date,
    required: true
  }
}, {
  timestamps: true
});

// TTL Index: automatically delete document shortly after expiresAt
PendingRegistrationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('PendingRegistration', PendingRegistrationSchema);

