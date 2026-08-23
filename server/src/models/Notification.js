import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  workflowId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workflow',
  },
  executionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Execution',
  },
  type: {
    type: String,
    enum: ['success', 'failure', 'info', 'warning'],
    default: 'info',
  },
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  isRead: {
    type: Boolean,
    default: false,
  }
}, {
  timestamps: true,
});

export const Notification = mongoose.models.Notification || mongoose.model('Notification', notificationSchema);
