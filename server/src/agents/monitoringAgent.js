import { ExecutionLog } from '../models/ExecutionLog.js';
import { emitExecutionEvent } from '../config/socket.js';

export async function runMonitoringAgent({ executionId, workflowId, nodeId, eventName, level, message, metadata = {} }) {
  console.log(`[Monitoring Agent] Logging event: "${message}"`);

  // 1. Write Log
  const logObj = await ExecutionLog.create({
    executionId,
    workflowId,
    nodeId: nodeId || '',
    agent: 'monitoring',
    level: level || 'info',
    message,
    metadata
  });

  // 2. Broadcast via Socket.IO
  emitExecutionEvent(executionId, {
    logId: logObj._id,
    nodeId,
    agent: 'monitoring',
    level,
    message,
    metadata,
    timestamp: logObj.createdAt,
  });

  return logObj;
}

// Global logger helper that feeds all agent events into Socket.IO streaming
export async function streamAgentEvent({ executionId, workflowId, nodeId, agent, level, message, metadata = {} }) {
  // Emit to socket
  emitExecutionEvent(executionId, {
    nodeId,
    agent,
    level,
    message,
    metadata,
    timestamp: new Date(),
  });
}
