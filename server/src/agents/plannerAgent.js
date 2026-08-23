import { ExecutionLog } from '../models/ExecutionLog.js';
import { AgentMemory } from '../models/AgentMemory.js';

export async function runPlannerAgent({ workflow, executionId }) {
  const { nodes, edges } = workflow;
  console.log(`[Planner Agent] Planning execution sequence for execution: ${executionId}`);

  // 1. Identify triggers and downstream nodes
  const triggerNodes = nodes.filter(n => n.type.toLowerCase().includes('trigger'));
  const actionNodes = nodes.filter(n => !n.type.toLowerCase().includes('trigger'));

  // Simple topological ordering using edges
  const executionPlan = [];
  const visited = new Set();

  // Start with triggers
  triggerNodes.forEach(t => {
    executionPlan.push(t.id);
    visited.add(t.id);
  });

  // Basic queue traversal of edges
  let queue = [...executionPlan];
  while (queue.length > 0) {
    const currentId = queue.shift();
    // Find all nodes connected from this node
    const downstream = edges
      .filter(e => e.source === currentId)
      .map(e => e.target);

    downstream.forEach(targetId => {
      if (!visited.has(targetId)) {
        visited.add(targetId);
        executionPlan.push(targetId);
        queue.push(targetId);
      }
    });
  }

  // Add any orphaned action nodes
  actionNodes.forEach(node => {
    if (!visited.has(node.id)) {
      executionPlan.push(node.id);
      visited.add(node.id);
    }
  });

  // 2. Compute confidence score
  // High confidence if there is exactly 1 trigger, and all nodes are connected
  let confidenceScore = 1.0;
  if (triggerNodes.length === 0) {
    confidenceScore -= 0.4; // No clear entry point
  } else if (triggerNodes.length > 1) {
    confidenceScore -= 0.15; // Multiple entry triggers
  }

  const connectedNodesCount = visited.size;
  if (connectedNodesCount < nodes.length) {
    confidenceScore -= 0.25 * (nodes.length - connectedNodesCount); // Disconnected nodes
  }

  confidenceScore = Math.max(0.1, confidenceScore);

  // 3. Persist memory & logs
  await AgentMemory.create({
    workflowId: workflow._id || workflow.id,
    executionId,
    agentId: 'planner',
    key: 'executionPlan',
    value: executionPlan,
    confidenceScore,
  });

  await ExecutionLog.create({
    executionId,
    workflowId: workflow._id || workflow.id,
    agent: 'planner',
    level: confidenceScore > 0.7 ? 'success' : 'warning',
    message: `Plan generated. Confidence: ${(confidenceScore * 100).toFixed(1)}%. Sequence: ${executionPlan.join(' -> ')}`,
    metadata: { executionPlan, confidenceScore }
  });

  return {
    executionPlan,
    confidenceScore
  };
}
