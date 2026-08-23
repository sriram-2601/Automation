import { Workflow, Play, ShieldCheck, RefreshCw } from 'lucide-react';

export default function MetricGrid() {
  const metrics = [
    {
      title: 'Total workflow plans',
      value: '12',
      change: '+2 this week',
      icon: Workflow,
      color: 'from-violet-600/20 to-fuchsia-600/5 text-violet-400 border-violet-500/15',
    },
    {
      title: 'Active run instances',
      value: '3',
      change: '1 running now',
      icon: Play,
      color: 'from-emerald-600/20 to-teal-600/5 text-emerald-400 border-emerald-500/15',
    },
    {
      title: 'Average agent confidence',
      value: '94.2%',
      change: '+1.4% vs yesterday',
      icon: ShieldCheck,
      color: 'from-blue-600/20 to-indigo-600/5 text-blue-400 border-blue-500/15',
    },
    {
      title: 'Auto-recovery success',
      value: '98.8%',
      change: '12 transient failures bypassed',
      icon: RefreshCw,
      color: 'from-amber-600/20 to-orange-650/5 text-amber-400 border-amber-500/15',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 select-none">
      {metrics.map((m, i) => {
        const Icon = m.icon;
        return (
          <div 
            key={i} 
            className={`p-6 rounded-2xl border bg-slate-900/40 backdrop-blur-md bg-gradient-to-tr ${m.color} flex flex-col justify-between h-40 shadow-lg shadow-black/10`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{m.title}</span>
              <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                <Icon className="w-5 h-5" />
              </div>
            </div>
            <div>
              <h3 className="text-3xl font-bold tracking-tight text-white mt-4">{m.value}</h3>
              <p className="text-xs text-slate-400 mt-1 font-medium">{m.change}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
