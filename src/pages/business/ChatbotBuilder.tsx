import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Bot, Settings, Trash2, MoreVertical, Power, PowerOff } from 'lucide-react';
import { BusinessLayout } from '@/components/business/BusinessLayout';
import { ChatbotProvider, useChatbot } from '@/contexts/ChatbotContext';
import { CanvasEditor } from '@/components/chatbot-builder/CanvasEditor';
import { TestPanel } from '@/components/chatbot-builder/TestPanel';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { User } from '@supabase/supabase-js';

interface FlowListItem {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface CompanyData {
  id: string;
  name: string;
  slug: string;
}

function ChatbotBuilderContent({ 
  companyData, 
  userRole, 
  currentUser 
}: { 
  companyData: CompanyData; 
  userRole: string; 
  currentUser: User | null;
}) {
  const navigate = useNavigate();
  const [flows, setFlows] = useState<FlowListItem[]>([]);
  const [selectedFlowId, setSelectedFlowId] = useState<string | null>(null);
  const [showTestPanel, setShowTestPanel] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newFlowName, setNewFlowName] = useState('');
  const [newFlowDescription, setNewFlowDescription] = useState('');

  const { loadFlow, flow, setFlow } = useChatbot();

  // Load flows
  useEffect(() => {
    async function loadFlows() {
      try {
        const { data: flowsData, error: flowsError } = await supabase
          .from('chatbot_flows')
          .select('id, name, description, is_active, created_at, updated_at')
          .eq('company_id', companyData.id)
          .order('created_at', { ascending: false });

        if (flowsError) throw flowsError;
        setFlows(flowsData || []);
      } catch (error) {
        console.error('Error loading flows:', error);
        toast.error('Erro ao carregar fluxos');
      } finally {
        setIsLoading(false);
      }
    }

    loadFlows();
  }, [companyData.id]);

  const handleCreateFlow = async () => {
    if (!newFlowName.trim()) return;

    try {
      const { data, error } = await supabase
        .from('chatbot_flows')
        .insert([{
          company_id: companyData.id,
          name: newFlowName.trim(),
          description: newFlowDescription.trim() || null,
        }])
        .select()
        .single();

      if (error) throw error;

      setFlows(prev => [data, ...prev]);
      setShowCreateDialog(false);
      setNewFlowName('');
      setNewFlowDescription('');
      toast.success('Fluxo criado com sucesso!');

      // Open the new flow
      setSelectedFlowId(data.id);
      loadFlow(data.id);
    } catch (error) {
      console.error('Error creating flow:', error);
      toast.error('Erro ao criar fluxo');
    }
  };

  const handleDeleteFlow = async (flowId: string) => {
    try {
      const { error } = await supabase
        .from('chatbot_flows')
        .delete()
        .eq('id', flowId);

      if (error) throw error;

      setFlows(prev => prev.filter(f => f.id !== flowId));
      if (selectedFlowId === flowId) {
        setSelectedFlowId(null);
        setFlow(null);
      }
      toast.success('Fluxo excluído!');
    } catch (error) {
      console.error('Error deleting flow:', error);
      toast.error('Erro ao excluir fluxo');
    }
  };

  const handleToggleActive = async (flowId: string, currentState: boolean) => {
    try {
      // If activating, deactivate others first
      if (!currentState) {
        await supabase
          .from('chatbot_flows')
          .update({ is_active: false })
          .eq('company_id', companyData.id);
      }

      const { error } = await supabase
        .from('chatbot_flows')
        .update({ is_active: !currentState })
        .eq('id', flowId);

      if (error) throw error;

      setFlows(prev => prev.map(f => ({
        ...f,
        is_active: f.id === flowId ? !currentState : (currentState ? f.is_active : false)
      })));

      toast.success(currentState ? 'Fluxo desativado' : 'Fluxo ativado');
    } catch (error) {
      console.error('Error toggling flow:', error);
      toast.error('Erro ao alterar status');
    }
  };

  const handleSelectFlow = (flowId: string) => {
    setSelectedFlowId(flowId);
    loadFlow(flowId);
  };

  const handleBackToList = () => {
    setSelectedFlowId(null);
    setFlow(null);
    setShowTestPanel(false);
  };

  // Show editor if flow is selected
  if (selectedFlowId && flow) {
    return (
      <div className="h-screen flex flex-col bg-background">
        {/* Header */}
        <div className="h-14 border-b border-border bg-card flex items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={handleBackToList}>
              ← Voltar
            </Button>
            <div className="w-px h-6 bg-border" />
            <div>
              <h1 className="font-semibold">{flow.name}</h1>
              {flow.description && (
                <p className="text-xs text-muted-foreground">{flow.description}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={flow.is_active ? 'default' : 'secondary'}>
              {flow.is_active ? 'Ativo' : 'Inativo'}
            </Badge>
          </div>
        </div>

        {/* Editor */}
        <div className="flex-1 flex overflow-hidden">
          <CanvasEditor onTestChat={() => setShowTestPanel(true)} />
          {showTestPanel && <TestPanel onClose={() => setShowTestPanel(false)} />}
        </div>
      </div>
    );
  }

  // Show flow list
  return (
    <BusinessLayout
      companySlug={companyData.slug}
      companyName={companyData.name}
      companyId={companyData.id}
      userRole={userRole}
      currentUser={currentUser}
    >
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Bot className="h-6 w-6" />
              Construtor de Chatbot
            </h1>
            <p className="text-muted-foreground mt-1">
              Crie fluxos de conversa automatizados para atender seus clientes
            </p>
          </div>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Fluxo
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : flows.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Bot className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhum fluxo criado</h3>
              <p className="text-muted-foreground text-center mb-4">
                Crie seu primeiro fluxo de chatbot para automatizar o atendimento
              </p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeiro Fluxo
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {flows.map((flowItem) => (
              <Card 
                key={flowItem.id}
                className="cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => handleSelectFlow(flowItem.id)}
              >
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                  <div className="flex-1">
                    <CardTitle className="text-base flex items-center gap-2">
                      {flowItem.name}
                      {flowItem.is_active && (
                        <Badge variant="default" className="text-xs">Ativo</Badge>
                      )}
                    </CardTitle>
                    {flowItem.description && (
                      <CardDescription className="mt-1 line-clamp-2">
                        {flowItem.description}
                      </CardDescription>
                    )}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleActive(flowItem.id, flowItem.is_active);
                        }}
                      >
                        {flowItem.is_active ? (
                          <>
                            <PowerOff className="h-4 w-4 mr-2" />
                            Desativar
                          </>
                        ) : (
                          <>
                            <Power className="h-4 w-4 mr-2" />
                            Ativar
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteFlow(flowItem.id);
                        }}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    Atualizado em {new Date(flowItem.updated_at).toLocaleDateString('pt-BR')}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Create flow dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Novo Fluxo</DialogTitle>
              <DialogDescription>
                Dê um nome ao seu fluxo de chatbot
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="flowName">Nome do Fluxo</Label>
                <Input
                  id="flowName"
                  value={newFlowName}
                  onChange={(e) => setNewFlowName(e.target.value)}
                  placeholder="Ex: Atendimento Inicial"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="flowDescription">Descrição (opcional)</Label>
                <Textarea
                  id="flowDescription"
                  value={newFlowDescription}
                  onChange={(e) => setNewFlowDescription(e.target.value)}
                  placeholder="Descreva o objetivo deste fluxo..."
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateFlow} disabled={!newFlowName.trim()}>
                Criar Fluxo
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </BusinessLayout>
  );
}

export default function ChatbotBuilder() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [companyData, setCompanyData] = useState<CompanyData | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string>('employee');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          navigate(`/${slug}/admin/login`);
          return;
        }
        setCurrentUser(user);

        // Get company
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

        // Get user role
        const { data: employee } = await supabase
          .from('employees')
          .select('role')
          .eq('company_id', company.id)
          .eq('user_id', user.id)
          .eq('is_active', true)
          .single();

        if (employee) {
          setUserRole(employee.role);
        }
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

  if (isLoading || !companyData) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <ChatbotProvider companyId={companyData.id}>
      <ChatbotBuilderContent 
        companyData={companyData} 
        userRole={userRole} 
        currentUser={currentUser}
      />
    </ChatbotProvider>
  );
}
