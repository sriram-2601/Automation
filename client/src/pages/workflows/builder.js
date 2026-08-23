import { useState, useCallback, useRef } from 'react';
import ProtectedRoute from '../../components/ProtectedRoute/index.js';
import AppShell from '../../components/AppShell/index.js';
import { useWorkflowStore } from '../../store/workflowStore.js';
import { 
  ReactFlow, 
  MiniMap, 
  Controls, 
  Background, 
  useNodesState, 
  useEdgesState, 
  addEdge, 
  MarkerType 
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { CustomWorkflowNode } from '../../components/WorkflowCanvas/index.js';
import { Sparkles, Save, X, AlertCircle, ArrowLeft, Terminal } from 'lucide-react';
import { useRouter } from 'next/router';
import api from '../../services/api.js';

const nodeTypes = {
  manualTrigger: CustomWorkflowNode,
  scheduleTrigger: CustomWorkflowNode,
  webhookTrigger: CustomWorkflowNode,
  gmailSendEmail: CustomWorkflowNode,
  slackPostMessage: CustomWorkflowNode,
  discordPostMessage: CustomWorkflowNode,
  sheetsAppendRow: CustomWorkflowNode,
  aiPrompt: CustomWorkflowNode,
};

export default function WorkflowBuilder() {
  const router = useRouter();
  const { createWorkflow } = useWorkflowStore();
  const [promptText, setPromptText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge({
      ...params,
      animated: true,
      style: { stroke: '#8b5cf6', strokeWidth: 2 },
      markerEnd: { type: MarkerType.ArrowClosed, color: '#8b5cf6' }
    }, eds)),
    [setEdges]
  );

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!promptText.trim()) return;

    setIsGenerating(true);
    setError('');
    setSuccessMessage('');
    
    try {
      const response = await api.post('/workflows/generate', { prompt: promptText.trim() });
      const { name: genName, description: genDesc, nodes: genNodes, edges: genEdges } = response.data;
      
      setName(genName || 'AI Generated Flow');
      setDescription(genDesc || '');
      setNodes(genNodes || []);
      setEdges(genEdges || []);
      setSuccessMessage('AI workflow compiled successfully! Review and edit the graph below.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate workflow. Try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    if (nodes.length === 0) {
      setError('Cannot save an empty graph. Enter a prompt to generate nodes first.');
      return;
    }

    try {
      // Auto-compute triggerConfig from trigger nodes on canvas
      const triggerNode = nodes.find(n => n.type.toLowerCase().includes('trigger'));
      let triggerConfig = { type: 'manual' };
      
      if (triggerNode) {
        let type = 'manual';
        if (triggerNode.type === 'scheduleTrigger') type = 'schedule';
        if (triggerNode.type === 'webhookTrigger') type = 'webhook';
        
        triggerConfig = {
          type,
          cron: triggerNode.data?.config?.cron || '*/5 * * * *',
          webhookUrl: triggerNode.data?.config?.webhookUrl || '',
        };
      }

      const saved = await createWorkflow({
        name,
        description,
        nodes,
        edges,
        triggerConfig,
        status: 'draft'
      });

      if (saved) {
        router.push(`/workflows/${saved._id || saved.id}`);
      }
    } catch (err) {
      setError('Failed to persist compiled workflow.');
    }
  };

  return (
    <ProtectedRoute>
      <AppShell>
        <div className="space-y-6 select-none h-[calc(100vh-120px)] flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between shrink-0">
            <div className="flex items-center space-x-3">
              <button 
                onClick={() => router.push('/workflows')}
                className="p-2 rounded-xl border border-slate-805 hover:bg-slate-900/60 text-slate-450 hover:text-slate-205 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <h1 className="text-xl md:text-2xl font-extrabold tracking-tight">AI Prompt to Graph compiler</h1>
                <p className="text-xs text-slate-450 mt-0.5">Describe your operations in natural language to construct executable visual chains</p>
              </div>
            </div>
            {nodes.length > 0 && (
              <button
                onClick={handleSave}
                id="btn-save-ai-workflow"
                className="flex items-center space-x-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white text-xs font-semibold px-4.5 py-2.5 rounded-xl shadow-lg shadow-violet-650/10 active:scale-[0.98] transition-all cursor-pointer animate-in fade-in duration-200"
              >
                <Save className="w-4 h-4" />
                <span>Save to Workspace</span>
              </button>
            )}
          </div>

          <div className="flex-1 flex flex-col lg:flex-row gap-6 overflow-hidden">
            {/* Left Prompt Console */}
            <div className="w-full lg:w-96 flex flex-col bg-slate-900/40 border border-slate-805/60 rounded-2xl p-5 shrink-0 overflow-y-auto">
              <h3 className="font-bold text-slate-105 text-sm flex items-center space-x-2 border-b border-slate-850 pb-3 mb-4">
                <Sparkles className="w-4.5 h-4.5 text-violet-400" />
                <span>Describe automation</span>
              </h3>

              <form onSubmit={handleGenerate} className="space-y-4 flex-1 flex flex-col">
                <div className="space-y-1.5 flex-1 flex flex-col">
                  <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Natural Language Instructions</label>
                  <textarea
                    id="txt-prompt-input"
                    rows={8}
                    required
                    value={promptText}
                    onChange={(e) => setPromptText(e.target.value)}
                    placeholder='Example: "Send a slack notification to #billing and append a logging row in sheets when a new email is received about invoices"'
                    className="w-full flex-1 bg-slate-950/80 border border-slate-800 focus:border-violet-500 rounded-xl py-3 px-3.5 text-xs text-slate-100 placeholder:text-slate-700 outline-none resize-none"
                  />
                </div>

                {error && (
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/15 text-red-400 text-xs flex items-start space-x-2 font-medium">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                {successMessage && (
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/15 text-emerald-400 text-xs font-medium">
                    {successMessage}
                  </div>
                )}

                <button
                  type="submit"
                  id="btn-generate-graph"
                  disabled={isGenerating}
                  className="w-full bg-violet-650 hover:bg-violet-600 disabled:bg-slate-800 disabled:text-slate-500 text-white font-semibold text-xs py-3.5 px-4 rounded-xl flex items-center justify-center space-x-2 shadow-lg shadow-violet-650/10 active:scale-[0.98] transition-all cursor-pointer shrink-0"
                >
                  {isGenerating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Compiling Graph nodes...</span>
                    </>
                  ) : (
                    <>
                      <Terminal className="w-4 h-4" />
                      <span>Compile AI Flow Graph</span>
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Right Flow Preview Canvas */}
            <div className="flex-1 bg-slate-950 border border-slate-805/60 rounded-2xl overflow-hidden relative min-h-[300px]">
              {nodes.length === 0 ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 bg-slate-900/10">
                  <Sparkles className="w-10 h-10 text-slate-600 animate-pulse mb-3" />
                  <h3 className="font-bold text-slate-300 text-sm">Visual preview empty</h3>
                  <p className="text-xs text-slate-500 max-w-sm mt-1.5 leading-relaxed">
                    Submit automation instructions in the panel to construct a previewable React Flow layout graph.
                  </p>
                </div>
              ) : (
                <ReactFlow
                  nodes={nodes}
                  edges={edges}
                  onNodesChange={onNodesChange}
                  onEdgesChange={onEdgesChange}
                  onConnect={onConnect}
                  nodeTypes={nodeTypes}
                  fitView
                >
                  <Background color="#1e293b" gap={16} size={1} />
                  <Controls className="bg-slate-900 border border-slate-800 text-slate-300 fill-slate-300 [&>button]:border-slate-800" />
                  <MiniMap nodeColor="#312e81" maskColor="rgba(10, 10, 10, 0.7)" className="border border-slate-800 rounded-lg bg-slate-900" />
                </ReactFlow>
              )}
            </div>
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
