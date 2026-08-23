import mongoose from 'mongoose';

const executionSchema = new mongoose.Schema({
  workflowId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workflow',
    required: true,
  },
  workflowSnapshot: {
    type: Object,
    required: true,
  },
  status: {
    type: String,
    enum: ['PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'RETRYING', 'PAUSED', 'CANCELLED'],
    default: 'PENDING',
  },
  currentNodeId: {
    type: String,
    default: '',
  },
  startTime: {
    type: Date,
    default: Date.now,
  },
  endTime: {
    type: Date,
  },
  duration: {
    type: Number, // duration in ms
    default: 0,
  },
  inputs: {
    type: Object,
    default: {},
  },
  outputs: {
    type: Object,
    default: {},
  },
  error: {
    type: String,
    default: '',
  },
  retryCount: {
    type: Number,
    default: 0,
  }
}, {
  timestamps: true,
});

export const Execution = mongoose.models.Execution || mongoose.model('Execution', executionSchema);
