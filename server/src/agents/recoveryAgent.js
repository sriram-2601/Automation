import { ExecutionLog } from '../models/ExecutionLog.js';

export async function runRecoveryAgent({ node, executionId, workflowId, errorMsg, errorType }) {
  console.log(`[Recovery Agent] Classifying failure on node: ${node.id}`);

  let classification = 'API_FAILURE';
  let recoveryAction = 'escalate'; // default action

  const errLower = errorMsg?.toLowerCase() || '';

  // 1. Classify failure type
  if (errorType === 'VALIDATION_FAILED' || errLower.includes('missing') || errLower.includes('validation')) {
    classification = 'MISSING_FIELDS';
    recoveryAction = 'escalate'; // Escalation required since prompt parameters are incorrect
  } 
  else if (errLower.includes('auth') || errLower.includes('unauthorized') || errLower.includes('expired') || errLower.includes('credential')) {
    classification = 'AUTH_EXPIRED';
    recoveryAction = 'escalate'; // Escalation required (operator needs to reconnect OAuth)
  }
  else if (errLower.includes('rate limit') || errLower.includes('429') || errLower.includes('too many requests')) {
    classification = 'RATE_LIMIT';
    recoveryAction = 'retry_with_backoff'; // Can retry after rate limit backoff
  }
  else if (errLower.includes('network') || errLower.includes('timeout') || errLower.includes('econnrefused')) {
    classification = 'TRANSIENT';
    recoveryAction = 'retry_with_backoff'; // Transient network issues can be retried
  }

  await ExecutionLog.create({
    executionId,
    workflowId,
    nodeId: node.id,
    agent: 'recovery',
    level: 'warning',
    message: `Failure Classified: ${classification}. Selected recovery path: ${recoveryAction.toUpperCase()}.`,
    metadata: { classification, recoveryAction, errorMsg }
  });

  return {
    classification,
    recoveryAction,
    backoffMs: recoveryAction === 'retry_with_backoff' ? 1000 : 0
  };
}
