import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuthStore } from '../store/authStore.js';
import { Workflow, ShieldAlert, Cpu, ArrowRight, ShieldCheck, Zap, Activity } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, isHydrated, initAuth } = useAuthStore();

  useEffect(() => {
    if (!isHydrated) {
      initAuth();
    }
  }, [isHydrated, initAuth]);

  useEffect(() => {
    if (isHydrated && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isHydrated, isAuthenticated, router]);

  if (!isHydrated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950 text-slate-100">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 font-medium">Booting platform...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 relative overflow-hidden select-none">
      {/* Dynamic Gradients */}
      <div className="absolute top-[-30%] left-[-20%] w-[80%] h-[80%] rounded-full bg-violet-600/10 blur-[150px] pointer-events-none"></div>
      <div className="absolute bottom-[-30%] right-[-20%] w-[80%] h-[80%] rounded-full bg-fuchsia-600/10 blur-[150px] pointer-events-none"></div>

      {/* Navigation Header */}
      <header className="h-20 max-w-7xl mx-auto flex items-center justify-between px-6 md:px-8 border-b border-slate-900/60 relative z-10">
        <div className="flex items-center space-x-2">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-violet-600 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-violet-600/20">
            <Workflow className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">Agentflow_AI</span>
        </div>
        <div className="flex items-center space-x-4">
          <Link href="/login" className="text-sm font-semibold text-slate-350 hover:text-white transition-colors">
            Login
          </Link>
          <Link href="/register" className="text-sm font-semibold bg-violet-600 hover:bg-violet-500 text-white px-4.5 py-2.5 rounded-xl shadow-lg shadow-violet-600/20 transition-all active:scale-[0.98]">
            Get Started
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 md:px-8 pt-20 pb-16 flex flex-col items-center text-center relative z-10">
        <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-violet-950/30 border border-violet-500/25 text-violet-400 text-xs font-semibold mb-6">
          <Cpu className="w-3.5 h-3.5" />
          <span>Multi-Agent Operations substrate</span>
        </div>

        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight max-w-4xl leading-[1.15]">
          Describe automations. <br />
          <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-500 bg-clip-text text-transparent">
            Execute visual agent chains.
          </span>
        </h1>

        <p className="text-slate-450 max-w-2xl mt-6 text-base md:text-lg leading-relaxed">
          Agentflow_AI compiles natural language prompts into graphical pipelines, running them across a specialized sequence of planner, execution, validation, recovery, and monitoring agents.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
          <Link href="/register" className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-semibold py-4 px-8 rounded-xl shadow-xl shadow-violet-600/10 hover:shadow-violet-600/20 transition-all active:scale-[0.98]">
            <span>Build Workflow Graph</span>
            <ArrowRight className="w-4.5 h-4.5" />
          </Link>
          <a href="#orchestration-showcase" className="w-full sm:w-auto flex items-center justify-center space-x-2 border border-slate-800 hover:bg-slate-900/60 font-semibold py-4 px-8 rounded-xl transition-all">
            <span>Explore Agent Chain</span>
          </a>
        </div>
      </section>

      {/* Multi-Agent Orchestration Showcase */}
      <section id="orchestration-showcase" className="max-w-6xl mx-auto px-6 pb-24 relative z-10">
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 md:p-8 backdrop-blur-md">
          <div className="flex items-center justify-between border-b border-slate-850 pb-4 mb-6">
            <div>
              <h3 className="font-bold text-slate-100 flex items-center space-x-2">
                <Activity className="w-4.5 h-4.5 text-violet-400" />
                <span>Substrate agent sequence trace</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Live execution pipeline structure</p>
            </div>
            <span className="text-xs font-semibold px-2 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/15 rounded-md flex items-center space-x-1">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
              <span>Online</span>
            </span>
          </div>

          {/* Grid showing steps */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {[
              { name: '1. Planner Agent', role: 'Graph layout compilation & logic layout', color: 'border-violet-500/20 bg-violet-950/5 text-violet-400' },
              { name: '2. Execution Agent', role: 'Third-party OAuth integrations execution', color: 'border-indigo-500/20 bg-indigo-950/5 text-indigo-400' },
              { name: '3. Validation Agent', role: 'Schema field integrity validation check', color: 'border-blue-500/20 bg-blue-950/5 text-blue-400' },
              { name: '4. Recovery Agent', role: 'Failure classification & auto-retry/escalation', color: 'border-amber-500/20 bg-amber-950/5 text-amber-400' },
              { name: '5. Monitoring Agent', role: 'Real-time telemetry event streaming', color: 'border-rose-500/20 bg-rose-950/5 text-rose-450' },
            ].map((agent, i) => (
              <div key={i} className={`p-4.5 rounded-xl border flex flex-col justify-between ${agent.color}`}>
                <div>
                  <h4 className="text-sm font-bold">{agent.name}</h4>
                  <p className="text-xs text-slate-450 mt-1.5 leading-relaxed">{agent.role}</p>
                </div>
                <div className="flex items-center space-x-1.5 mt-4 text-[10px] font-semibold text-slate-500">
                  <Zap className="w-3 h-3 text-slate-500" />
                  <span>Telemetry active</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
