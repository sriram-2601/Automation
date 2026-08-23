import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import ProtectedRoute from '../../components/ProtectedRoute/index.js';
import AppShell from '../../components/AppShell/index.js';
import NodePalette from '../../components/NodePalette/index.js';
import WorkflowCanvas from '../../components/WorkflowCanvas/index.js';
import NodeConfigPanel from '../../components/NodeConfigPanel/index.js';
import { useWorkflowStore } from '../../store/workflowStore.js';
import { PlayCircle, AlertCircle, CheckCircle, ChevronLeft } from 'lucide-react';
import Link from 'next/link';

export default function WorkflowEditor() {
  const router = useRouter();
  const { id } = router.query;
  const { currentWorkflow, isLoading, error, fetchWorkflowById, updateWorkflow, duplicateWorkflow, executeWorkflow, clearError } = useWorkflowStore();
  const [selectedNode, setSelectedNode] = useState(null);
  
  // Alert messaging
  const [alert, setAlert] = useState(null);

  useEffect(() => {
    if (id) {
      fetchWorkflowById(id);
    }
  }, [id, fetchWorkflowById]);

  // Dismiss alerts automatically
  useEffect(() => {
    if (alert) {
      const timer = setTimeout(() => setAlert(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [alert]);

  const handleSave = async (nodes, edges) => {
    if (!id) return;
    
    // Auto-compute triggerConfig from trigger nodes on canvas
    const triggerNode = nodes.find(n => n.type.toLowerCase().includes('trigger'));
    const patchData = { nodes, edges };
    
    if (triggerNode) {
      let type = 'manual';
      if (triggerNode.type === 'scheduleTrigger') type = 'schedule';
      if (triggerNode.type === 'webhookTrigger') type = 'webhook';
      
      patchData.triggerConfig = {
        type,
        cron: triggerNode.data?.config?.cron || '*/5 * * * *',
        webhookUrl: triggerNode.data?.config?.webhookUrl || '',
      };
    }

    const updated = await updateWorkflow(id, patchData);
    if (updated) {
      setAlert({ type: 'success', message: 'Workflow graph compiled & saved successfully.' });
    }
  };

  const handleDuplicate = async () => {
    if (!id) return;
    const dup = await duplicateWorkflow(id);
    if (dup) {
      router.push(`/workflows/${dup._id || dup.id}`);
    }
  };

  const handleExecute = async () => {
    if (!id) return;
    const res = await executeWorkflow(id);
    if (res) {
      setAlert({ type: 'success', message: `Execution triggered successfully. Redirecting to trace...` });
      setTimeout(() => {
        router.push(`/executions/${res.executionId}`);
      }, 1000);
    }
  };

  const handleSelectNode = (node) => {
    setSelectedNode(node);
  };

  const handleUpdateNode = (nodeId, updatedData) => {
    if (!currentWorkflow) return;
    
    // Update nodes array in current workflow
    const updatedNodes = currentWorkflow.nodes.map((n) => {
      if (n.id === nodeId) {
        return { ...n, data: updatedData };
      }
      return n;
    });

    // Update locally so canvas reflects label change
    useWorkflowStore.setState({
      currentWorkflow: {
        ...currentWorkflow,
        nodes: updatedNodes
      }
    });

    // Deselect/close config
    setSelectedNode(null);
    setAlert({ type: 'info', message: 'Applied configs locally. Click "Save Graph" to persist.' });
  };

  return (
    <ProtectedRoute>
      <AppShell>
        <div className="flex flex-col h-[calc(100vh-120px)] border border-slate-805/65 rounded-2xl overflow-hidden bg-slate-950 relative">
          
          {/* Status Alert Overlay */}
          {alert && (
            <div className={`absolute top-16 right-6 p-4 rounded-xl shadow-lg border backdrop-blur-md flex items-center space-x-2.5 z-50 animate-in fade-in slide-in-from-top-4 duration-300 ${
              alert.type === 'success' 
                ? 'bg-emerald-950/90 text-emerald-400 border-emerald-500/20' 
                : alert.type === 'info' 
                  ? 'bg-violet-955/90 text-violet-400 border-violet-500/20'
                  : 'bg-red-950/90 text-red-400 border-red-500/20'
            }`}>
              {alert.type === 'success' ? <CheckCircle className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
              <span className="text-xs font-semibold">{alert.message}</span>
            </div>
          )}

          {/* Canvas editor frame */}
          <div className="flex-1 flex overflow-hidden">
            {/* Left Hand node palette */}
            <NodePalette />

            {/* Central visual React Flow canvas */}
            {isLoading && !currentWorkflow ? (
              <div className="flex-1 flex items-center justify-center bg-slate-950 text-slate-400">
                <div className="flex flex-col items-center space-y-3">
                  <div className="w-9 h-9 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-sm font-semibold">Compiling visual schema...</p>
                </div>
              </div>
            ) : (
              <WorkflowCanvas
                initialNodes={currentWorkflow?.nodes || []}
                initialEdges={currentWorkflow?.edges || []}
                workflowName={currentWorkflow?.name}
                workflowVersion={currentWorkflow?.version}
                onSave={handleSave}
                onDuplicate={handleDuplicate}
                onExecute={handleExecute}
                onSelectNode={handleSelectNode}
              />
            )}

            {/* Right Hand node configurations panel */}
            {selectedNode && (
              <NodeConfigPanel
                node={selectedNode}
                onClose={() => setSelectedNode(null)}
                onUpdate={handleUpdateNode}
              />
            )}
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
