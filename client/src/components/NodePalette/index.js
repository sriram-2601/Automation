import { Play, Clock, Webhook, Mail, MessageSquare, Send, FileSpreadsheet, Brain, HelpCircle } from 'lucide-react';

const NODE_TYPES = [
  {
    category: 'Triggers',
    items: [
      { type: 'manualTrigger', label: 'Manual Trigger', icon: Play, desc: 'Execute flow on demand', color: 'text-emerald-400 bg-emerald-500/10' },
      { type: 'scheduleTrigger', label: 'Cron Scheduler', icon: Clock, desc: 'Trigger on periodic cron schedule', color: 'text-amber-400 bg-amber-500/10' },
      { type: 'webhookTrigger', label: 'Webhook Trigger', icon: Webhook, desc: 'Trigger via external HTTP POST', color: 'text-blue-400 bg-blue-500/10' },
    ]
  },
  {
    category: 'Actions',
    items: [
      { type: 'gmailSendEmail', label: 'Gmail Send Email', icon: Mail, desc: 'Send email from your account', color: 'text-red-400 bg-red-500/10' },
      { type: 'slackPostMessage', label: 'Slack Post Msg', icon: MessageSquare, desc: 'Post message to channel', color: 'text-pink-400 bg-pink-500/10' },
      { type: 'discordPostMessage', label: 'Discord Bot Msg', icon: Send, desc: 'Post message via bot hook', color: 'text-indigo-400 bg-indigo-500/10' },
      { type: 'sheetsAppendRow', label: 'Sheets Append', icon: FileSpreadsheet, desc: 'Append data row to Google Sheet', color: 'text-green-400 bg-green-500/10' },
    ]
  },
  {
    category: 'AI & Processing',
    items: [
      { type: 'aiPrompt', label: 'AI Prompt Node', icon: Brain, desc: 'Run LLM prompt with OpenRouter/Gemini', color: 'text-fuchsia-400 bg-fuchsia-500/10' },
    ]
  }
];

export default function NodePalette() {
  const onDragStart = (event, nodeType, label) => {
    event.dataTransfer.setData('application/reactflow', JSON.stringify({ type: nodeType, label }));
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="w-72 border-r border-slate-800/60 bg-slate-900/40 backdrop-blur-md p-5 flex flex-col space-y-6 h-full overflow-y-auto shrink-0 select-none">
      <div>
        <h3 className="font-bold text-slate-205 text-sm uppercase tracking-wider">Node Palette</h3>
        <p className="text-xs text-slate-500 mt-1">Drag and drop nodes onto the editor canvas to build flow graphs</p>
      </div>

      <div className="space-y-6">
        {NODE_TYPES.map((cat, catIdx) => (
          <div key={catIdx} className="space-y-2.5">
            <h4 className="text-xs font-semibold text-slate-450 tracking-wide uppercase px-1">
              {cat.category}
            </h4>
            <div className="space-y-2">
              {cat.items.map((node, nodeIdx) => {
                const Icon = node.icon;
                return (
                  <div
                    key={nodeIdx}
                    draggable
                    onDragStart={(e) => onDragStart(e, node.type, node.label)}
                    className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/40 hover:bg-slate-800/45 hover:border-slate-700 transition-all cursor-grab active:cursor-grabbing flex items-start space-x-3 group"
                  >
                    <div className={`p-2 rounded-lg shrink-0 ${node.color} border border-current/10`}>
                      <Icon className="w-4.5 h-4.5" />
                    </div>
                    <div className="overflow-hidden">
                      <h5 className="text-xs font-bold text-slate-200 group-hover:text-violet-400 transition-colors">
                        {node.label}
                      </h5>
                      <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed truncate">
                        {node.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
