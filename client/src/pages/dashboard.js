import ProtectedRoute from '../components/ProtectedRoute/index.js';
import AppShell from '../components/AppShell/index.js';
import MetricGrid from '../components/MetricGrid/index.js';
import { Play, Sparkles, Clock, ChevronRight, Activity, ArrowUpRight, Zap } from 'lucide-react';
import Link from 'next/link';

export default function Dashboard() {
  const recentExecutions = [
    { id: 'exec-101', name: 'Sync Invoices to Sheets', time: '10 mins ago', status: 'COMPLETED', agent: 'monitoring' },
    { id: 'exec-102', name: 'Post Alert to Discord', time: '40 mins ago', status: 'FAILED', agent: 'recovery' },
    { id: 'exec-103', name: 'Gmail Attachment Routing', time: '2 hours ago', status: 'COMPLETED', agent: 'validation' },
  ];

  const agentLogs = [
    { agent: 'Planner', action: 'Constructed execution tree for prompt: "Send email when client sheet is modified"', time: '12 mins ago' },
    { agent: 'Recovery', action: 'Bypassed Transient API rate limit for Slack notifier (re-executed step 3)', time: '41 mins ago' },
    { agent: 'Validation', action: 'Approved schemas for Discord message body compilation', time: '2 hours ago' },
  ];

  return (
    <ProtectedRoute>
      <AppShell>
        <div className="space-y-8 select-none">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Operator Dashboard</h1>
              <p className="text-sm text-slate-400 mt-1">Real-time status of Agentic AI pipelines</p>
            </div>
            <div className="flex space-x-3">
              <Link
                href="/workflows/builder"
                className="flex items-center space-x-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white text-sm font-semibold px-4.5 py-2.5 rounded-xl shadow-lg shadow-violet-600/10 active:scale-[0.98] transition-all cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>AI Prompt to Graph</span>
              </Link>
            </div>
          </div>

          {/* Metric Grid */}
          <MetricGrid />

          {/* Core Dashboard Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Recent Executions */}
            <div className="lg:col-span-2 bg-slate-900/40 border border-slate-800/60 rounded-2xl p-6 backdrop-blur-md flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-slate-850 pb-4 mb-4">
                  <h3 className="font-bold text-slate-100 flex items-center space-x-2">
                    <Activity className="w-4.5 h-4.5 text-violet-400" />
                    <span>Recent executions</span>
                  </h3>
                  <Link href="/executions" className="text-xs font-semibold text-violet-400 hover:text-violet-300 flex items-center space-x-0.5">
                    <span>Audit timeline</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <div className="divide-y divide-slate-850">
                  {recentExecutions.map((exec, idx) => (
                    <div key={idx} className="py-3.5 flex items-center justify-between group">
                      <div className="flex items-center space-x-3.5 overflow-hidden">
                        <div className={`w-2.5 h-2.5 rounded-full ${
                          exec.status === 'COMPLETED' ? 'bg-emerald-500 shadow-lg shadow-emerald-500/25' : 'bg-red-500 shadow-lg shadow-red-500/25'
                        }`}></div>
                        <div className="overflow-hidden">
                          <h4 className="text-sm font-semibold truncate text-slate-200 group-hover:text-violet-400 transition-colors">
                            {exec.name}
                          </h4>
                          <div className="flex items-center space-x-2 text-xs text-slate-500 mt-1 font-medium">
                            <Clock className="w-3 h-3" />
                            <span>{exec.time}</span>
                            <span>•</span>
                            <span className="capitalize">{exec.agent} agent active</span>
                          </div>
                        </div>
                      </div>
                      <Link 
                        href={`/executions/${exec.id}`}
                        className="p-1.5 rounded-lg border border-slate-800 bg-slate-950/40 text-slate-450 hover:text-white hover:bg-slate-800 transition-all"
                      >
                        <ArrowUpRight className="w-4 h-4" />
                      </Link>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-slate-850 pt-4 mt-6 text-center">
                <Link href="/workflows" className="text-xs font-semibold text-slate-400 hover:text-slate-200">
                  Manage all workflow graphs
                </Link>
              </div>
            </div>

            {/* AI Agent Telemetry Activity */}
            <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-6 backdrop-blur-md flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-slate-850 pb-4 mb-4">
                  <h3 className="font-bold text-slate-100 flex items-center space-x-2">
                    <Zap className="w-4.5 h-4.5 text-fuchsia-400" />
                    <span>Agent Activity Feed</span>
                  </h3>
                </div>

                <div className="space-y-4">
                  {agentLogs.map((log, idx) => (
                    <div key={idx} className="flex space-x-3">
                      <div className="w-7 h-7 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center text-[10px] font-bold text-fuchsia-400 shrink-0">
                        {log.agent[0]}
                      </div>
                      <div className="text-xs">
                        <p className="font-semibold text-slate-300">
                          {log.agent} Agent
                        </p>
                        <p className="text-slate-450 mt-0.5 leading-relaxed">{log.action}</p>
                        <span className="text-[10px] text-slate-500 font-medium mt-1 block">{log.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-slate-850 pt-4 mt-6 text-center text-xs text-slate-500 font-medium">
                Sockets connected & streaming
              </div>
            </div>
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
