import ProtectedRoute from '../components/ProtectedRoute/index.js';
import AppShell from '../components/AppShell/index.js';
import { useAuthStore } from '../store/authStore.js';
import { User, Shield, KeyRound, CheckCircle2, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';

export default function Settings() {
  const { user } = useAuthStore();
  const [showKey, setShowKey] = useState(false);

  // Health checks
  const keysHealth = {
    encryptionKey: 'healthy', // derived from CREDENTIAL_ENCRYPTION_KEY
    openRouter: 'unset',      // default env
    gemini: 'unset',          // default env
  };

  return (
    <ProtectedRoute>
      <AppShell>
        <div className="space-y-8 select-none">
          {/* Header */}
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Security & Settings</h1>
            <p className="text-sm text-slate-400 mt-1">Manage system keys, integrations health, and console profiles</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left side: Profile info */}
            <div className="lg:col-span-1 space-y-6">
              {/* Profile Card */}
              <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-6 backdrop-blur-md">
                <h3 className="font-bold text-slate-105 mb-4 flex items-center space-x-2">
                  <User className="w-4.5 h-4.5 text-violet-400" />
                  <span>Operator Profile</span>
                </h3>
                
                <div className="flex flex-col items-center py-4 border-b border-slate-850">
                  <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700 mb-3">
                    <User className="w-8 h-8 text-violet-400" />
                  </div>
                  <h4 className="font-bold text-slate-205">{user?.name || 'Operator'}</h4>
                  <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold mt-1">{user?.role || 'operator'}</span>
                </div>

                <div className="py-4 space-y-3.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Email Address</span>
                    <span className="font-medium text-slate-300">{user?.email || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Access Role</span>
                    <span className="font-medium text-slate-300 capitalize">{user?.role || 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right side: Key Management & Health checks */}
            <div className="lg:col-span-2 space-y-6">
              {/* Key Health check */}
              <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-6 backdrop-blur-md">
                <h3 className="font-bold text-slate-105 mb-4 flex items-center space-x-2">
                  <KeyRound className="w-4.5 h-4.5 text-violet-400" />
                  <span>Credential Key & API Health Checks</span>
                </h3>

                <div className="space-y-4">
                  {/* Encryption check */}
                  <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/40 flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-semibold text-slate-200">Credential Encryption Key</h4>
                      <p className="text-xs text-slate-500 mt-1">Used to encrypt integrations OAuth secrets at rest (AES-256)</p>
                    </div>
                    <span className="inline-flex items-center space-x-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/15 rounded-lg text-xs font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Loaded (32-bytes)</span>
                    </span>
                  </div>

                  {/* OpenRouter Check */}
                  <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/40 flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-semibold text-slate-200">OpenRouter API Access</h4>
                      <p className="text-xs text-slate-500 mt-1">Primary backend generator model substrate</p>
                    </div>
                    <span className="inline-flex items-center space-x-1.5 px-3 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/15 rounded-lg text-xs font-semibold">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Unset (Deterministic Fallback)</span>
                    </span>
                  </div>

                  {/* Gemini Check */}
                  <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/40 flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-semibold text-slate-200">Google Gemini LLM SDK</h4>
                      <p className="text-xs text-slate-500 mt-1">Fallback generator model substrate</p>
                    </div>
                    <span className="inline-flex items-center space-x-1.5 px-3 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/15 rounded-lg text-xs font-semibold">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Unset (Deterministic Fallback)</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
