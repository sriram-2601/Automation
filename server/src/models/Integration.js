import mongoose from 'mongoose';

const integrationSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  provider: {
    type: String,
    enum: ['gmail', 'slack', 'google-sheets', 'discord', 'openrouter', 'gemini'],
    required: true,
  },
  isConnected: {
    type: Boolean,
    default: false,
  },
  scopes: {
    type: [String],
    default: [],
  },
  // Store encrypted credentials as string "iv:encryptedData"
  encryptedAccessToken: {
    type: String,
    default: '',
  },
  encryptedRefreshToken: {
    type: String,
    default: '',
  },
  expiresAt: {
    type: Date,
  }
}, {
  timestamps: true,
});

// Ensure a user only has one integration document per provider
integrationSchema.index({ owner: 1, provider: 1 }, { unique: true });

export const Integration = mongoose.models.Integration || mongoose.model('Integration', integrationSchema);
