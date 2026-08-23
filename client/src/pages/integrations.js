import { useEffect, useState } from 'react';
import ProtectedRoute from '../components/ProtectedRoute/index.js';
import AppShell from '../components/AppShell/index.js';
import { useAuthStore } from '../store/authStore.js';
import { Mail, MessageSquare, Send, FileSpreadsheet, CheckCircle2, XCircle, ArrowRight, RefreshCw, AlertCircle } from 'lucide-react';
import api from '../services/api.js';

const PROVIDER_METADATA = {
  gmail: { label: 'Gmail API Connection', icon: Mail, desc: 'Send emails and trigger runs from inbox updates', color: 'text-red-400 bg-red-500/10 border-red-500/15' },
  slack: { label: 'Slack Operations Bot', icon: MessageSquare, desc: 'Post notifications and updates to channels', color: 'text-pink-400 bg-pink-500/10 border-pink-500/15' },
  'google-sheets': { label: 'Google Sheets Integration', icon: FileSpreadsheet, desc: 'Append data rows and log operational variables', color: 'text-green-400 bg-green-500/10 border-green-500/15' },
  discord: { label: 'Discord Webhook Bot', icon: Send, desc: 'Send alerts to discord server channels', color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/15' },
};

export default function Integrations() {
  const { user } = useAuthStore();
  const [integrations, setIntegrations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchIntegrations = async () => {
    try {
      const response = await api.get('/integrations');
      setIntegrations(response.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch integrations.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchIntegrations();

    // Check query params for returned OAuth status messages
    const urlParams = new URLSearchParams(window.location.search);
    const provider = urlParams.get('provider');
    const status = urlParams.get('status');
    const err = urlParams.get('error');

    if (status === 'connected' && provider) {
      setSuccess(`Connected to ${provider.toUpperCase()} successfully.`);
      // Clear query params
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (status === 'error' && err) {
      setError(`Authentication failed: ${err}`);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleConnect = (provider) => {
    const userId = user?._id || user?.id || '';
    // Redirect browser to backend OAuth redirect initiator
    window.location.href = `http://localhost:5000/api/integrations/oauth/${provider}/start?userId=${userId}`;
  };

  const handleDisconnect = async (provider) => {
    if (!confirm(`Are you sure you want to disconnect ${provider.toUpperCase()}?`)) return;
    
    setError('');
    setSuccess('');
    try {
      await api.delete(`/integrations/${provider}`);
      setSuccess(`Disconnected ${provider.toUpperCase()} integration.`);
      await fetchIntegrations();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to disconnect integration.');
    }
  };

  return (
    <ProtectedRoute>
      <AppShell>
        <div className="space-y-6 select-none">
          {/* Header */}
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Third-Party Connections</h1>
            <p className="text-sm text-slate-400 mt-1">Configure OAuth status and bot credentials for external platforms</p>
          </div>

          {/* Alerts */}
          {error && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/15 text-red-400 text-xs flex items-center space-x-2 font-medium">
              <AlertCircle className="w-4.5 h-4.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/15 text-emerald-400 text-xs flex items-center space-x-2 font-medium">
              <CheckCircle2 className="w-4.5 h-4.5 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-44 border border-slate-850 bg-slate-900/10 rounded-2xl animate-pulse"></div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {integrations.map((item) => {
                const meta = PROVIDER_METADATA[item.provider] || {
                  label: item.provider,
                  icon: Mail,
                  desc: 'Provider integration description',
                  color: 'text-slate-400 bg-slate-500/10'
                };
                const Icon = meta.icon;

                return (
                  <div 
                    key={item.provider}
                    className="p-6 border border-slate-800 bg-slate-900/40 rounded-2xl flex flex-col justify-between h-48 hover:border-slate-700 hover:shadow-xl hover:shadow-black/10 transition-all group"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4">
                        <div className={`p-3 rounded-xl border ${meta.color} shrink-0`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-200 group-hover:text-violet-400 transition-colors text-base">
                            {meta.label}
                          </h4>
                          <p className="text-xs text-slate-500 mt-1.5 leading-relaxed max-w-[240px]">
                            {meta.desc}
                          </p>
                        </div>
                      </div>
                      
                      {/* Connection state */}
                      {item.isConnected ? (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/15">
                          Connected
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-bold bg-slate-800 text-slate-500 border border-slate-750">
                          Inactive
                        </span>
                      )}
                    </div>

                    <div className="flex justify-end pt-4 border-t border-slate-850/60 mt-4">
                      {item.isConnected ? (
                        <button
                          onClick={() => handleDisconnect(item.provider)}
                          className="flex items-center space-x-1 px-4 py-2 rounded-xl border border-slate-800 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 text-xs font-semibold text-slate-400 transition-all cursor-pointer"
                        >
                          <XCircle className="w-4 h-4" />
                          <span>Disconnect</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleConnect(item.provider)}
                          className="flex items-center space-x-1 px-4 py-2 rounded-xl bg-violet-650 hover:bg-violet-600 text-xs font-semibold text-white transition-all cursor-pointer"
                        >
                          <span>Establish OAuth</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
