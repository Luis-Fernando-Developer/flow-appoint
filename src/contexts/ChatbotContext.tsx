import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Container, Edge, Variable, ChatNode, NodeType, ChatbotFlow } from '@/types/chatbot';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ChatbotContextType {
  // State
  flow: ChatbotFlow | null;
  containers: Container[];
  edges: Edge[];
  variables: Variable[];
  selectedContainerId: string | null;
  selectedNodeId: string | null;
  isLoading: boolean;
  isSaving: boolean;
  
  // Actions
  setFlow: (flow: ChatbotFlow | null) => void;
  loadFlow: (flowId: string) => Promise<void>;
  saveFlow: () => Promise<void>;
  
  // Container actions
  addContainer: (position: { x: number; y: number }) => void;
  updateContainer: (containerId: string, updates: Partial<Container>) => void;
  deleteContainer: (containerId: string) => void;
  selectContainer: (containerId: string | null) => void;
  
  // Node actions
  addNode: (containerId: string, type: NodeType, position: { x: number; y: number }) => void;
  updateNode: (containerId: string, nodeId: string, updates: Partial<ChatNode>) => void;
  deleteNode: (containerId: string, nodeId: string) => void;
  selectNode: (nodeId: string | null) => void;
  
  // Edge actions
  addEdge: (edge: Omit<Edge, 'id'>) => void;
  updateEdge: (edgeId: string, updates: Partial<Edge>) => void;
  deleteEdge: (edgeId: string) => void;
  
  // Variable actions
  addVariable: (variable: Omit<Variable, 'id'>) => void;
  updateVariable: (variableId: string, updates: Partial<Variable>) => void;
  deleteVariable: (variableId: string) => void;
}

const ChatbotContext = createContext<ChatbotContextType | undefined>(undefined);

export function ChatbotProvider({ children, companyId }: { children: ReactNode; companyId: string }) {
  const [flow, setFlow] = useState<ChatbotFlow | null>(null);
  const [containers, setContainers] = useState<Container[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [variables, setVariables] = useState<Variable[]>([
    { id: 'sys_name', name: 'name', type: 'string', isSystem: true },
    { id: 'sys_email', name: 'email', type: 'string', isSystem: true },
    { id: 'sys_phone', name: 'phone', type: 'string', isSystem: true },
  ]);
  const [selectedContainerId, setSelectedContainerId] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const generateId = () => crypto.randomUUID();

  const loadFlow = useCallback(async (flowId: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('chatbot_flows')
        .select('*')
        .eq('id', flowId)
        .single();

      if (error) throw error;

      if (data) {
        const flowData: ChatbotFlow = {
          id: data.id,
          company_id: data.company_id,
          name: data.name,
          description: data.description || undefined,
          containers: (data.containers as unknown as Container[]) || [],
          edges: (data.edges as unknown as Edge[]) || [],
          variables: (data.variables as unknown as Variable[]) || [],
          is_active: data.is_active,
          created_at: data.created_at,
          updated_at: data.updated_at
        };
        
        setFlow(flowData);
        setContainers(flowData.containers);
        setEdges(flowData.edges);
        setVariables([
          { id: 'sys_name', name: 'name', type: 'string', isSystem: true },
          { id: 'sys_email', name: 'email', type: 'string', isSystem: true },
          { id: 'sys_phone', name: 'phone', type: 'string', isSystem: true },
          ...flowData.variables.filter(v => !v.isSystem)
        ]);
      }
    } catch (error) {
      console.error('Error loading flow:', error);
      toast.error('Erro ao carregar fluxo');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveFlow = useCallback(async () => {
    if (!flow) return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('chatbot_flows')
        .update({
          containers: JSON.parse(JSON.stringify(containers)),
          edges: JSON.parse(JSON.stringify(edges)),
          variables: JSON.parse(JSON.stringify(variables.filter(v => !v.isSystem))),
          updated_at: new Date().toISOString()
        })
        .eq('id', flow.id);

      if (error) throw error;
      toast.success('Fluxo salvo com sucesso!');
    } catch (error) {
      console.error('Error saving flow:', error);
      toast.error('Erro ao salvar fluxo');
    } finally {
      setIsSaving(false);
    }
  }, [flow, containers, edges, variables]);

  // Container actions
  const addContainer = useCallback((position: { x: number; y: number }) => {
    const newContainer: Container = {
      id: generateId(),
      name: `Bloco ${containers.length + 1}`,
      nodes: [],
      position
    };
    setContainers(prev => [...prev, newContainer]);
  }, [containers.length]);

  const updateContainer = useCallback((containerId: string, updates: Partial<Container>) => {
    setContainers(prev => prev.map(c => 
      c.id === containerId ? { ...c, ...updates } : c
    ));
  }, []);

  const deleteContainer = useCallback((containerId: string) => {
    setContainers(prev => prev.filter(c => c.id !== containerId));
    setEdges(prev => prev.filter(e => e.source !== containerId && e.target !== containerId));
    if (selectedContainerId === containerId) {
      setSelectedContainerId(null);
      setSelectedNodeId(null);
    }
  }, [selectedContainerId]);

  const selectContainer = useCallback((containerId: string | null) => {
    setSelectedContainerId(containerId);
    if (!containerId) setSelectedNodeId(null);
  }, []);

  // Node actions
  const addNode = useCallback((containerId: string, type: NodeType, position: { x: number; y: number }) => {
    const newNode: ChatNode = {
      id: generateId(),
      type,
      data: {},
      position
    };
    
    setContainers(prev => prev.map(c => {
      if (c.id === containerId) {
        return { ...c, nodes: [...c.nodes, newNode] };
      }
      return c;
    }));
  }, []);

  const updateNode = useCallback((containerId: string, nodeId: string, updates: Partial<ChatNode>) => {
    setContainers(prev => prev.map(c => {
      if (c.id === containerId) {
        return {
          ...c,
          nodes: c.nodes.map(n => n.id === nodeId ? { ...n, ...updates } : n)
        };
      }
      return c;
    }));
  }, []);

  const deleteNode = useCallback((containerId: string, nodeId: string) => {
    setContainers(prev => prev.map(c => {
      if (c.id === containerId) {
        return { ...c, nodes: c.nodes.filter(n => n.id !== nodeId) };
      }
      return c;
    }));
    if (selectedNodeId === nodeId) {
      setSelectedNodeId(null);
    }
  }, [selectedNodeId]);

  const selectNode = useCallback((nodeId: string | null) => {
    setSelectedNodeId(nodeId);
  }, []);

  // Edge actions
  const addEdge = useCallback((edge: Omit<Edge, 'id'>) => {
    const newEdge: Edge = { ...edge, id: generateId() };
    setEdges(prev => [...prev, newEdge]);
  }, []);

  const updateEdge = useCallback((edgeId: string, updates: Partial<Edge>) => {
    setEdges(prev => prev.map(e => e.id === edgeId ? { ...e, ...updates } : e));
  }, []);

  const deleteEdge = useCallback((edgeId: string) => {
    setEdges(prev => prev.filter(e => e.id !== edgeId));
  }, []);

  // Variable actions
  const addVariable = useCallback((variable: Omit<Variable, 'id'>) => {
    const newVariable: Variable = { ...variable, id: generateId() };
    setVariables(prev => [...prev, newVariable]);
  }, []);

  const updateVariable = useCallback((variableId: string, updates: Partial<Variable>) => {
    setVariables(prev => prev.map(v => v.id === variableId ? { ...v, ...updates } : v));
  }, []);

  const deleteVariable = useCallback((variableId: string) => {
    const variable = variables.find(v => v.id === variableId);
    if (variable?.isSystem) {
      toast.error('Não é possível deletar variáveis do sistema');
      return;
    }
    setVariables(prev => prev.filter(v => v.id !== variableId));
  }, [variables]);

  return (
    <ChatbotContext.Provider value={{
      flow,
      containers,
      edges,
      variables,
      selectedContainerId,
      selectedNodeId,
      isLoading,
      isSaving,
      setFlow,
      loadFlow,
      saveFlow,
      addContainer,
      updateContainer,
      deleteContainer,
      selectContainer,
      addNode,
      updateNode,
      deleteNode,
      selectNode,
      addEdge,
      updateEdge,
      deleteEdge,
      addVariable,
      updateVariable,
      deleteVariable
    }}>
      {children}
    </ChatbotContext.Provider>
  );
}

export function useChatbot() {
  const context = useContext(ChatbotContext);
  if (!context) {
    throw new Error('useChatbot must be used within a ChatbotProvider');
  }
  return context;
}
