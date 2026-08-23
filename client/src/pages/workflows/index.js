import { useEffect, useState } from 'react';
import ProtectedRoute from '../../components/ProtectedRoute/index.js';
import AppShell from '../../components/AppShell/index.js';
import { useWorkflowStore } from '../../store/workflowStore.js';
import { Workflow, Plus, Search, Trash2, Copy, Zap, X, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/router';

export default function WorkflowsList() {
  const router = useRouter();
  const { workflows, isLoading, error, fetchWorkflows, createWorkflow, duplicateWorkflow, deleteWorkflow } = useWorkflowStore();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Creation modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    fetchWorkflows({ search, status: statusFilter });
  }, [search, statusFilter, fetchWorkflows]);

  const openCreateModal = () => {
    setName('');
    setDescription('');
    setIsModalOpen(true);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    const wf = await createWorkflow({
      name: name.trim(),
      description: description.trim() || 'Created manually via operator console.',
      nodes: [
        {
          id: 'manualTrigger_default',
          type: 'manualTrigger',
          position: { x: 250, y: 180 },
          data: { label: 'Manual Trigger', config: {} }
        }
      ],
      edges: []
    });

    setIsModalOpen(false);
    if (wf) {
      router.push(`/workflows/${wf._id || wf.id}`);
    }
  };

  const handleDuplicate = async (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    await duplicateWorkflow(id);
  };

  const handleDelete = async (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this workflow?')) {
      await deleteWorkflow(id);
    }
  };

  return (
    <ProtectedRoute>
      <AppShell>
        <div className="space-y-6 select-none relative">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Workflow Graphs</h1>
              <p className="text-sm text-slate-400 mt-1">Manage and execute your AI automation tasks</p>
            </div>
            <button
              onClick={openCreateModal}
              id="btn-create-workflow"
              className="flex items-center justify-center space-x-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white text-sm font-semibold px-4.5 py-2.5 rounded-xl shadow-lg active:scale-[0.98] transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Graph</span>
            </button>
          </div>

          {/* Error display */}
          {error && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/15 text-red-400 text-xs font-medium">
              {error}
            </div>
          )}

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4 bg-slate-900/20 p-4 border border-slate-805/60 rounded-xl">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search workflows..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-800 focus:border-violet-500 rounded-xl py-2 pl-9 pr-4 text-xs text-slate-100 placeholder:text-slate-600 outline-none transition-all"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-950/80 border border-slate-800 focus:border-violet-500 rounded-xl py-2 px-4 text-xs text-slate-305 outline-none"
            >
              <option value="">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
            </select>
          </div>

          {/* Workflows List Grid */}
          {isLoading && workflows.length === 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2].map((i) => (
                <div key={i} className="h-44 border border-slate-850 bg-slate-900/10 rounded-2xl animate-pulse"></div>
              ))}
            </div>
          ) : workflows.length === 0 ? (
            <div className="p-16 border border-dashed border-slate-800 rounded-2xl flex flex-col items-center justify-center text-center max-w-xl mx-auto bg-slate-900/10">
              <Workflow className="w-10 h-10 text-violet-400/80 mb-4" />
              <h3 className="font-bold text-slate-200 text-sm">No workflow graphs found</h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Start by creating a manual workflow or head to the AI workflow builder to generate visual flows from language prompts.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {workflows.map((wf) => (
                <Link 
                  key={wf._id || wf.id}
                  href={`/workflows/${wf._id || wf.id}`}
                  className="p-5 border border-slate-800 bg-slate-900/40 hover:border-slate-700 rounded-2xl flex flex-col justify-between h-44 hover:shadow-xl hover:shadow-black/10 transition-all group"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-bold text-slate-200 group-hover:text-violet-400 transition-colors text-base truncate max-w-[240px]">
                          {wf.name}
                        </h4>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2 max-w-[280px]">
                          {wf.description || 'No description provided.'}
                        </p>
                      </div>
                      <span className={`text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full border ${
                        wf.status === 'active' 
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/15' 
                          : 'bg-slate-800 text-slate-400 border-slate-800'
                      }`}>
                        {wf.status}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-850 pt-3.5 mt-4">
                    <div className="flex items-center space-x-2 text-[10px] text-slate-500 font-semibold">
                      <Zap className="w-3 h-3 text-slate-500" />
                      <span>{wf.nodes?.length || 0} nodes</span>
                      <span>•</span>
                      <span>v{wf.version || 1}</span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={(e) => handleDuplicate(e, wf._id || wf.id)}
                        className="p-2 rounded-lg border border-slate-800 hover:border-slate-700 bg-slate-950/40 text-slate-450 hover:text-white transition-colors cursor-pointer"
                        title="Duplicate"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => handleDelete(e, wf._id || wf.id)}
                        className="p-2 rounded-lg border border-slate-800 hover:border-slate-700 bg-slate-950/40 text-slate-450 hover:text-red-400 transition-colors cursor-pointer"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Create Workflow Beautiful Modal */}
          {isModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
              <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between border-b border-slate-850 pb-3 mb-4">
                  <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2">
                    <Workflow className="w-5 h-5 text-violet-400" />
                    <span>Create Workflow Graph</span>
                  </h3>
                  <button 
                    onClick={() => setIsModalOpen(false)}
                    className="text-slate-500 hover:text-slate-300 cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleCreateSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Workflow Name</label>
                    <input
                      type="text"
                      id="txt-workflow-name"
                      placeholder="Gmail sync to Slack"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-slate-950/80 border border-slate-800 focus:border-violet-500 rounded-xl py-2.5 px-3.5 text-sm text-slate-100 placeholder:text-slate-700 outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Description</label>
                    <textarea
                      id="txt-workflow-desc"
                      placeholder="Explain what this automation graph accomplishes..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                      className="w-full bg-slate-950/80 border border-slate-800 focus:border-violet-500 rounded-xl py-2.5 px-3.5 text-sm text-slate-100 placeholder:text-slate-700 outline-none resize-none"
                    />
                  </div>

                  <div className="flex justify-end space-x-3 pt-3 border-t border-slate-850">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="px-4.5 py-2.5 rounded-xl border border-slate-800 hover:bg-slate-800 text-xs font-semibold text-slate-400 hover:text-slate-205 transition-all cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      id="btn-submit-workflow"
                      className="px-4.5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white text-xs font-semibold shadow-lg shadow-violet-650/10 transition-all active:scale-[0.98] cursor-pointer"
                    >
                      Compile Graph
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
