import ProtectedRoute from '../../components/ProtectedRoute/index.js';
import AppShell from '../../components/AppShell/index.js';
import { Activity } from 'lucide-react';
import { useRouter } from 'next/router';

export default function ExecutionDetails() {
  const router = useRouter();
  const { id } = router.query;

  return (
    <ProtectedRoute>
      <AppShell>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Agent Stream Timeline</h1>
            <p className="text-sm text-slate-400 mt-1">Audit execution ID: {id}</p>
          </div>

          <div className="p-12 border border-dashed border-slate-800 rounded-2xl flex flex-col items-center justify-center text-center max-w-2xl mx-auto bg-slate-900/10">
            <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center mb-4">
              <Activity className="w-6 h-6 text-violet-400 animate-spin" style={{ animationDuration: '3s' }} />
            </div>
            <h3 className="font-bold text-slate-200">Execution Telemetry Stream</h3>
            <p className="text-sm text-slate-500 max-w-sm mt-2">
              Socket.IO listener will stream agent timeline logs and telemetry updates dynamically in subsequent phases.
            </p>
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
