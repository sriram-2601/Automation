import mongoose from 'mongoose';

const workflowSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    default: '',
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'paused', 'archived'],
    default: 'draft',
  },
  triggerConfig: {
    type: {
      type: String,
      enum: ['manual', 'webhook', 'schedule', 'event'],
      default: 'manual',
    },
    schedule: {
      type: String, // Cron expression if schedule
      default: '',
    },
    webhookUrl: {
      type: String,
      default: '',
    },
    eventSource: {
      type: String, // e.g. "gmail", "slack"
      default: '',
    }
  },
  nodes: {
    type: Array,
    default: [],
  },
  edges: {
    type: Array,
    default: [],
  },
  version: {
    type: Number,
    default: 1,
  },
  tags: {
    type: [String],
    default: [],
  }
}, {
  timestamps: true,
});

export const Workflow = mongoose.models.Workflow || mongoose.model('Workflow', workflowSchema);
