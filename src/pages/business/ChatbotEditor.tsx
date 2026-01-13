import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, ArrowLeft, Play, Save, Settings, Send, Eye } from 'lucide-react';
import { VariablesProvider } from '@/contexts/VariablesContext';
import { CanvasEditor } from '@/components/chatbot/CanvasEditor';
import { TestPanel } from '@/components/chatbot/TestPanel';
import { NodesSidebar } from '@/components/chatbot/NodesSidebar';
import { Container, NodeType, Edge } from '@/types/chatbot';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { PublishDialog } from '@/components/chatbot/PublishDialog';
import { BotSettingsDialog } from '@/components/chatbot/BotSettingsDialog';
import { slugifyBotName } from '@/lib/slugify';

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
  botName,
}: { 
  companyData: CompanyData; 
  botName: string;
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
    if (companyData?.id && botName) loadFlow();
  }, [companyData?.id, botName]);

  const loadFlow = async () => {
    try {
      // Busca todos os fluxos da empresa
      const { data, error } = await supabase
        .from('chatbot_flows')
        .select('*')
        .eq('company_id', companyData.id);

      if (error) throw error;

      // Encontra o fluxo pelo nome slugificado
      const targetFlow = (data as any[])?.find(f => slugifyBotName(f.name) === botName);
      
      if (!targetFlow) {
        toast.error('Fluxo não encontrado');
        navigate(`/${companyData.slug}/admin/chatbot`);
        return;
      }

      setFlow({
        id: targetFlow.id,
        name: targetFlow.name,
        description: targetFlow.description,
        containers: (targetFlow.containers as Container[]) || [],
        edges: (targetFlow.edges as Edge[]) || [],
        is_published: targetFlow.is_published ?? false,
        public_id: targetFlow.public_id ?? null,
        settings: (targetFlow.settings as Record<string, any>) || {},
      });
      setContainers((targetFlow.containers as Container[]) || []);
      setEdges((targetFlow.edges as Edge[]) || []);
    } catch (error) {
      console.error('Error loading flow:', error);
      toast.error('Erro ao carregar fluxo');
      navigate(`/${companyData.slug}/admin/chatbot`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!flow?.id) return;
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('chatbot_flows')
        .update({ 
          containers: containers as any, 
          edges: edges as any,
          updated_at: new Date().toISOString()
        })
        .eq('id', flow.id);

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
    navigate(`/${companyData.slug}/admin/chatbot`);
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
        flowId={flow.id}
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
        flowId={flow.id}
        flowName={flow.name}
        flowDescription={flow.description}
        settings={flow.settings}
        onUpdate={handleSettingsUpdate}
      />
    </VariablesProvider>
  );
}

export default function ChatbotEditor() {
  const { slug, botName } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [companyData, setCompanyData] = useState<CompanyData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!user) return;

      try {
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

    if (slug && user) {
      loadData();
    }
  }, [slug, navigate, user]);

  if (isLoading || !companyData || !botName) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <ChatbotEditorContent 
      companyData={companyData} 
      botName={botName}
    />
  );
}
