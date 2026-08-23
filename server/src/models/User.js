import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
    select: false, // Do not return password by default
  },
  role: {
    type: String,
    enum: ['admin', 'operator'],
    default: 'operator',
  },
  lastLogin: {
    type: Date,
    default: Date.now,
  }
}, {
  timestamps: true,
});

export const User = mongoose.models.User || mongoose.model('User', userSchema);
