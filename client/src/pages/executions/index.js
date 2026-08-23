import { useEffect, useState } from 'react';
import ProtectedRoute from '../../components/ProtectedRoute/index.js';
import AppShell from '../../components/AppShell/index.js';
import { Activity, Clock, PlayCircle, ShieldAlert, CheckCircle2, RefreshCw, XCircle, ChevronRight, Ban, PauseCircle } from 'lucide-react';
import Link from 'next/link';
import api from '../../services/api.js';

export default function ExecutionsList() {
  const [executions, setExecutions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchExecutions = async () => {
    try {
      const response = await api.get('/executions');
      setExecutions(response.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch execution records.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchExecutions();
    
    // Poll every 3 seconds to show live updates of background queues in execution list
    const timer = setInterval(fetchExecutions, 3000);
    return () => clearInterval(timer);
  }, []);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDING':
        return <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700">Pending</span>;
      case 'RUNNING':
        return (
          <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-violet-500/10 text-violet-400 border border-violet-500/15">
            <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-pulse"></span>
            <span>Running</span>
          </span>
        );
      case 'COMPLETED':
        return <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/15">Completed</span>;
      case 'FAILED':
        return <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/15">Failed</span>;
      case 'RETRYING':
        return <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/15">Retrying</span>;
      case 'PAUSED':
        return <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-350 border border-slate-750">Paused</span>;
      case 'CANCELLED':
        return <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-900 text-slate-500 border border-slate-850">Cancelled</span>;
      default:
        return <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-805 text-slate-405">{status}</span>;
    }
  };

  return (
    <ProtectedRoute>
      <AppShell>
        <div className="space-y-6 select-none">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Execution Traces</h1>
              <p className="text-sm text-slate-400 mt-1">Audit timeline and live multi-agent runs telemetry</p>
            </div>
            <button 
              onClick={fetchExecutions}
              className="p-2 rounded-xl border border-slate-805 hover:bg-slate-900/60 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <RefreshCw className="w-4.5 h-4.5" />
            </button>
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/15 text-red-400 text-xs font-medium">
              {error}
            </div>
          )}

          {isLoading && executions.length === 0 ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 border border-slate-850 bg-slate-900/10 rounded-xl animate-pulse"></div>
              ))}
            </div>
          ) : executions.length === 0 ? (
            <div className="p-16 border border-dashed border-slate-800 rounded-2xl flex flex-col items-center justify-center text-center max-w-xl mx-auto bg-slate-900/10">
              <Activity className="w-10 h-10 text-violet-400/80 mb-4" />
              <h3 className="font-bold text-slate-200 text-sm">No executions found</h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Trigger a workflow run from the canvas editor or via webhook triggers to populate agent audit lists.
              </p>
            </div>
          ) : (
            <div className="bg-slate-900/20 border border-slate-805/60 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-850 bg-slate-900/30 text-slate-450 uppercase text-[10px] font-bold tracking-wider">
                      <th className="py-4.5 px-6">Workflow Name</th>
                      <th className="py-4.5 px-6">Execution ID</th>
                      <th className="py-4.5 px-6">Status</th>
                      <th className="py-4.5 px-6">Triggers / Retries</th>
                      <th className="py-4.5 px-6">Start Time</th>
                      <th className="py-4.5 px-6">Duration</th>
                      <th className="py-4.5 px-6 text-right">View Audit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850/60 text-xs">
                    {executions.map((exec) => (
                      <tr 
                        key={exec._id || exec.id}
                        className="hover:bg-slate-900/10 transition-colors group text-slate-300"
                      >
                        <td className="py-4.5 px-6 font-semibold text-slate-200">
                          {exec.workflowId?.name || 'Deleted Workflow'}
                        </td>
                        <td className="py-4.5 px-6 font-mono text-slate-500 select-all">
                          {exec._id || exec.id}
                        </td>
                        <td className="py-4.5 px-6">
                          {getStatusBadge(exec.status)}
                        </td>
                        <td className="py-4.5 px-6 text-slate-400 font-medium">
                          {exec.retryCount > 0 ? (
                            <span className="text-amber-400">Retry #{exec.retryCount}</span>
                          ) : (
                            <span>1st run</span>
                          )}
                        </td>
                        <td className="py-4.5 px-6 text-slate-500 font-medium">
                          {new Date(exec.startTime).toLocaleTimeString()} ({new Date(exec.startTime).toLocaleDateString()})
                        </td>
                        <td className="py-4.5 px-6 font-medium text-slate-400">
                          {exec.duration ? `${(exec.duration / 1000).toFixed(2)}s` : '--'}
                        </td>
                        <td className="py-4.5 px-6 text-right">
                          <Link 
                            href={`/executions/${exec._id || exec.id}`}
                            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-950/40 text-slate-400 hover:text-white hover:border-slate-700 transition-all cursor-pointer font-semibold"
                          >
                            <span>Inspect</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
