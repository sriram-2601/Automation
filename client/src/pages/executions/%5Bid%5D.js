import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import ProtectedRoute from '../../components/ProtectedRoute/index.js';
import AppShell from '../../components/AppShell/index.js';
import { subscribeToExecution } from '../../services/socket.js';
import { 
  ArrowLeft, 
  Play, 
  Pause, 
  Trash2, 
  Terminal, 
  CheckCircle, 
  AlertCircle, 
  Activity, 
  Cpu, 
  Clock, 
  Database,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import Link from 'next/link';
import api from '../../services/api.js';

export default function ExecutionDetails() {
  const router = useRouter();
  const { id } = router.query;
  
  const [execution, setExecution] = useState(null);
  const [timelineLogs, setTimelineLogs] = useState([]);
  const [expandedLogId, setExpandedLogId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [alert, setAlert] = useState(null);

  const fetchExecutionData = async () => {
    if (!id) return;
    try {
      const [execRes, timelineRes] = await Promise.all([
        api.get(`/executions/${id}`),
        api.get(`/executions/${id}/timeline`)
      ]);
      setExecution(execRes.data);
      setTimelineLogs(timelineRes.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load execution details.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchExecutionData();
  }, [id]);

  // Subscribe to real-time socket events for this run
  useEffect(() => {
    if (!id) return;

    const unsubscribe = subscribeToExecution(id, (event) => {
      // Append new event to timeline
      setTimelineLogs(prev => {
        // Prevent duplicate events
        const exists = prev.some(l => l._id === event.logId || (l.message === event.message && l.timestamp === event.timestamp));
        if (exists) return prev;
        
        return [...prev, {
          _id: event.logId || `temp-${Date.now()}-${Math.random()}`,
          executionId: id,
          nodeId: event.nodeId,
          agent: event.agent,
          level: event.level,
          message: event.message,
          metadata: event.metadata,
          createdAt: event.timestamp || new Date(),
        }];
      });

      // Periodically refresh execution header state (e.g. status changes to COMPLETED/FAILED)
      fetchExecutionData();
    });

    return () => {
      unsubscribe();
    };
  }, [id]);

  useEffect(() => {
    if (alert) {
      const timer = setTimeout(() => setAlert(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [alert]);

  const handlePause = async () => {
    try {
      const res = await api.post(`/executions/${id}/pause`);
      setExecution(res.data);
      setAlert({ type: 'success', message: 'Execution paused successfully.' });
    } catch (err) {
      setAlert({ type: 'error', message: err.response?.data?.message || 'Failed to pause execution.' });
    }
  };

  const handleResume = async () => {
    try {
      const res = await api.post(`/executions/${id}/resume`);
      setAlert({ type: 'success', message: 'Workflow resumption signal sent.' });
      setTimeout(fetchExecutionData, 1000);
    } catch (err) {
      setAlert({ type: 'error', message: err.response?.data?.message || 'Failed to resume execution.' });
    }
  };

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this running execution?')) return;
    try {
      const res = await api.post(`/executions/${id}/cancel`);
      setExecution(res.data);
      setAlert({ type: 'success', message: 'Execution cancelled.' });
    } catch (err) {
      setAlert({ type: 'error', message: err.response?.data?.message || 'Failed to cancel execution.' });
    }
  };

  const toggleExpandLog = (logId) => {
    setExpandedLogId(expandedLogId === logId ? null : logId);
  };

  const getAgentBadge = (agent) => {
    switch (agent) {
      case 'planner':
        return <span className="inline-flex items-center px-2 py-0.5 rounded bg-violet-550/15 text-violet-400 font-bold border border-violet-500/10 uppercase tracking-wider text-[9px]">Planner</span>;
      case 'execution':
        return <span className="inline-flex items-center px-2 py-0.5 rounded bg-indigo-550/15 text-indigo-400 font-bold border border-indigo-500/10 uppercase tracking-wider text-[9px]">Execution</span>;
      case 'validation':
        return <span className="inline-flex items-center px-2 py-0.5 rounded bg-blue-550/15 text-blue-400 font-bold border border-blue-500/10 uppercase tracking-wider text-[9px]">Validation</span>;
      case 'recovery':
        return <span className="inline-flex items-center px-2 py-0.5 rounded bg-amber-550/15 text-amber-400 font-bold border border-amber-500/10 uppercase tracking-wider text-[9px]">Recovery</span>;
      case 'monitoring':
        return <span className="inline-flex items-center px-2 py-0.5 rounded bg-rose-550/15 text-rose-450 font-bold border border-rose-500/10 uppercase tracking-wider text-[9px]">Monitoring</span>;
      default:
        return <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-bold border border-slate-700 uppercase tracking-wider text-[9px]">{agent}</span>;
    }
  };

  const getLevelDot = (level) => {
    switch (level) {
      case 'success':
        return <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-md shadow-emerald-500/20"></div>;
      case 'error':
        return <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-md shadow-red-500/20"></div>;
      case 'warning':
        return <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-md shadow-amber-500/20"></div>;
      default:
        return <div className="w-2.5 h-2.5 rounded-full bg-slate-500"></div>;
    }
  };

  if (isLoading && !execution) {
    return (
      <ProtectedRoute>
        <AppShell>
          <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-450 space-y-3">
            <div className="w-9 h-9 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm font-semibold">Reading execution traces...</p>
          </div>
        </AppShell>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <AppShell>
        <div className="space-y-6 select-none relative">
          
          {/* Status Alert Overlay */}
          {alert && (
            <div className={`fixed top-20 right-6 p-4 rounded-xl shadow-lg border backdrop-blur-md flex items-center space-x-2.5 z-50 animate-in fade-in slide-in-from-top-4 duration-300 ${
              alert.type === 'success' 
                ? 'bg-emerald-955/90 text-emerald-400 border-emerald-500/20' 
                : 'bg-red-955/90 text-red-400 border-red-500/20'
            }`}>
              {alert.type === 'success' ? <CheckCircle className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
              <span className="text-xs font-semibold">{alert.message}</span>
            </div>
          )}

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <Link 
                href="/executions"
                className="p-2 rounded-xl border border-slate-805 hover:bg-slate-900/60 text-slate-450 hover:text-slate-205 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
              </Link>
              <div>
                <h1 className="text-xl md:text-2xl font-extrabold tracking-tight">Run Telemetry Stream</h1>
                <p className="text-xs text-slate-450 mt-0.5">Execution trace logs for graph: <span className="text-slate-200 font-semibold">{execution?.workflowId?.name}</span></p>
              </div>
            </div>

            {/* Run state controls */}
            {execution?.status === 'RUNNING' && (
              <div className="flex space-x-3">
                <button
                  onClick={handlePause}
                  className="flex items-center space-x-1.5 px-4.5 py-2.5 rounded-xl border border-slate-800 hover:bg-slate-850 text-xs font-semibold text-slate-300 cursor-pointer"
                >
                  <Pause className="w-3.5 h-3.5" />
                  <span>Pause Run</span>
                </button>
                <button
                  onClick={handleCancel}
                  className="flex items-center space-x-1.5 px-4.5 py-2.5 rounded-xl bg-red-950/20 hover:bg-red-500/10 border border-red-550/20 text-xs font-semibold text-red-450 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Cancel</span>
                </button>
              </div>
            )}

            {execution?.status === 'PAUSED' && (
              <button
                onClick={handleResume}
                className="flex items-center space-x-1.5 px-4.5 py-2.5 rounded-xl bg-violet-650 hover:bg-violet-600 text-xs font-semibold text-white cursor-pointer"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Resume Run</span>
              </button>
            )}
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-900/20 border border-slate-805/60 p-4.5 rounded-xl">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Flow Status</span>
              <span className="text-xs font-bold text-slate-200">{execution?.status}</span>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Duration</span>
              <span className="text-xs font-bold text-slate-200">{execution?.duration ? `${(execution.duration / 1000).toFixed(2)}s` : 'Active'}</span>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Total Retries</span>
              <span className="text-xs font-bold text-slate-200">{execution?.retryCount || 0}</span>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Start Time</span>
              <span className="text-xs font-bold text-slate-205">{new Date(execution?.startTime).toLocaleTimeString()}</span>
            </div>
          </div>

          {/* Timeline Feed Container */}
          <div className="bg-slate-900/30 border border-slate-805/65 rounded-2xl p-6 md:p-8 backdrop-blur-md">
            <h3 className="font-bold text-slate-105 text-sm flex items-center space-x-2 border-b border-slate-850 pb-4 mb-6">
              <Terminal className="w-4.5 h-4.5 text-violet-400" />
              <span>Chronological Agent Timeline</span>
            </h3>

            {timelineLogs.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs">
                Timeline list is currently empty. Waiting for execution logs stream...
              </div>
            ) : (
              <div className="relative border-l border-slate-800 pl-6 space-y-6">
                {timelineLogs.map((log) => {
                  const isExpanded = expandedLogId === log._id;
                  const hasMeta = log.metadata && Object.keys(log.metadata).length > 0;
                  
                  return (
                    <div key={log._id} className="relative group">
                      {/* Timeline point indicator */}
                      <div className="absolute top-1.5 -left-[30px] w-[9px] h-[9px] flex items-center justify-center">
                        <div className="absolute -left-1 bg-slate-950 px-1 py-0.5">
                          {getLevelDot(log.level)}
                        </div>
                      </div>

                      {/* Header block */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                        <div className="flex items-center space-x-3">
                          {getAgentBadge(log.agent)}
                          {log.nodeId && (
                            <span className="text-[10px] font-mono text-slate-500 select-all bg-slate-950/60 border border-slate-800 px-1.5 py-0.5 rounded">
                              {log.nodeId}
                            </span>
                          )}
                          <span className="text-xs font-medium text-slate-350">{log.message}</span>
                        </div>
                        
                        <div className="flex items-center space-x-3.5 shrink-0 self-end sm:self-auto">
                          <span className="text-[10px] text-slate-550 font-medium">
                            {new Date(log.createdAt).toLocaleTimeString()}
                          </span>

                          {hasMeta && (
                            <button 
                              onClick={() => toggleExpandLog(log._id)}
                              className="text-slate-500 hover:text-slate-350 p-1 border border-slate-800 rounded bg-slate-950/30 cursor-pointer"
                            >
                              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Expanded variables panel */}
                      {isExpanded && hasMeta && (
                        <div className="mt-3 p-4 rounded-xl border border-slate-800/80 bg-slate-950/60 font-mono text-[10px] leading-relaxed overflow-x-auto text-slate-400 animate-in slide-in-from-top-2 duration-200">
                          <pre>{JSON.stringify(log.metadata, null, 2)}</pre>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
