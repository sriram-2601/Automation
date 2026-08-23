import { Execution } from '../models/Execution.js';
import { ExecutionLog } from '../models/ExecutionLog.js';
import * as orchestrator from '../agents/orchestrator.js';
import { dbStatus } from '../config/db.js';

// Fallback in-memory storage for executions if Mongo is down
const inMemoryExecutions = [];
const inMemoryLogs = [];

export async function listExecutions(req, res) {
  try {
    if (dbStatus.connected) {
      const executions = await Execution.find()
        .populate('workflowId', 'name')
        .sort({ createdAt: -1 })
        .limit(50);
      return res.status(200).json(executions);
    } else {
      return res.status(200).json(inMemoryExecutions);
    }
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

export async function getById(req, res) {
  try {
    if (dbStatus.connected) {
      const execution = await Execution.findById(req.params.id).populate('workflowId', 'name');
      if (!execution) {
        return res.status(404).json({ message: 'Execution trace not found' });
      }
      return res.status(200).json(execution);
    } else {
      const execution = inMemoryExecutions.find(e => e._id === req.params.id);
      if (!execution) return res.status(404).json({ message: 'Execution trace not found' });
      return res.status(200).json(execution);
    }
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

export async function getTimeline(req, res) {
  try {
    if (dbStatus.connected) {
      const logs = await ExecutionLog.find({ executionId: req.params.id }).sort({ createdAt: 1 });
      return res.status(200).json(logs);
    } else {
      const logs = inMemoryLogs.filter(l => l.executionId === req.params.id);
      return res.status(200).json(logs);
    }
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

export async function pause(req, res) {
  try {
    if (dbStatus.connected) {
      const execution = await Execution.findById(req.params.id);
      if (!execution) return res.status(404).json({ message: 'Execution not found' });
      
      if (execution.status !== 'RUNNING') {
        return res.status(400).json({ message: 'Only running workflows can be paused' });
      }

      execution.status = 'PAUSED';
      await execution.save();
      return res.status(200).json(execution);
    } else {
      return res.status(200).json({ message: 'Mock pause triggered' });
    }
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

export async function resume(req, res) {
  try {
    if (dbStatus.connected) {
      const execution = await Execution.findById(req.params.id);
      if (!execution) return res.status(404).json({ message: 'Execution not found' });
      
      if (execution.status !== 'PAUSED') {
        return res.status(400).json({ message: 'Only paused workflows can be resumed' });
      }

      // Trigger resume asynchronously
      orchestrator.resumeWorkflowSequence(req.params.id);
      
      return res.status(200).json({ message: 'Workflow resume triggered successfully' });
    } else {
      return res.status(200).json({ message: 'Mock resume triggered' });
    }
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

export async function cancel(req, res) {
  try {
    if (dbStatus.connected) {
      const execution = await Execution.findById(req.params.id);
      if (!execution) return res.status(404).json({ message: 'Execution not found' });

      if (['COMPLETED', 'FAILED', 'CANCELLED'].includes(execution.status)) {
        return res.status(400).json({ message: 'Cannot cancel an already completed/terminated execution' });
      }

      execution.status = 'CANCELLED';
      execution.endTime = new Date();
      await execution.save();
      return res.status(200).json(execution);
    } else {
      return res.status(200).json({ message: 'Mock cancel triggered' });
    }
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

// In-Memory Helper for local runs when MongoDB is down
export function addMockExecution(execution, logs = []) {
  inMemoryExecutions.unshift(execution);
  inMemoryLogs.push(...logs);
}
