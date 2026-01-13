import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Bot, Trash2, MoreVertical, Power, PowerOff, Copy, Download, Upload, Settings2, Globe } from 'lucide-react';
import { BusinessLayout } from '@/components/business/BusinessLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabaseClient } from '@/lib/supabaseClient';
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { User } from '@supabase/supabase-js';
import { ImportExportDialog } from '@/components/chatbot/ImportExportDialog';
import { slugifyBotName } from '@/lib/slugify';

interface FlowListItem {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  is_published: boolean;
  public_id: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

interface CompanyData {
  id: string;
  name: string;
  slug: string;
}

function ChatbotListContent({ 
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
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [newFlowName, setNewFlowName] = useState('');
  const [newFlowDescription, setNewFlowDescription] = useState('');

  useEffect(() => {
    loadFlows();
  }, [companyData.id]);

  const loadFlows = async () => {
    try {
      const { data, error } = await supabaseClient
        .from('chatbot_flows')
        .select('id, name, description, is_active, is_published, public_id, published_at, created_at, updated_at')
        .eq('company_id', companyData.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFlows((data || []).map(f => ({
        ...f,
        is_published: f.is_published ?? false,
        public_id: f.public_id ?? null,
        published_at: f.published_at ?? null,
      })));
    } catch (error) {
      console.error('Error loading flows:', error);
      toast.error('Erro ao carregar fluxos');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateFlow = async () => {
    if (!newFlowName.trim()) return;

    try {
      const { data, error } = await supabaseClient
        .from('chatbot_flows')
        .insert([{
          company_id: companyData.id,
          name: newFlowName.trim(),
          description: newFlowDescription.trim() || null,
          containers: [],
          edges: [],
        }])
        .select()
        .single();

      if (error) throw error;

      toast.success('Fluxo criado com sucesso!');
      setShowCreateDialog(false);
      const botSlug = slugifyBotName(data.name);
      setNewFlowName('');
      setNewFlowDescription('');
      navigate(`/${companyData.slug}/admin/chatbot/${botSlug}/edit`);
    } catch (error) {
      console.error('Error creating flow:', error);
      toast.error('Erro ao criar fluxo');
    }
  };

  const handleDeleteFlow = async (flowId: string) => {
    try {
      const { error } = await supabaseClient
        .from('chatbot_flows')
        .delete()
        .eq('id', flowId);

      if (error) throw error;
      setFlows(prev => prev.filter(f => f.id !== flowId));
      toast.success('Fluxo excluído!');
    } catch (error) {
      console.error('Error deleting flow:', error);
      toast.error('Erro ao excluir fluxo');
    }
  };

  const handleToggleActive = async (flowId: string, currentState: boolean) => {
    try {
      if (!currentState) {
        await supabaseClient
          .from('chatbot_flows')
          .update({ is_active: false })
          .eq('company_id', companyData.id);
      }

      const { error } = await supabaseClient
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

  const handleDuplicate = async (flowId: string) => {
    try {
      const { data: flow, error: fetchError } = await supabaseClient
        .from('chatbot_flows')
        .select('*')
        .eq('id', flowId)
        .single();

      if (fetchError || !flow) throw fetchError;

      const { data: newFlow, error: insertError } = await supabaseClient
        .from('chatbot_flows')
        .insert([{
          company_id: companyData.id,
          name: `${flow.name} (cópia)`,
          description: flow.description,
          containers: flow.containers,
          edges: flow.edges,
        }])
        .select()
        .single();

      if (insertError) throw insertError;

      setFlows(prev => [{ 
        ...newFlow, 
        is_published: false, 
        public_id: null, 
        published_at: null 
      } as FlowListItem, ...prev]);
      toast.success('Fluxo duplicado!');
    } catch (error) {
      console.error('Error duplicating flow:', error);
      toast.error('Erro ao duplicar fluxo');
    }
  };

  const handleExport = async (flowId: string) => {
    try {
      const { data: flow, error } = await supabaseClient
        .from('chatbot_flows')
        .select('name, description, containers, edges')
        .eq('id', flowId)
        .single();

      if (error || !flow) throw error;

      const exportData = {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        flow: {
          name: flow.name,
          description: flow.description,
          containers: flow.containers,
          edges: flow.edges,
          settings: (flow as any).settings || {},
        }
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${flow.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;
      a.click();
      URL.revokeObjectURL(url);

      toast.success('Fluxo exportado!');
    } catch (error) {
      console.error('Error exporting flow:', error);
      toast.error('Erro ao exportar fluxo');
    }
  };

  const handleImportSuccess = () => {
    loadFlows();
    setShowImportDialog(false);
  };

  const getPublicUrl = (publicId: string) => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/${companyData.slug}/flow/${publicId}`;
  };

  const copyPublicUrl = (publicId: string) => {
    navigator.clipboard.writeText(getPublicUrl(publicId));
    toast.success('URL copiada!');
  };

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
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowImportDialog(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Importar
            </Button>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Fluxo
            </Button>
          </div>
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
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowImportDialog(true)}>
                  <Upload className="h-4 w-4 mr-2" />
                  Importar
                </Button>
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeiro Fluxo
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {flows.map((flowItem) => (
              <Card 
                key={flowItem.id}
                className="cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => navigate(`/${companyData.slug}/admin/chatbot/${slugifyBotName(flowItem.name)}/edit`)}
              >
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                  <div className="flex-1">
                    <CardTitle className="text-base flex items-center gap-2 flex-wrap">
                      {flowItem.name}
                      {flowItem.is_active && (
                        <Badge variant="default" className="text-xs">Ativo</Badge>
                      )}
                      {flowItem.is_published && (
                        <Badge variant="secondary" className="text-xs">
                          <Globe className="h-3 w-3 mr-1" />
                          Publicado
                        </Badge>
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
                      {flowItem.is_published && flowItem.public_id && (
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            copyPublicUrl(flowItem.public_id!);
                          }}
                        >
                          <Globe className="h-4 w-4 mr-2" />
                          Copiar URL Pública
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDuplicate(flowItem.id);
                        }}
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Duplicar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          handleExport(flowItem.id);
                        }}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Exportar
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
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
                  <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                    <span>Atualizado em {new Date(flowItem.updated_at).toLocaleDateString('pt-BR')}</span>
                    {flowItem.is_published && flowItem.published_at && (
                      <span>Publicado em {new Date(flowItem.published_at).toLocaleDateString('pt-BR')}</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Create Dialog */}
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

        {/* Import Dialog */}
        <ImportExportDialog
          mode="import"
          open={showImportDialog}
          onOpenChange={setShowImportDialog}
          companyId={companyData.id}
          onSuccess={handleImportSuccess}
        />
      </div>
    </BusinessLayout>
  );
}

export default function ChatbotList() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [companyData, setCompanyData] = useState<CompanyData | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string>('employee');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const { data: { user } } = await supabaseClient.auth.getUser();
        if (!user) {
          navigate(`/${slug}/admin/login`);
          return;
        }
        setCurrentUser(user);

        const { data: company, error: companyError } = await supabaseClient
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

        const { data: employee } = await supabaseClient
          .from('employees')
          .select('role')
          .eq('company_id', company.id)
          .eq('user_id', user.id)
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
    <ChatbotListContent 
      companyData={companyData} 
      userRole={userRole} 
      currentUser={currentUser}
    />
  );
}
