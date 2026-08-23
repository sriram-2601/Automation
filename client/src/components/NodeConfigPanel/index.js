import { useState, useEffect } from 'react';
import { X, Save, CheckCircle } from 'lucide-react';

export default function NodeConfigPanel({ node, onClose, onUpdate }) {
  const [label, setLabel] = useState('');
  const [config, setConfig] = useState({});

  useEffect(() => {
    if (node) {
      setLabel(node.data?.label || '');
      setConfig(node.data?.config || {});
    }
  }, [node]);

  if (!node) return null;

  const handleSave = () => {
    onUpdate(node.id, {
      ...node.data,
      label,
      config: { ...config }
    });
  };

  const handleConfigChange = (key, value) => {
    setConfig(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Render appropriate input fields depending on node type
  const renderConfigFields = () => {
    switch (node.type) {
      case 'scheduleTrigger':
        return (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-450 uppercase tracking-wider">Cron Schedule Expression</label>
              <input
                type="text"
                value={config.cron || '*/5 * * * *'}
                onChange={(e) => handleConfigChange('cron', e.target.value)}
                placeholder="*/5 * * * *"
                className="w-full bg-slate-950/80 border border-slate-800 focus:border-violet-500 rounded-xl py-2.5 px-3.5 text-sm text-slate-100 placeholder:text-slate-700 outline-none transition-all duration-200"
              />
              <span className="text-[10px] text-slate-500 font-medium">Standard cron: Minute Hour Day Month DayOfWeek</span>
            </div>
          </div>
        );

      case 'webhookTrigger':
        return (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-450 uppercase tracking-wider">Webhook POST URL</label>
              <input
                type="text"
                readOnly
                value={config.webhookUrl || `http://localhost:5000/api/webhooks/${node.id}`}
                className="w-full bg-slate-950/40 border border-slate-850 rounded-xl py-2.5 px-3.5 text-sm text-slate-500 outline-none select-all"
              />
              <span className="text-[10px] text-slate-500 font-medium">POST requests to this URL trigger execution runs</span>
            </div>
          </div>
        );

      case 'gmailSendEmail':
        return (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-450 uppercase tracking-wider">To (Recipient Email)</label>
              <input
                type="email"
                value={config.to || ''}
                onChange={(e) => handleConfigChange('to', e.target.value)}
                placeholder="recipient@domain.com"
                className="w-full bg-slate-950/80 border border-slate-800 focus:border-violet-500 rounded-xl py-2.5 px-3.5 text-sm text-slate-100 placeholder:text-slate-700 outline-none transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-450 uppercase tracking-wider">Subject</label>
              <input
                type="text"
                value={config.subject || ''}
                onChange={(e) => handleConfigChange('subject', e.target.value)}
                placeholder="Agent Alert"
                className="w-full bg-slate-950/80 border border-slate-800 focus:border-violet-500 rounded-xl py-2.5 px-3.5 text-sm text-slate-100 placeholder:text-slate-700 outline-none transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-450 uppercase tracking-wider">Email Body Message</label>
              <textarea
                rows={4}
                value={config.body || ''}
                onChange={(e) => handleConfigChange('body', e.target.value)}
                placeholder="Write message contents here..."
                className="w-full bg-slate-950/80 border border-slate-800 focus:border-violet-500 rounded-xl py-2.5 px-3.5 text-sm text-slate-100 placeholder:text-slate-700 outline-none transition-all resize-none"
              />
            </div>
          </div>
        );

      case 'slackPostMessage':
        return (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-450 uppercase tracking-wider">Slack Channel Name</label>
              <input
                type="text"
                value={config.channel || ''}
                onChange={(e) => handleConfigChange('channel', e.target.value)}
                placeholder="#general"
                className="w-full bg-slate-950/80 border border-slate-800 focus:border-violet-500 rounded-xl py-2.5 px-3.5 text-sm text-slate-100 placeholder:text-slate-700 outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-450 uppercase tracking-wider">Message Content</label>
              <textarea
                rows={4}
                value={config.text || ''}
                onChange={(e) => handleConfigChange('text', e.target.value)}
                placeholder="Slack notification text..."
                className="w-full bg-slate-950/80 border border-slate-800 focus:border-violet-500 rounded-xl py-2.5 px-3.5 text-sm text-slate-100 placeholder:text-slate-700 outline-none resize-none"
              />
            </div>
          </div>
        );

      case 'discordPostMessage':
        return (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-450 uppercase tracking-wider">Discord Webhook URL</label>
              <input
                type="text"
                value={config.webhookUrl || ''}
                onChange={(e) => handleConfigChange('webhookUrl', e.target.value)}
                placeholder="https://discord.com/api/webhooks/..."
                className="w-full bg-slate-950/80 border border-slate-800 focus:border-violet-500 rounded-xl py-2.5 px-3.5 text-sm text-slate-100 placeholder:text-slate-700 outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-450 uppercase tracking-wider">Message Content</label>
              <textarea
                rows={4}
                value={config.content || ''}
                onChange={(e) => handleConfigChange('content', e.target.value)}
                placeholder="Discord bot text..."
                className="w-full bg-slate-950/80 border border-slate-800 focus:border-violet-500 rounded-xl py-2.5 px-3.5 text-sm text-slate-100 placeholder:text-slate-700 outline-none resize-none"
              />
            </div>
          </div>
        );

      case 'sheetsAppendRow':
        return (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-450 uppercase tracking-wider">Google Spreadsheet ID</label>
              <input
                type="text"
                value={config.spreadsheetId || ''}
                onChange={(e) => handleConfigChange('spreadsheetId', e.target.value)}
                placeholder="1aBcD...eFgHi"
                className="w-full bg-slate-950/80 border border-slate-800 focus:border-violet-500 rounded-xl py-2.5 px-3.5 text-sm text-slate-100 placeholder:text-slate-700 outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-450 uppercase tracking-wider">Sheet Range (Tab / Cells)</label>
              <input
                type="text"
                value={config.range || 'Sheet1!A:Z'}
                onChange={(e) => handleConfigChange('range', e.target.value)}
                placeholder="Sheet1!A:Z"
                className="w-full bg-slate-950/80 border border-slate-800 focus:border-violet-500 rounded-xl py-2.5 px-3.5 text-sm text-slate-100 placeholder:text-slate-700 outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-450 uppercase tracking-wider">Append Values (Comma separated)</label>
              <input
                type="text"
                value={config.values || ''}
                onChange={(e) => handleConfigChange('values', e.target.value)}
                placeholder="Column1, Column2, {{trigger.email}}"
                className="w-full bg-slate-950/80 border border-slate-800 focus:border-violet-500 rounded-xl py-2.5 px-3.5 text-sm text-slate-100 placeholder:text-slate-700 outline-none"
              />
            </div>
          </div>
        );

      case 'aiPrompt':
        return (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-450 uppercase tracking-wider">Model provider</label>
              <select
                value={config.model || 'openrouter'}
                onChange={(e) => handleConfigChange('model', e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-800 focus:border-violet-500 rounded-xl py-2.5 px-3.5 text-sm text-slate-100 outline-none"
              >
                <option value="openrouter">OpenRouter (Default LLM)</option>
                <option value="gemini">Google Gemini SDK</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-450 uppercase tracking-wider">System Instruction</label>
              <input
                type="text"
                value={config.systemInstruction || 'You are an automation agent compiling raw reports.'}
                onChange={(e) => handleConfigChange('systemInstruction', e.target.value)}
                placeholder="System instructions..."
                className="w-full bg-slate-950/80 border border-slate-800 focus:border-violet-500 rounded-xl py-2.5 px-3.5 text-sm text-slate-100 placeholder:text-slate-700 outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-450 uppercase tracking-wider">AI Prompt Template</label>
              <textarea
                rows={5}
                value={config.prompt || ''}
                onChange={(e) => handleConfigChange('prompt', e.target.value)}
                placeholder="Execute prompt: Summarize data: {{previousNode.output}}"
                className="w-full bg-slate-950/80 border border-slate-800 focus:border-violet-500 rounded-xl py-2.5 px-3.5 text-sm text-slate-100 placeholder:text-slate-700 outline-none resize-none"
              />
            </div>
          </div>
        );

      default:
        return (
          <p className="text-xs text-slate-550 italic">
            This node type has no custom execution configurations.
          </p>
        );
    }
  };

  return (
    <div className="w-80 border-l border-slate-800/60 bg-slate-900/40 backdrop-blur-md p-5 flex flex-col h-full overflow-y-auto shrink-0 select-none">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-850 pb-4 mb-5">
        <div>
          <h3 className="font-bold text-slate-205 text-sm uppercase tracking-wider">Configuration</h3>
          <span className="text-[10px] text-violet-400 font-semibold uppercase">{node.type}</span>
        </div>
        <button onClick={onClose} className="text-slate-500 hover:text-slate-350 cursor-pointer">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Form Fields */}
      <div className="flex-1 space-y-5">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-450 uppercase tracking-wider">Node Title</label>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="w-full bg-slate-950/80 border border-slate-800 focus:border-violet-500 rounded-xl py-2.5 px-3.5 text-sm text-slate-100 placeholder:text-slate-700 outline-none transition-all duration-200"
          />
        </div>

        {renderConfigFields()}
      </div>

      {/* Footer controls */}
      <div className="border-t border-slate-850 pt-4 mt-6">
        <button
          onClick={handleSave}
          className="w-full bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs py-3 px-4 rounded-xl flex items-center justify-center space-x-2 transition-all active:scale-[0.98] cursor-pointer"
        >
          <Save className="w-4 h-4" />
          <span>Apply Configurations</span>
        </button>
      </div>
    </div>
  );
}
