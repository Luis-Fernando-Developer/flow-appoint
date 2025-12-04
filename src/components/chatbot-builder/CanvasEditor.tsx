import React, { useCallback, useRef, useState } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  Connection,
  Edge as ReactFlowEdge,
  Node as ReactFlowNode,
  ReactFlowProvider,
  useReactFlow,
  Panel,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Plus, Save, Play, Undo, Redo, ZoomIn, ZoomOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useChatbot } from '@/contexts/ChatbotContext';
import { Container, NodeConfig, Edge } from '@/types/chatbot';
import { ContainerNode } from './ContainerNode';
import { NodesSidebar } from './NodesSidebar';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const nodeTypes = {
  container: ContainerNode,
};

interface CanvasEditorProps {
  onTestChat: () => void;
}

function CanvasEditorInner({ onTestChat }: CanvasEditorProps) {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { 
    containers, 
    edges: chatbotEdges,
    addContainer, 
    updateContainer, 
    deleteContainer,
    addEdge: addChatbotEdge,
    deleteEdge,
    addNode,
    saveFlow,
    isSaving
  } = useChatbot();
  const { screenToFlowPosition } = useReactFlow();
  
  const [editingContainer, setEditingContainer] = useState<string | null>(null);
  const [containerName, setContainerName] = useState('');

  // Convert containers to ReactFlow nodes
  const flowNodes: ReactFlowNode[] = containers.map(container => ({
    id: container.id,
    type: 'container',
    position: container.position,
    data: {
      container,
      onDelete: deleteContainer,
      onEdit: (id: string) => {
        const c = containers.find(c => c.id === id);
        if (c) {
          setContainerName(c.name);
          setEditingContainer(id);
        }
      },
      onAddNode: (containerId: string) => {
        // Handle add node
      },
      isSelected: false
    },
  }));

  // Convert edges
  const flowEdges: ReactFlowEdge[] = chatbotEdges.map(edge => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    sourceHandle: edge.sourceHandle,
    targetHandle: edge.targetHandle,
    label: edge.label,
    animated: true,
    style: { stroke: 'hsl(var(--primary))' },
  }));

  const [nodes, setNodes, onNodesChange] = useNodesState(flowNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(flowEdges);

  // Sync nodes when containers change
  React.useEffect(() => {
    setNodes(flowNodes);
  }, [containers]);

  React.useEffect(() => {
    setEdges(flowEdges);
  }, [chatbotEdges]);

  const onConnect = useCallback((params: Connection) => {
    if (params.source && params.target) {
      addChatbotEdge({
        source: params.source,
        target: params.target,
        sourceHandle: params.sourceHandle || undefined,
        targetHandle: params.targetHandle || undefined,
      });
    }
  }, [addChatbotEdge]);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();

    const nodeConfigStr = event.dataTransfer.getData('application/reactflow');
    if (!nodeConfigStr) return;

    const nodeConfig: NodeConfig = JSON.parse(nodeConfigStr);
    const position = screenToFlowPosition({
      x: event.clientX,
      y: event.clientY,
    });

    // Check if dropped on existing container
    const targetContainer = containers.find(c => {
      const nodePos = c.position;
      return (
        position.x >= nodePos.x &&
        position.x <= nodePos.x + 280 &&
        position.y >= nodePos.y &&
        position.y <= nodePos.y + 200
      );
    });

    if (targetContainer) {
      addNode(targetContainer.id, nodeConfig.type, { x: 0, y: 0 });
      toast.success(`${nodeConfig.label} adicionado ao bloco`);
    } else {
      // Create new container with the node
      const newContainerId = crypto.randomUUID();
      addContainer(position);
      setTimeout(() => {
        addNode(newContainerId, nodeConfig.type, { x: 0, y: 0 });
      }, 50);
    }
  }, [screenToFlowPosition, containers, addContainer, addNode]);

  const onNodeDragStart = useCallback((e: React.DragEvent, nodeConfig: NodeConfig) => {
    e.dataTransfer.setData('application/reactflow', JSON.stringify(nodeConfig));
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const onNodeDragStop = useCallback((event: React.MouseEvent, node: ReactFlowNode) => {
    updateContainer(node.id, { position: node.position });
  }, [updateContainer]);

  const handleSaveContainerName = () => {
    if (editingContainer && containerName.trim()) {
      updateContainer(editingContainer, { name: containerName.trim() });
      setEditingContainer(null);
      setContainerName('');
    }
  };

  const handleAddStartBlock = () => {
    addContainer({ x: 100, y: 100 });
    toast.success('Bloco inicial criado');
  };

  return (
    <div className="flex h-full">
      <NodesSidebar onDragStart={onNodeDragStart} />
      
      <div className="flex-1 relative" ref={reactFlowWrapper}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onNodeDragStop={onNodeDragStop}
          nodeTypes={nodeTypes}
          fitView
          snapToGrid
          snapGrid={[15, 15]}
          className="bg-background"
          defaultEdgeOptions={{
            animated: true,
            style: { stroke: 'hsl(var(--primary))' }
          }}
        >
          <Background color="hsl(var(--muted-foreground))" gap={20} size={1} />
          <Controls className="!bg-card !border-border !shadow-lg" />
          <MiniMap 
            className="!bg-card !border-border"
            nodeColor="hsl(var(--primary))"
            maskColor="hsl(var(--background) / 0.8)"
          />
          
          {/* Top toolbar */}
          <Panel position="top-center" className="flex items-center gap-2 p-2 bg-card border border-border rounded-lg shadow-lg">
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddStartBlock}
            >
              <Plus className="h-4 w-4 mr-1" />
              Adicionar Bloco
            </Button>
            <div className="w-px h-6 bg-border" />
            <Button
              variant="outline"
              size="sm"
              onClick={saveFlow}
              disabled={isSaving}
            >
              <Save className="h-4 w-4 mr-1" />
              {isSaving ? 'Salvando...' : 'Salvar'}
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={onTestChat}
            >
              <Play className="h-4 w-4 mr-1" />
              Testar
            </Button>
          </Panel>
        </ReactFlow>
      </div>

      {/* Edit container name dialog */}
      <Dialog open={!!editingContainer} onOpenChange={() => setEditingContainer(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Renomear Bloco</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="containerName">Nome do bloco</Label>
            <Input
              id="containerName"
              value={containerName}
              onChange={(e) => setContainerName(e.target.value)}
              placeholder="Nome do bloco"
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingContainer(null)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveContainerName}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function CanvasEditor(props: CanvasEditorProps) {
  return (
    <ReactFlowProvider>
      <CanvasEditorInner {...props} />
    </ReactFlowProvider>
  );
}
