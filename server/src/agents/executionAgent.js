import { ExecutionLog } from '../models/ExecutionLog.js';
import * as integrationService from '../services/integrationService.js';
import { GmailIntegration } from '../integrations/gmailIntegration.js';
import { SlackIntegration } from '../integrations/slackIntegration.js';
import { DiscordIntegration } from '../integrations/discordIntegration.js';
import { GoogleSheetsIntegration } from '../integrations/googleSheetsIntegration.js';

// Helper to resolve string templates
export function resolveTemplateVariables(templateStr, outputs = {}) {
  if (typeof templateStr !== 'string') return templateStr;
  
  return templateStr.replace(/\{\{([^}]+)\}\}/g, (match, expression) => {
    const trimmed = expression.trim();
    const parts = trimmed.split('.'); 
    
    let current = outputs;
    for (const part of parts) {
      if (current && current[part] !== undefined) {
        current = current[part];
      } else {
        return match; 
      }
    }
    return typeof current === 'object' ? JSON.stringify(current) : current;
  });
}

// Deeply resolve objects
export function resolveConfigObject(config, outputs) {
  if (!config) return {};
  
  const resolved = {};
  for (const [key, val] of Object.entries(config)) {
    if (typeof val === 'string') {
      resolved[key] = resolveTemplateVariables(val, outputs);
    } else if (val && typeof val === 'object' && !Array.isArray(val)) {
      resolved[key] = resolveConfigObject(val, outputs);
    } else {
      resolved[key] = val;
    }
  }
  return resolved;
}

export async function runExecutionAgent({ node, executionId, workflowId, outputs }) {
  console.log(`[Execution Agent] Running node: ${node.id} (${node.type})`);
  
  const resolvedConfig = resolveConfigObject(node.data?.config || {}, outputs);

  await ExecutionLog.create({
    executionId,
    workflowId,
    nodeId: node.id,
    agent: 'execution',
    level: 'info',
    message: `Executing node "${node.data?.label || node.id}" of type "${node.type}".`,
    metadata: { resolvedConfig }
  });

  // Extract owner ID (userId) from outputs context to check credentials
  const userId = outputs.inputs?.userId || outputs.userId;

  let outputResult = {};
  
  try {
    switch (node.type) {
      case 'manualTrigger':
        outputResult = { 
          triggeredAt: new Date(), 
          message: 'Manually fired by operator console.',
          inputData: outputs.inputs || {}
        };
        break;

      case 'scheduleTrigger':
        outputResult = { 
          cronFiredAt: new Date(), 
          cronSchedule: resolvedConfig.cron || '*/5 * * * *' 
        };
        break;

      case 'webhookTrigger':
        outputResult = { 
          webhookReceivedAt: new Date(), 
          payload: outputs.inputs || {} 
        };
        break;

      case 'gmailSendEmail': {
        // Retrieve credentials and invoke Gmail Integration
        if (!userId) throw new Error('AUTH_EXPIRED: Missing user credentials trace.');
        const credentials = await integrationService.getIntegrationCredentials(userId, 'gmail');
        const gmail = new GmailIntegration(credentials);
        outputResult = await gmail.execute('sendEmail', resolvedConfig);
        break;
      }

      case 'slackPostMessage': {
        if (!userId) throw new Error('AUTH_EXPIRED: Missing user credentials trace.');
        const credentials = await integrationService.getIntegrationCredentials(userId, 'slack');
        const slack = new SlackIntegration(credentials);
        outputResult = await slack.execute('postMessage', resolvedConfig);
        break;
      }

      case 'discordPostMessage': {
        // Discord webhook does not strictly require user OAuth connections
        // check credentials or load from config
        let credentials = {};
        try {
          if (userId) {
            credentials = await integrationService.getIntegrationCredentials(userId, 'discord');
          }
        } catch (e) {
          // If no discord connection exists but webhook URL is in params, ignore
          if (!resolvedConfig.webhookUrl) {
            throw new Error('INTEGRATION_NOT_CONNECTED: Discord connection or Webhook URL is missing.');
          }
        }
        const discord = new DiscordIntegration(credentials);
        outputResult = await discord.execute('postMessage', resolvedConfig);
        break;
      }

      case 'sheetsAppendRow': {
        if (!userId) throw new Error('AUTH_EXPIRED: Missing user credentials trace.');
        const credentials = await integrationService.getIntegrationCredentials(userId, 'google-sheets');
        const sheets = new GoogleSheetsIntegration(credentials);
        outputResult = await sheets.execute('appendRow', resolvedConfig);
        break;
      }

      case 'aiPrompt':
        // Simulating LLM prompt logic fallback
        const promptText = resolvedConfig.prompt || '';
        outputResult = {
          model: resolvedConfig.model || 'openrouter',
          systemInstruction: resolvedConfig.systemInstruction,
          promptEvaluated: promptText,
          output: `[AI Reasoner Output] Processed prompt successfully: "${promptText.substring(0, 50)}..."`
        };
        break;

      default:
        throw new Error(`Unsupported node execution type: ${node.type}`);
    }

    await ExecutionLog.create({
      executionId,
      workflowId,
      nodeId: node.id,
      agent: 'execution',
      level: 'success',
      message: `Node "${node.data?.label || node.id}" completed successfully.`,
      metadata: { output: outputResult }
    });

    return {
      success: true,
      output: outputResult
    };

  } catch (error) {
    // Standardize error message to include INTEGRATION_NOT_CONNECTED or AUTH_EXPIRED
    let cleanMsg = error.message;
    if (cleanMsg.includes('INTEGRATION_NOT_CONNECTED')) {
      cleanMsg = 'INTEGRATION_NOT_CONNECTED: Third-party integration is not connected.';
    } else if (cleanMsg.includes('AUTH_EXPIRED')) {
      cleanMsg = 'AUTH_EXPIRED: Access credentials expired or invalid.';
    }

    await ExecutionLog.create({
      executionId,
      workflowId,
      nodeId: node.id,
      agent: 'execution',
      level: 'error',
      message: `Execution failed on node "${node.data?.label || node.id}": ${cleanMsg}`,
      metadata: { error: error.stack }
    });

    return {
      success: false,
      error: cleanMsg
    };
  }
}
