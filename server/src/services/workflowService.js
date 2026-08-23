import { Workflow } from '../models/Workflow.js';
import { dbStatus } from '../config/db.js';
import mongoose from 'mongoose';

// In-memory store fallback
const inMemoryWorkflows = [];

export async function getWorkflows(userId, { search = '', status = '', page = 1, limit = 10 } = {}) {
  const skip = (page - 1) * limit;

  if (dbStatus.connected) {
    const query = { owner: userId };
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (status) {
      query.status = status;
    }

    const workflows = await Workflow.find(query)
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit);
      
    const total = await Workflow.countDocuments(query);
    
    return {
      workflows,
      total,
      page,
      pages: Math.ceil(total / limit)
    };
  } else {
    // In-memory fallback
    let filtered = inMemoryWorkflows.filter(w => w.owner === userId);
    
    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter(w => 
        w.name.toLowerCase().includes(s) || 
        w.description.toLowerCase().includes(s)
      );
    }
    
    if (status) {
      filtered = filtered.filter(w => w.status === status);
    }

    const total = filtered.length;
    const sorted = [...filtered].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
    const paginated = sorted.slice(skip, skip + limit);

    return {
      workflows: paginated,
      total,
      page,
      pages: Math.ceil(total / limit)
    };
  }
}

export async function getWorkflowById(id, userId) {
  if (dbStatus.connected) {
    return await Workflow.findOne({ _id: id, owner: userId });
  } else {
    return inMemoryWorkflows.find(w => w._id === id && w.owner === userId) || null;
  }
}

export async function createWorkflow(data, userId) {
  const workflowData = {
    name: data.name || 'Untitled Workflow',
    description: data.description || '',
    owner: userId,
    status: data.status || 'draft',
    triggerConfig: data.triggerConfig || { type: 'manual' },
    nodes: data.nodes || [],
    edges: data.edges || [],
    version: 1,
    tags: data.tags || [],
  };

  if (dbStatus.connected) {
    const workflow = new Workflow(workflowData);
    await workflow.save();
    return workflow;
  } else {
    const mockId = `mock-workflow-${Date.now()}`;
    const newWorkflow = {
      _id: mockId,
      id: mockId,
      ...workflowData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    inMemoryWorkflows.push(newWorkflow);
    return newWorkflow;
  }
}

export async function updateWorkflow(id, data, userId) {
  if (dbStatus.connected) {
    const workflow = await Workflow.findOne({ _id: id, owner: userId });
    if (!workflow) {
      throw new Error('Workflow not found');
    }

    // Assign properties
    if (data.name !== undefined) workflow.name = data.name;
    if (data.description !== undefined) workflow.description = data.description;
    if (data.status !== undefined) workflow.status = data.status;
    if (data.triggerConfig !== undefined) workflow.triggerConfig = data.triggerConfig;
    if (data.nodes !== undefined) workflow.nodes = data.nodes;
    if (data.edges !== undefined) workflow.edges = data.edges;
    if (data.tags !== undefined) workflow.tags = data.tags;
    
    // Bump version on structure save
    if (data.nodes !== undefined || data.edges !== undefined || data.triggerConfig !== undefined) {
      workflow.version = (workflow.version || 1) + 1;
    }

    await workflow.save();
    return workflow;
  } else {
    const idx = inMemoryWorkflows.findIndex(w => w._id === id && w.owner === userId);
    if (idx === -1) {
      throw new Error('Workflow not found');
    }

    const workflow = inMemoryWorkflows[idx];
    const updated = {
      ...workflow,
      ...data,
      updatedAt: new Date()
    };

    if (data.nodes !== undefined || data.edges !== undefined || data.triggerConfig !== undefined) {
      updated.version = (workflow.version || 1) + 1;
    }

    inMemoryWorkflows[idx] = updated;
    return updated;
  }
}

export async function duplicateWorkflow(id, userId) {
  const original = await getWorkflowById(id, userId);
  if (!original) {
    throw new Error('Workflow not found');
  }

  const dupData = {
    name: `${original.name} (Copy)`,
    description: original.description,
    status: 'draft',
    triggerConfig: JSON.parse(JSON.stringify(original.triggerConfig || { type: 'manual' })),
    nodes: JSON.parse(JSON.stringify(original.nodes || [])),
    edges: JSON.parse(JSON.stringify(original.edges || [])),
    tags: [...(original.tags || [])],
    version: 1,
  };

  return await createWorkflow(dupData, userId);
}

export async function deleteWorkflow(id, userId) {
  if (dbStatus.connected) {
    const res = await Workflow.deleteOne({ _id: id, owner: userId });
    if (res.deletedCount === 0) {
      throw new Error('Workflow not found');
    }
    return true;
  } else {
    const idx = inMemoryWorkflows.findIndex(w => w._id === id && w.owner === userId);
    if (idx === -1) {
      throw new Error('Workflow not found');
    }
    inMemoryWorkflows.splice(idx, 1);
    return true;
  }
}

export async function getDashboardStats(userId) {
  if (dbStatus.connected) {
    const totalWorkflows = await Workflow.countDocuments({ owner: userId });
    const draftWorkflows = await Workflow.countDocuments({ owner: userId, status: 'draft' });
    const activeWorkflows = await Workflow.countDocuments({ owner: userId, status: 'active' });
    
    // Aggregation placeholders for Executions (Phase 4 integration)
    return {
      totalWorkflows,
      draftWorkflows,
      activeWorkflows,
      activeExecutions: 0, 
      successRate: 100,
    };
  } else {
    const userWorkflows = inMemoryWorkflows.filter(w => w.owner === userId);
    const totalWorkflows = userWorkflows.length;
    const draftWorkflows = userWorkflows.filter(w => w.status === 'draft').length;
    const activeWorkflows = userWorkflows.filter(w => w.status === 'active').length;

    return {
      totalWorkflows,
      draftWorkflows,
      activeWorkflows,
      activeExecutions: 0,
      successRate: 100,
    };
  }
}
