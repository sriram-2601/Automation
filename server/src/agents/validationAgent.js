import { ExecutionLog } from '../models/ExecutionLog.js';

export async function runValidationAgent({ node, executionId, workflowId, executionResult }) {
  console.log(`[Validation Agent] Validating outputs for node: ${node.id}`);

  if (!executionResult.success) {
    await ExecutionLog.create({
      executionId,
      workflowId,
      nodeId: node.id,
      agent: 'validation',
      level: 'error',
      message: `Validation skipped on node "${node.data?.label || node.id}" because execution failed.`,
    });
    return { valid: false, error: 'Execution failed.' };
  }

  const output = executionResult.output || {};
  let valid = true;
  let validationError = '';

  // Apply node type validations
  switch (node.type) {
    case 'gmailSendEmail':
      if (!output.sent || !output.messageId) {
        valid = false;
        validationError = 'Gmail output is missing sent message confirmations.';
      }
      break;

    case 'slackPostMessage':
      if (!output.posted || !output.timestamp) {
        valid = false;
        validationError = 'Slack notification is missing channel status timestamps.';
      }
      break;

    case 'sheetsAppendRow':
      if (!output.appended) {
        valid = false;
        validationError = 'Sheets response missing row appended state.';
      }
      break;

    case 'aiPrompt':
      if (!output.output) {
        valid = false;
        validationError = 'AI node failed to generate a response output string.';
      }
      break;
      
    default:
      // General pass-through validation
      break;
  }

  if (valid) {
    await ExecutionLog.create({
      executionId,
      workflowId,
      nodeId: node.id,
      agent: 'validation',
      level: 'success',
      message: `Validation checks passed on node "${node.data?.label || node.id}".`,
      metadata: { outputSchema: 'Valid' }
    });
  } else {
    await ExecutionLog.create({
      executionId,
      workflowId,
      nodeId: node.id,
      agent: 'validation',
      level: 'error',
      message: `Validation check failed on node "${node.data?.label || node.id}": ${validationError}`,
      metadata: { validationError }
    });
  }

  return {
    valid,
    error: validationError
  };
}
