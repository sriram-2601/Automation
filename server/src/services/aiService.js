import { env } from '../config/env.js';

// Rule-based deterministic fallback generator
function deterministicBuilder(promptText) {
  const query = promptText.toLowerCase();
  
  // Default structure: manual trigger
  const nodes = [
    {
      id: 'trigger_1',
      type: 'manualTrigger',
      position: { x: 100, y: 200 },
      data: { label: 'Manual Trigger', config: {} }
    }
  ];
  const edges = [];
  let name = 'Automated Agent Flow';
  let description = `Compiled from prompt: "${promptText}"`;

  if (query.includes('email') || query.includes('gmail')) {
    name = 'Gmail Notification Action';
    nodes.push({
      id: 'action_1',
      type: 'gmailSendEmail',
      position: { x: 380, y: 200 },
      data: { 
        label: 'Send Email Notifier', 
        config: { 
          to: 'operator@agentflow.ai', 
          subject: 'AI Agent System Update',
          body: 'Automated notification triggered by Agentflow_AI.'
        } 
      }
    });
    edges.push({
      id: 'edge_1',
      source: 'trigger_1',
      target: 'action_1',
      animated: true,
      style: { stroke: '#8b5cf6', strokeWidth: 2 }
    });
  } 
  else if (query.includes('slack')) {
    name = 'Slack Post Action';
    nodes.push({
      id: 'action_1',
      type: 'slackPostMessage',
      position: { x: 380, y: 200 },
      data: { 
        label: 'Slack Notifier', 
        config: { 
          channel: '#general', 
          text: 'Alert: Agentic workflow executed successfully!' 
        } 
      }
    });
    edges.push({
      id: 'edge_1',
      source: 'trigger_1',
      target: 'action_1',
      animated: true,
      style: { stroke: '#8b5cf6', strokeWidth: 2 }
    });
  }
  else if (query.includes('discord')) {
    name = 'Discord Notification Action';
    nodes.push({
      id: 'action_1',
      type: 'discordPostMessage',
      position: { x: 380, y: 200 },
      data: { 
        label: 'Discord Message', 
        config: { 
          webhookUrl: '', 
          content: 'Hello from Agentflow_AI!' 
        } 
      }
    });
    edges.push({
      id: 'edge_1',
      source: 'trigger_1',
      target: 'action_1',
      animated: true,
      style: { stroke: '#8b5cf6', strokeWidth: 2 }
    });
  }
  else if (query.includes('sheet') || query.includes('append')) {
    name = 'Sheets Logging Action';
    nodes.push({
      id: 'action_1',
      type: 'sheetsAppendRow',
      position: { x: 380, y: 200 },
      data: { 
        label: 'Append to Sheet', 
        config: { 
          spreadsheetId: '', 
          range: 'Sheet1!A:Z', 
          values: '{{trigger.time}}, Executed, Agentflow' 
        } 
      }
    });
    edges.push({
      id: 'edge_1',
      source: 'trigger_1',
      target: 'action_1',
      animated: true,
      style: { stroke: '#8b5cf6', strokeWidth: 2 }
    });
  }
  else if (query.includes('invoice') || query.includes('routing')) {
    name = 'Invoice Processing & Routing Flow';
    // Multi-node sequence: Trigger -> AI Prompt (Extract) -> Slack Post -> Sheets Append
    nodes.push(
      {
        id: 'ai_1',
        type: 'aiPrompt',
        position: { x: 350, y: 200 },
        data: {
          label: 'Extract Invoice Details',
          config: {
            model: 'openrouter',
            systemInstruction: 'You are an invoice parsing assistant. Extract invoice amount, vendor, and date.',
            prompt: 'Extract details from: {{trigger.input}}'
          }
        }
      },
      {
        id: 'action_1',
        type: 'slackPostMessage',
        position: { x: 600, y: 100 },
        data: { 
          label: 'Post Extract Alert', 
          config: { 
            channel: '#billing', 
            text: 'Invoice Parsed: {{ai_1.output}}' 
          } 
        }
      },
      {
        id: 'action_2',
        type: 'sheetsAppendRow',
        position: { x: 600, y: 300 },
        data: { 
          label: 'Log Invoice Row', 
          config: { 
            spreadsheetId: '', 
            range: 'Invoices!A:D', 
            values: '{{ai_1.vendor}}, {{ai_1.amount}}, {{ai_1.date}}' 
          } 
        }
      }
    );

    edges.push(
      {
        id: 'edge_1',
        source: 'trigger_1',
        target: 'ai_1',
        animated: true,
        style: { stroke: '#8b5cf6', strokeWidth: 2 }
      },
      {
        id: 'edge_2',
        source: 'ai_1',
        target: 'action_1',
        animated: true,
        style: { stroke: '#8b5cf6', strokeWidth: 2 }
      },
      {
        id: 'edge_3',
        source: 'ai_1',
        target: 'action_2',
        animated: true,
        style: { stroke: '#8b5cf6', strokeWidth: 2 }
      }
    );
  }
  else {
    // Default fallback: Manual Trigger -> AI Prompt
    name = 'AI Prompt Executor';
    nodes.push({
      id: 'ai_1',
      type: 'aiPrompt',
      position: { x: 380, y: 200 },
      data: {
        label: 'Execute AI Reasoning',
        config: {
          model: 'openrouter',
          systemInstruction: 'You are a general operations automation assistant.',
          prompt: promptText
        }
      }
    });
    edges.push({
      id: 'edge_1',
      source: 'trigger_1',
      target: 'ai_1',
      animated: true,
      style: { stroke: '#8b5cf6', strokeWidth: 2 }
    });
  }

  return { name, description, nodes, edges };
}

// Generate workflow JSON schema prompt instruct
const SYSTEM_PROMPT = `
You are an expert AI Operations compiler. Your job is to translate a natural language prompt describing a workflow automation into a JSON graph structure for React Flow.
You must return a valid JSON object ONLY. Do not wrap in markdown codeblocks (no \`\`\`json).

The JSON object must have this exact shape:
{
  "name": "Short workflow name",
  "description": "Descriptive text of what this flow does",
  "nodes": [
    {
      "id": "unique_id_string",
      "type": "one of: manualTrigger | scheduleTrigger | webhookTrigger | gmailSendEmail | slackPostMessage | discordPostMessage | sheetsAppendRow | aiPrompt",
      "position": { "x": number, "y": number },
      "data": {
        "label": "Display title label",
        "config": {} // Custom config matching the node type
      }
    }
  ],
  "edges": [
    {
      "id": "edge_unique_id",
      "source": "source_node_id",
      "target": "target_node_id",
      "animated": true,
      "style": { "stroke": "#8b5cf6", "strokeWidth": 2 }
    }
  ]
}

Custom configuration schema mapping:
- scheduleTrigger: { "cron": "*/5 * * * *" }
- webhookTrigger: {}
- gmailSendEmail: { "to": "email", "subject": "title", "body": "content text" }
- slackPostMessage: { "channel": "#channel", "text": "slack text" }
- discordPostMessage: { "webhookUrl": "url", "content": "discord text" }
- sheetsAppendRow: { "spreadsheetId": "id", "range": "Sheet1!A:Z", "values": "value1, value2" }
- aiPrompt: { "model": "openrouter", "systemInstruction": "instr", "prompt": "prompt template" }

Organize node positions sequentially: Triggers on left (x: 100, y: 200), subsequent actions shifted right by 250px on x-axis (e.g. x: 350, x: 600) and aligned on y-axis or vertically branched if there are multiple outputs.
`;

export async function generateWorkflowFromPrompt(promptText) {
  // 1. Try OpenRouter if key is configured
  if (env.OPENROUTER_API_KEY) {
    try {
      console.log('Generating workflow using OpenRouter API...');
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:3000',
          'X-Title': 'Agentflow_AI'
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: `Compile this automation workflow: ${promptText}` }
          ],
          response_format: { type: 'json_object' }
        })
      });

      if (response.ok) {
        const data = await response.json();
        const content = data.choices[0]?.message?.content;
        if (content) {
          const parsed = JSON.parse(content);
          if (parsed.nodes && parsed.edges) {
            return parsed;
          }
        }
      } else {
        console.warn(`OpenRouter API error response: ${response.status}`);
      }
    } catch (error) {
      console.error('OpenRouter generation failed:', error.message);
    }
  }

  // 2. Fall back to Gemini SDK REST endpoint if key is configured
  if (env.GEMINI_API_KEY) {
    try {
      console.log('Generating workflow using Google Gemini API...');
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${env.GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `${SYSTEM_PROMPT}\n\nCompile this automation workflow: ${promptText}`
            }]
          }],
          generationConfig: {
            responseMimeType: 'application/json'
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (content) {
          const parsed = JSON.parse(content);
          if (parsed.nodes && parsed.edges) {
            return parsed;
          }
        }
      } else {
        console.warn(`Gemini API error response: ${response.status}`);
      }
    } catch (error) {
      console.error('Gemini generation failed:', error.message);
    }
  }

  // 3. Absolute Fallback: Deterministic rule-based compilation
  console.log('Falling back to deterministic rule builder...');
  return deterministicBuilder(promptText);
}
