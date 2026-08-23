import { validationResult } from 'express-validator';
import * as workflowService from '../services/workflowService.js';
import { generateWorkflowFromPrompt } from '../services/aiService.js';
import { Execution } from '../models/Execution.js';
import { addExecutionJob } from '../queues/executionQueue.js';
import { dbStatus } from '../config/db.js';
import { addMockExecution } from './executionController.js';

export async function getDashboard(req, res) {
  try {
    const stats = await workflowService.getDashboardStats(req.user._id || req.user.id);
    return res.status(200).json(stats);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

export async function listWorkflows(req, res) {
  try {
    const { search, status, page, limit } = req.query;
    const result = await workflowService.getWorkflows(req.user._id || req.user.id, {
      search,
      status,
      page: parseInt(page || '1', 10),
      limit: parseInt(limit || '10', 10)
    });
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

export async function create(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const workflow = await workflowService.createWorkflow(req.body, req.user._id || req.user.id);
    return res.status(201).json(workflow);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
}

export async function getById(req, res) {
  try {
    const workflow = await workflowService.getWorkflowById(req.params.id, req.user._id || req.user.id);
    if (!workflow) {
      return res.status(404).json({ message: 'Workflow not found' });
    }
    return res.status(200).json(workflow);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

export async function update(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const workflow = await workflowService.updateWorkflow(req.params.id, req.body, req.user._id || req.user.id);
    return res.status(200).json(workflow);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
}

export async function duplicate(req, res) {
  try {
    const workflow = await workflowService.duplicateWorkflow(req.params.id, req.user._id || req.user.id);
    return res.status(201).json(workflow);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
}

export async function remove(req, res) {
  try {
    await workflowService.deleteWorkflow(req.params.id, req.user._id || req.user.id);
    return res.status(200).json({ message: 'Workflow deleted successfully' });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
}

// Trigger workflow execution (Phase 4 integration)
export async function execute(req, res) {
  try {
    const workflow = await workflowService.getWorkflowById(req.params.id, req.user._id || req.user.id);
    if (!workflow) {
      return res.status(404).json({ message: 'Workflow not found' });
    }

    const { inputs } = req.body;
    
    let executionId = `mock-exec-${Date.now()}`;
    let execution = null;

    if (dbStatus.connected) {
      execution = new Execution({
        workflowId: workflow._id,
        workflowSnapshot: workflow,
        status: 'PENDING',
        inputs: inputs || {},
        outputs: {},
        retryCount: 0
      });
      await execution.save();
      executionId = execution._id;
    } else {
      // Create mock local execution and push to controller logs fallback
      execution = {
        _id: executionId,
        id: executionId,
        workflowId: { _id: workflow.id, name: workflow.name },
        workflowSnapshot: workflow,
        status: 'PENDING',
        inputs: inputs || {},
        outputs: {},
        retryCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      addMockExecution(execution);
    }

    // Trigger via queue / background worker with in-memory fallback
    addExecutionJob(executionId, inputs || {});

    return res.status(202).json({
      message: 'Workflow execution triggered successfully',
      executionId,
      status: 'PENDING',
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

export async function generate(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { prompt } = req.body;
    const generatedGraph = await generateWorkflowFromPrompt(prompt);
    return res.status(200).json(generatedGraph);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}
