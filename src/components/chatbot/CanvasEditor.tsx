import React, { useCallback, useState, useEffect, useRef } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  Connection,
  Edge as FlowEdge,
  Node as FlowNode,
  NodeTypes,
  NodeDragHandler,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Container, Node, NodeConfig, Edge } from "@/types/chatbot";
import { ContainerNode } from "./ContainerNode";
import { NodeConfigDialog } from "./NodeConfigDialog";
import { toast } from "sonner";

interface CanvasEditorProps {
  containers: Container[];
  onContainersChange: (containers: Container[]) => void;
  onTest: (container: Container) => void;
  onEdgesChange?: (edges: Edge[]) => void;
  edges?: Edge[];
}

const nodeTypes: NodeTypes = {
  container: ContainerNode,
};

export const CanvasEditor = ({ containers, onContainersChange, onTest, onEdgesChange: onEdgesChangeProp, edges: propEdges = [] }: CanvasEditorProps) => {
  const [selectedNode, setSelectedNode] = useState<{ containerId: string; node: Node } | null>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState<FlowNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const containersRef = useRef(containers);

  // Keep ref in sync
  useEffect(() => {
    containersRef.current = containers;
  }, [containers]);

  // Persist position when node drag ends
  const onNodeDragStop: NodeDragHandler = useCallback((event, node) => {
    const updatedContainers = containersRef.current.map(container => {
      if (container.id === node.id) {
        return { ...container, position: node.position };
      }
      return container;
    });
    onContainersChange(updatedContainers);
  }, [onContainersChange]);

  const findNodeInContainers = useCallback((nodeId: string) => {
    for (const container of containers) {
      const node = container.nodes.find(n => n.id === nodeId);
      if (node) {
        return { containerId: container.id, node };
      }
    }
    return null;
  }, [containers]);

  const handleNodeClick = useCallback((nodeId: string) => {
    const result = findNodeInContainers(nodeId);
    if (result) {
      setSelectedNode(result);
    }
  }, [findNodeInContainers]);

  const handleDuplicate = useCallback((containerId: string) => {
    const containerToDuplicate = containers.find(c => c.id === containerId);
    if (!containerToDuplicate) return;

    const newContainer: Container = {
      id: `container-${Date.now()}`,
      nodes: containerToDuplicate.nodes.map(node => ({
        ...node,
        id: `node-${Date.now()}-${Math.random()}`
      })),
      position: {
        x: containerToDuplicate.position.x + 320,
        y: containerToDuplicate.position.y
      }
    };

    onContainersChange([...containers, newContainer]);
    toast.success("Bloco duplicado!");
  }, [containers, onContainersChange]);

  const handleDelete = useCallback((containerId: string) => {
    const updatedContainers = containers.filter(c => c.id !== containerId);
    onContainersChange(updatedContainers);
    toast.success("Bloco excluído!");
  }, [containers, onContainersChange]);

  const handleNodeDrop = useCallback((nodeId: string, targetContainerId: string) => {
    const sourceData = findNodeInContainers(nodeId);
    if (!sourceData || sourceData.containerId === targetContainerId) return;

    const updatedContainers = containers.map(container => {
      if (container.id === sourceData.containerId) {
        return {
          ...container,
          nodes: container.nodes.filter(n => n.id !== nodeId)
        };
      }
      if (container.id === targetContainerId) {
        return {
          ...container,
          nodes: [...container.nodes, sourceData.node]
        };
      }
      return container;
    });

    onContainersChange(updatedContainers);
    toast.success("Node movido!");
  }, [containers, findNodeInContainers, onContainersChange]);

  const handleSaveConfig = useCallback((config: NodeConfig) => {
    if (!selectedNode) return;

    const updatedContainers = containers.map(container => {
      if (container.id === selectedNode.containerId) {
        return {
          ...container,
          nodes: container.nodes.map(node =>
            node.id === selectedNode.node.id
              ? { ...node, config }
              : node
          )
        };
      }
      return container;
    });

    onContainersChange(updatedContainers);
    toast.success("Configuração salva!");
  }, [selectedNode, containers, onContainersChange]);

  const handleNodesChangeWrapper = useCallback((changes: any) => {
    onNodesChange(changes);
  }, [onNodesChange]);

  const onConnect = useCallback(
    (params: Connection | FlowEdge) => {
      setEdges((eds) => {
        const newEdges = addEdge(params, eds);
        if (onEdgesChangeProp) {
          onEdgesChangeProp(newEdges.map(e => ({
            source: e.source,
            target: e.target,
            sourceHandle: e.sourceHandle || undefined
          })));
        }
        return newEdges;
      });
    },
    [setEdges, onEdgesChangeProp]
  );

  // Update ReactFlow nodes when containers change
  useEffect(() => {
    const flowNodes: FlowNode[] = containers.map((container) => ({
      id: container.id,
      type: 'container',
      position: container.position,
      data: {
        container,
        onNodeClick: handleNodeClick,
        onTest: () => onTest(container),
        onDuplicate: () => handleDuplicate(container.id),
        onDelete: () => handleDelete(container.id),
        onNodeDrop: handleNodeDrop,
      },
    }));
    setNodes(flowNodes);
  }, [containers, handleNodeClick, onTest, handleDuplicate, handleDelete, handleNodeDrop, setNodes]);

  // Update edges from props (including empty array)
  useEffect(() => {
    const flowEdges = propEdges.map((e, idx) => ({
      id: `edge-${idx}`,
      source: e.source,
      target: e.target,
      sourceHandle: e.sourceHandle,
    }));
    setEdges(flowEdges);
  }, [propEdges, setEdges]);

  return (
    <>
      <main className="flex flex-1 w-full h-full bg-gray-950">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={handleNodesChangeWrapper}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeDragStop={onNodeDragStop}
          nodeTypes={nodeTypes}
          proOptions={{ hideAttribution: true }}
          fitView
          className="flex flex-grow h-full"
        >
          <Background className="bg-cyan-950/80 flex-1 w-full" />
          <Controls position="bottom-left" className="z-10" />
          <MiniMap className="bg-card" />
        </ReactFlow>
      </main>

      <NodeConfigDialog
        node={selectedNode?.node || null}
        open={selectedNode !== null}
        onClose={() => setSelectedNode(null)}
        onSave={handleSaveConfig}
        containers={containers}
      />
    </>
  );
};
