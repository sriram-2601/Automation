import { useState, useRef, useCallback, useEffect } from 'react';
import { 
  ReactFlow, 
  MiniMap, 
  Controls, 
  Background, 
  useNodesState, 
  useEdgesState, 
  addEdge, 
  MarkerType,
  Handle,
  Position
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Play, Clock, Webhook, Mail, MessageSquare, Send, FileSpreadsheet, Brain, HelpCircle, Save, Copy, PlayCircle } from 'lucide-react';

// Map icons to node types
const ICON_MAP = {
  manualTrigger: Play,
  scheduleTrigger: Clock,
  webhookTrigger: Webhook,
  gmailSendEmail: Mail,
  slackPostMessage: MessageSquare,
  discordPostMessage: Send,
  sheetsAppendRow: FileSpreadsheet,
  aiPrompt: Brain,
};

// Premium Custom Node Renderer
const CustomWorkflowNode = ({ data, type, selected }) => {
  const Icon = ICON_MAP[type] || HelpCircle;
  const isTrigger = type.toLowerCase().includes('trigger');

  return (
    <div className={`p-4 rounded-xl border bg-slate-900 shadow-xl min-w-[200px] transition-all select-none ${
      selected 
        ? 'border-violet-500 shadow-violet-500/10 ring-2 ring-violet-500/20' 
        : 'border-slate-800 hover:border-slate-700'
    }`}>
      {/* Handles */}
      {!isTrigger && (
        <Handle
          type="target"
          position={Position.Left}
          className="w-3.5 h-3.5 bg-slate-800 border-2 border-slate-700 hover:bg-violet-500 transition-colors"
          style={{ left: '-7px' }}
        />
      )}
      <Handle
        type="source"
        position={Position.Right}
        className="w-3.5 h-3.5 bg-slate-800 border-2 border-slate-700 hover:bg-violet-500 transition-colors"
        style={{ right: '-7px' }}
      />

      <div className="flex items-center space-x-3">
        <div className={`p-2 rounded-lg ${
          isTrigger ? 'bg-emerald-500/10 text-emerald-400' : 'bg-violet-500/10 text-violet-400'
        } border border-current/10 shrink-0`}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="overflow-hidden">
          <h4 className="text-xs font-bold text-slate-205 truncate">
            {data.label || 'Node'}
          </h4>
          <span className="text-[9px] uppercase tracking-wider text-slate-500 font-semibold block mt-0.5">
            {type.replace(/([A-Z])/g, ' $1')}
          </span>
        </div>
      </div>
    </div>
  );
};

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

export default function WorkflowCanvas({ 
  initialNodes = [], 
  initialEdges = [], 
  onSave, 
  onDuplicate, 
  onExecute, 
  workflowName, 
  workflowVersion,
  onSelectNode
}) {
  const reactFlowWrapper = useRef(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);

  // Sync with initial loaded nodes
  useEffect(() => {
    setNodes(initialNodes);
  }, [initialNodes, setNodes]);

  useEffect(() => {
    setEdges(initialEdges);
  }, [initialEdges, setEdges]);

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge({
      ...params,
      animated: true,
      style: { stroke: '#8b5cf6', strokeWidth: 2 },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: '#8b5cf6',
      },
    }, eds)),
    [setEdges]
  );

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();

      if (!reactFlowInstance) return;

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const rawData = event.dataTransfer.getData('application/reactflow');
      
      if (!rawData) return;
      const parsedData = JSON.parse(rawData);

      // Get drop position
      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      // Create new unique node
      const newNode = {
        id: `${parsedData.type}_${Date.now()}`,
        type: parsedData.type,
        position,
        data: { 
          label: parsedData.label,
          config: {} 
        },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, setNodes]
  );

  const handleNodeClick = useCallback((event, node) => {
    onSelectNode(node);
  }, [onSelectNode]);

  const handleSave = () => {
    onSave(nodes, edges);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 relative">
      {/* Editor Toolbar Header */}
      <div className="h-14 border-b border-slate-805/60 px-5 flex items-center justify-between bg-slate-900/20 backdrop-blur-md z-10 shrink-0 select-none">
        <div className="flex items-center space-x-3">
          <h2 className="font-extrabold text-sm text-slate-105">{workflowName || 'Workflow Canvas'}</h2>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-600/10 text-violet-400 border border-violet-500/10">
            v{workflowVersion || 1}
          </span>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleSave}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-800 hover:border-slate-700 bg-slate-900/40 text-xs font-semibold text-slate-300 hover:text-white cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Graph</span>
          </button>
          
          {onDuplicate && (
            <button
              onClick={onDuplicate}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-800 hover:border-slate-700 bg-slate-900/40 text-xs font-semibold text-slate-300 hover:text-white cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Duplicate</span>
            </button>
          )}

          {onExecute && (
            <button
              onClick={onExecute}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-violet-650 hover:bg-violet-600 text-xs font-semibold text-white cursor-pointer"
            >
              <PlayCircle className="w-3.5 h-3.5" />
              <span>Execute</span>
            </button>
          )}
        </div>
      </div>

      {/* React Flow Canvas Wrapper */}
      <div className="flex-1" ref={reactFlowWrapper}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onInit={setReactFlowInstance}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onNodeClick={handleNodeClick}
          nodeTypes={nodeTypes}
          fitView
          className="bg-slate-950"
        >
          <Controls className="bg-slate-900 border border-slate-800 text-slate-300 fill-slate-300 [&>button]:border-slate-800" />
          <MiniMap 
            nodeColor="#312e81" 
            maskColor="rgba(10, 10, 10, 0.7)" 
            className="border border-slate-800 rounded-lg bg-slate-900"
          />
          <Background color="#1e293b" gap={16} size={1} />
        </ReactFlow>
      </div>
    </div>
  );
}
export { CustomWorkflowNode };
