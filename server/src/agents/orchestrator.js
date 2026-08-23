import { Execution } from '../models/Execution.js';
import { AgentMemory } from '../models/AgentMemory.js';
import { runPlannerAgent } from './plannerAgent.js';
import { runExecutionAgent } from './executionAgent.js';
import { runValidationAgent } from './validationAgent.js';
import { runRecoveryAgent } from './recoveryAgent.js';
import { runMonitoringAgent, streamAgentEvent } from './monitoringAgent.js';
import { dbStatus } from '../config/db.js';
import { createNotification } from '../services/notificationService.js';

// Try loading LangGraph dynamically to report its availability
let isLangGraphAvailable = 'not-installed';
try {
  // Try importing StateGraph from langgraph
  // In ESM we can run dynamic import
  await import('@langchain/langgraph');
  isLangGraphAvailable = 'available';
} catch (e) {
  isLangGraphAvailable = 'not-installed';
}

// Active in-memory executing flags for quick lookups
const activeRuns = new Map();

export async function executeWorkflowSequence(executionId, inputs = {}) {
  console.log(`[Orchestrator] Starting workflow execution: ${executionId}`);
  
  let execution = null;
  if (dbStatus.connected) {
    execution = await Execution.findById(executionId);
  } else {
    // In-memory mock/array handling if Mongo is not connected
    // (We will simulate it locally)
    execution = {
      _id: executionId,
      id: executionId,
      status: 'PENDING',
      workflowSnapshot: { nodes: [], edges: [] },
      inputs,
      outputs: {},
      retryCount: 0,
      save: async function() { return this; }
    };
  }

  if (!execution) return;

  const workflowId = execution.workflowId;
  const workflow = execution.workflowSnapshot;

  try {
    // Update status to RUNNING
    execution.status = 'RUNNING';
    execution.startTime = new Date();
    await execution.save();

    await streamAgentEvent({
      executionId,
      workflowId,
      agent: 'monitoring',
      level: 'info',
      message: `System: Starting agent execution loop. Substrate substrate: LangGraph is ${isLangGraphAvailable}.`,
      metadata: { langGraph: isLangGraphAvailable }
    });

    // 1. Invoke Planner Agent to compile node order
    const { executionPlan, confidenceScore } = await runPlannerAgent({ workflow, executionId });

    // Store execution state in local cache
    activeRuns.set(executionId, {
      plan: executionPlan,
      outputs: { inputs, userId: workflow.owner, ...execution.outputs },
      currentIndex: 0,
    });

    await runNodeLoop(executionId, execution);

  } catch (err) {
    console.error(`[Orchestrator] Fatal execution error on ${executionId}:`, err);
    execution.status = 'FAILED';
    execution.endTime = new Date();
    execution.error = err.message;
    await execution.save();
    
    await runMonitoringAgent({
      executionId,
      workflowId,
      level: 'error',
      message: `Execution terminated with fatal error: ${err.message}`,
    });
  }
}

// Resume execution from saved step
export async function resumeWorkflowSequence(executionId) {
  let execution = null;
  if (dbStatus.connected) {
    execution = await Execution.findById(executionId);
  }
  if (!execution) return;

  execution.status = 'RUNNING';
  await execution.save();

  await streamAgentEvent({
    executionId,
    workflowId: execution.workflowId,
    agent: 'monitoring',
    level: 'info',
    message: 'System: Resuming execution run from last paused node.',
  });

  // Re-establish active run cache
  const memoryObj = await AgentMemory.findOne({ executionId, key: 'executionPlan' });
  const plan = memoryObj ? memoryObj.value : [];
  
  const currentIdx = plan.indexOf(execution.currentNodeId);
  
  activeRuns.set(executionId, {
    plan,
    outputs: { userId: execution.workflowSnapshot?.owner, ...execution.outputs },
    currentIndex: Math.max(0, currentIdx),
  });

  await runNodeLoop(executionId, execution);
}

// Node loop executor (handles step-by-step agent checks and pause/cancel gates)
async function runNodeLoop(executionId, execution) {
  const runCache = activeRuns.get(executionId);
  if (!runCache) return;

  const { plan } = runCache;
  const workflowId = execution.workflowId;
  const workflow = execution.workflowSnapshot;

  while (runCache.currentIndex < plan.length) {
    // Check if user paused or cancelled the execution
    let currentStatus = 'RUNNING';
    if (dbStatus.connected) {
      const refreshed = await Execution.findById(executionId);
      currentStatus = refreshed?.status || 'RUNNING';
    }

    if (currentStatus === 'PAUSED') {
      await runMonitoringAgent({
        executionId,
        workflowId,
        message: `System: Execution run paused by operator. Session saved.`,
      });
      activeRuns.delete(executionId);
      return;
    }

    if (currentStatus === 'CANCELLED') {
      await runMonitoringAgent({
        executionId,
        workflowId,
        level: 'warning',
        message: `System: Execution run cancelled by operator. Terminating steps.`,
      });
      activeRuns.delete(executionId);
      return;
    }

    const nodeId = plan[runCache.currentIndex];
    const node = workflow.nodes.find(n => n.id === nodeId);
    
    if (!node) {
      runCache.currentIndex++;
      continue;
    }

    // Set active node
    execution.currentNodeId = node.id;
    if (dbStatus.connected) {
      await Execution.findByIdAndUpdate(executionId, { currentNodeId: node.id });
    }

    // 2. Invoke Execution Agent
    const execResult = await runExecutionAgent({
      node,
      executionId,
      workflowId,
      outputs: runCache.outputs,
    });

    // 3. Invoke Validation Agent
    const validationResult = await runValidationAgent({
      node,
      executionId,
      workflowId,
      executionResult: execResult,
    });

    // 4. Handle recovery or success
    if (!execResult.success || !validationResult.valid) {
      const errorMsg = execResult.error || validationResult.error || 'Failed output validation.';
      
      // Invoke Recovery Agent
      const recovery = await runRecoveryAgent({
        node,
        executionId,
        workflowId,
        errorMsg,
        errorType: !execResult.success ? 'API_FAILURE' : 'VALIDATION_FAILED'
      });

      if (recovery.recoveryAction === 'retry_with_backoff') {
        // Handle retry queue backoff
        execution.status = 'RETRYING';
        execution.retryCount = (execution.retryCount || 0) + 1;
        if (dbStatus.connected) {
          await execution.save();
        }
        
        await runMonitoringAgent({
          executionId,
          workflowId,
          nodeId: node.id,
          level: 'warning',
          message: `Retrying node "${node.data?.label || node.id}" in ${recovery.backoffMs}ms... (Retry #${execution.retryCount})`,
        });

        await createNotification({
          owner: workflow.owner,
          workflowId,
          executionId,
          type: 'warning',
          title: 'Node Failure Recovering',
          message: `Auto-retry #${execution.retryCount} initiated for node "${node.data?.label || node.id}".`,
        });

        // Delay execution
        await new Promise(r => setTimeout(r, recovery.backoffMs));
        // Run node execution step again (don't increment index)
        continue;
      } else {
        // Escalate / fail execution
        execution.status = 'FAILED';
        execution.endTime = new Date();
        execution.error = errorMsg;
        if (dbStatus.connected) {
          await execution.save();
        }

        await runMonitoringAgent({
          executionId,
          workflowId,
          nodeId: node.id,
          level: 'error',
          message: `Escalation triggered: Node execution terminated permanently. Status: FAILED.`,
        });

        await createNotification({
          owner: workflow.owner,
          workflowId,
          executionId,
          type: 'failure',
          title: 'Workflow Run Failed',
          message: `Execution failed on node "${node.data?.label || node.id}": ${errorMsg}`,
        });

        activeRuns.delete(executionId);
        return;
      }
    }

    // Capture Output on Success
    runCache.outputs[node.id] = execResult.output;
    execution.outputs = runCache.outputs;
    if (dbStatus.connected) {
      await Execution.findByIdAndUpdate(executionId, { outputs: runCache.outputs });
    }

    // Go to next node
    runCache.currentIndex++;
  }

  // Workflow completed successfully
  execution.status = 'COMPLETED';
  execution.endTime = new Date();
  execution.duration = execution.endTime - execution.startTime;
  if (dbStatus.connected) {
    await execution.save();
  }

  await runMonitoringAgent({
    executionId,
    workflowId,
    level: 'success',
    message: `System: Automation flow completed successfully in ${execution.duration}ms. langGraph: '${isLangGraphAvailable}'`,
    metadata: { duration: execution.duration }
  });

  await createNotification({
    owner: workflow.owner,
    workflowId,
    executionId,
    type: 'success',
    title: 'Workflow Run Succeeded',
    message: `Automation flow "${workflow.name}" completed successfully in ${(execution.duration / 1000).toFixed(2)}s.`,
  });

  activeRuns.delete(executionId);
}
export { isLangGraphAvailable };
