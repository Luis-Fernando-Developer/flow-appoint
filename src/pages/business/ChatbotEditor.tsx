import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, ArrowLeft, Play, Save, Settings, Send, Eye } from 'lucide-react';
import { VariablesProvider } from '@/contexts/VariablesContext';
import { CanvasEditor } from '@/components/chatbot/CanvasEditor';
import { TestPanel } from '@/components/chatbot/TestPanel';
import { NodesSidebar } from '@/components/chatbot/NodesSidebar';
import { Container, NodeType, Edge } from '@/types/chatbot';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { User } from '@supabase/supabase-js';
import { PublishDialog } from '@/components/chatbot/PublishDialog';
import { BotSettingsDialog } from '@/components/chatbot/BotSettingsDialog';

interface FlowData {
  id: string;
  name: string;
  description: string | null;
  containers: Container[];
  edges: Edge[];
  is_published: boolean;
  public_id: string | null;
  settings: Record<string, any>;
}

interface CompanyData {
  id: string;
  name: string;
  slug: string;
}

function ChatbotEditorContent({ 
  companyData, 
  flowId,
}: { 
  companyData: CompanyData; 
  flowId: string;
}) {
  const navigate = useNavigate();
  const [flow, setFlow] = useState<FlowData | null>(null);
  const [containers, setContainers] = useState<Container[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [testContainer, setTestContainer] = useState<Container | null>(null);
  const [isTestOpen, setIsTestOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showPublishDialog, setShowPublishDialog] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const getCenterPositionRef = useRef<(() => { x: number; y: number }) | null>(null);

  useEffect(() => {
    loadFlow();
  }, [flowId]);

  const loadFlow = async () => {
    try {
      const { data, error } = await supabase
        .from('chatbot_flows')
        .select('*')
        .eq('id', flowId)
        .single();

      if (error) throw error;
      if (data) {
        const flowData = data as any;
        setFlow({
          id: flowData.id,
          name: flowData.name,
          description: flowData.description,
          containers: (flowData.containers as Container[]) || [],
          edges: (flowData.edges as Edge[]) || [],
          is_published: flowData.is_published ?? false,
          public_id: flowData.public_id ?? null,
          settings: (flowData.settings as Record<string, any>) || {},
        });
        setContainers((data.containers as unknown as Container[]) || []);
        setEdges((data.edges as unknown as Edge[]) || []);
      }
    } catch (error) {
      console.error('Error loading flow:', error);
      toast.error('Erro ao carregar fluxo');
      navigate(`/${companyData.slug}/chatbot`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!flowId) return;
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('chatbot_flows')
        .update({ 
          containers: containers as any, 
          edges: edges as any,
          updated_at: new Date().toISOString()
        })
        .eq('id', flowId);

      if (error) throw error;
      toast.success('Fluxo salvo!');
    } catch (error) {
      console.error('Error saving flow:', error);
      toast.error('Erro ao salvar fluxo');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddNode = (type: NodeType) => {
    const defaultConfig: Record<string, any> = {};
    
    if (type.startsWith('bubble-')) {
      defaultConfig.message = '';
    }
    if (type.startsWith('input-')) {
      defaultConfig.responseUserTextInput = '';
      defaultConfig.buttonLabel = 'Enviar';
    }

    const newNode = {
      id: `node-${Date.now()}`,
      type,
      config: defaultConfig
    };

    const centerPosition = getCenterPositionRef.current?.() || { x: 300, y: 200 };
    const offset = {
      x: (Math.random() - 0.5) * 50,
      y: (Math.random() - 0.5) * 50
    };

    const newContainer: Container = {
      id: `container-${Date.now()}`,
      nodes: [newNode],
      position: {
        x: centerPosition.x + offset.x,
        y: centerPosition.y + offset.y
      }
    };

    setContainers([...containers, newContainer]);
  };

  const handleAddContainer = () => {
    const centerPosition = getCenterPositionRef.current?.() || { x: 300, y: 200 };
    const offset = {
      x: (Math.random() - 0.5) * 50,
      y: (Math.random() - 0.5) * 50
    };

    const newContainer: Container = {
      id: `container-${Date.now()}`,
      nodes: [],
      position: {
        x: centerPosition.x + offset.x,
        y: centerPosition.y + offset.y
      }
    };
    setContainers([...containers, newContainer]);
  };

  const handleBackToList = () => {
    navigate(`/${companyData.slug}/chatbot`);
  };

  const handleTest = useCallback((c: Container | null) => {
    setTestContainer(c);
    setIsTestOpen(true);
  }, []);

  const handlePublishSuccess = (publicId: string, isPublished: boolean) => {
    setFlow(prev => prev ? { ...prev, is_published: isPublished, public_id: publicId } : prev);
  };

  const handleSettingsUpdate = (settings: Record<string, any>) => {
    setFlow(prev => prev ? { ...prev, settings } : prev);
  };

  const openPreview = () => {
    if (flow?.public_id) {
      window.open(`/${companyData.slug}/flow/${flow.public_id}`, '_blank');
    } else {
      toast.error('Publique o bot primeiro para visualizá-lo');
    }
  };

  if (isLoading || !flow) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <VariablesProvider>
      <div className="h-screen flex flex-col bg-background">
        {/* Header */}
        <div className="h-14 border-b border-border bg-card flex items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={handleBackToList}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <div className="w-px h-6 bg-border" />
            <div className="flex items-center gap-2">
              <h1 className="font-semibold">{flow.name}</h1>
              {flow.is_published && (
                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                  Publicado
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowSettingsDialog(true)}>
              <Settings className="h-4 w-4 mr-2" />
              Configurações
            </Button>
            <Button variant="outline" size="sm" onClick={handleAddContainer}>
              <Plus className="h-4 w-4 mr-2" />
              Bloco
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleTest(containers[0] || null)}>
              <Play className="h-4 w-4 mr-2" />
              Testar
            </Button>
            {flow.is_published && flow.public_id && (
              <Button variant="outline" size="sm" onClick={openPreview}>
                <Eye className="h-4 w-4 mr-2" />
                Visualizar
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={handleSave} disabled={isSaving}>
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Salvando...' : 'Salvar'}
            </Button>
            <Button size="sm" onClick={() => setShowPublishDialog(true)}>
              <Send className="h-4 w-4 mr-2" />
              Publicar
            </Button>
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 flex overflow-hidden relative">
          <NodesSidebar onAddNode={handleAddNode} />
          <div className="flex-1">
            <CanvasEditor 
              containers={containers} 
              onContainersChange={setContainers} 
              onTest={handleTest} 
              onEdgesChange={setEdges}
              edges={edges}
              onGetCenterPosition={(getter) => { getCenterPositionRef.current = getter; }}
            />
          </div>
          <TestPanel 
            isOpen={isTestOpen} 
            onClose={() => setIsTestOpen(false)}
            startContainer={testContainer} 
            allContainers={containers} 
            edges={edges} 
          />
        </div>
      </div>

      {/* Dialogs */}
      <PublishDialog
        open={showPublishDialog}
        onOpenChange={setShowPublishDialog}
        flowId={flowId}
        currentPublicId={flow.public_id}
        isPublished={flow.is_published}
        companySlug={companyData.slug}
        containers={containers}
        edges={edges}
        onPublishSuccess={handlePublishSuccess}
      />

      <BotSettingsDialog
        open={showSettingsDialog}
        onOpenChange={setShowSettingsDialog}
        flowId={flowId}
        flowName={flow.name}
        flowDescription={flow.description}
        settings={flow.settings}
        onUpdate={handleSettingsUpdate}
      />
    </VariablesProvider>
  );
}

export default function ChatbotEditor() {
  const { slug, botId } = useParams();
  const navigate = useNavigate();
  const [companyData, setCompanyData] = useState<CompanyData | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          navigate(`/${slug}/admin/login`);
          return;
        }
        setCurrentUser(user);

        const { data: company, error: companyError } = await supabase
          .from('companies')
          .select('id, name, slug')
          .eq('slug', slug)
          .single();

        if (companyError || !company) {
          toast.error('Empresa não encontrada');
          navigate('/');
          return;
        }
        setCompanyData(company);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setIsLoading(false);
      }
    }

    if (slug) {
      loadData();
    }
  }, [slug, navigate]);

  if (isLoading || !companyData || !botId) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <ChatbotEditorContent 
      companyData={companyData} 
      flowId={botId}
    />
  );
}
