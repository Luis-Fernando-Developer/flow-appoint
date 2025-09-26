import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookingLogo } from "@/components/BookingLogo";
import { EditCompanyDialog } from "@/components/admin/EditCompanyDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  Users, 
  Building2, 
  TrendingUp, 
  DollarSign, 
  Calendar,
  MoreHorizontal,
  Plus,
  Edit,
  Trash2,
  Pause,
  Play,
  Ban
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Company {
  id: string;
  name: string;
  owner_name: string;
  owner_email: string;
  owner_cpf: string;
  status: string;
  plan: string;
  slug: string;
  created_at: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  cnpj?: string;
}

const getStatusBadge = (status: string) => {
  const variants = {
    active: { variant: "default" as const, label: "Ativa", color: "bg-green-500" },
    paused: { variant: "secondary" as const, label: "Pausada", color: "bg-yellow-500" },
    blocked: { variant: "destructive" as const, label: "Bloqueada", color: "bg-red-500" }
  };
  
  const config = variants[status as keyof typeof variants];
  return (
    <Badge variant={config.variant} className="gap-1">
      <div className={`w-2 h-2 rounded-full ${config.color}`}></div>
      {config.label}
    </Badge>
  );
};

export default function SuperAdminDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState<Company | null>(null);
  const [stats, setStats] = useState({
    totalCompanies: 0,
    activeCompanies: 0,
    totalRevenue: 0,
    totalBookings: 0
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Buscar empresas
      const { data: companiesData } = await supabase
        .from('companies')
        .select('*')
        .order('created_at', { ascending: false });

      if (companiesData) {
        setCompanies(companiesData);

        // Calcular estatísticas básicas
        const totalCompanies = companiesData.length;
        const activeCompanies = companiesData.filter(c => c.status === 'active').length;

        setStats({
          totalCompanies,
          activeCompanies,
          totalRevenue: 0, // Será calculado quando implementarmos o módulo financeiro
          totalBookings: 0 // Será calculado quando implementarmos o módulo de agendamentos
        });
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados do dashboard.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateCompanyStatus = async (companyId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('companies')
        .update({ status: newStatus })
        .eq('id', companyId);

      if (error) throw error;

      toast({
        title: "Status atualizado",
        description: "Status da empresa atualizado com sucesso.",
      });

      // Atualizar lista
      await fetchData();
    } catch (error) {
      console.error('Error updating company status:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar status da empresa.",
        variant: "destructive",
      });
    }
  };

  const handleEditCompany = (company: Company) => {
    setEditingCompany(company);
    setEditDialogOpen(true);
  };

  const handleDeleteCompany = (company: Company) => {
    setCompanyToDelete(company);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteCompany = async () => {
    if (!companyToDelete) return;

    try {
      const { error } = await supabase
        .from('companies')
        .delete()
        .eq('id', companyToDelete.id);

      if (error) throw error;

      toast({
        title: "Empresa excluída",
        description: "A empresa foi excluída com sucesso.",
      });

      await fetchData();
      setDeleteDialogOpen(false);
      setCompanyToDelete(null);
    } catch (error) {
      console.error('Error deleting company:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir empresa.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Header */}
      <header className="border-b border-primary/20 bg-card/30 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <BookingLogo />
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">Super Admin</span>
              <Button variant="outline" size="sm">
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gradient mb-2">Dashboard Super Admin</h1>
          <p className="text-muted-foreground">Gerencie todas as empresas e monitore o sistema</p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="card-glow bg-card/50 backdrop-blur-sm border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Empresas</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gradient">{stats.totalCompanies}</div>
              <p className="text-xs text-muted-foreground">
                {stats.activeCompanies} ativas
              </p>
            </CardContent>
          </Card>

          <Card className="card-glow bg-card/50 backdrop-blur-sm border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Receita Mensal</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gradient">R$ {stats.totalRevenue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                +12% vs mês anterior
              </p>
            </CardContent>
          </Card>

          <Card className="card-glow bg-card/50 backdrop-blur-sm border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Agendamentos</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gradient">{stats.totalBookings}</div>
              <p className="text-xs text-muted-foreground">
                Este mês
              </p>
            </CardContent>
          </Card>

          <Card className="card-glow bg-card/50 backdrop-blur-sm border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taxa de Crescimento</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gradient">+24%</div>
              <p className="text-xs text-muted-foreground">
                Novos clientes
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Companies Table */}
        <Card className="card-glow bg-card/50 backdrop-blur-sm border-primary/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Empresas Cadastradas</CardTitle>
                <CardDescription>
                  Gerencie todas as empresas do sistema
                </CardDescription>
              </div>
              <Button variant="neon" onClick={() => navigate("/super-admin/add-company")}>
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Empresa
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {companies.map((company) => (
                <div key={company.id} className="flex items-center justify-between p-4 border border-primary/20 rounded-lg bg-background/30">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{company.name}</h3>
                      <p className="text-sm text-muted-foreground">{company.owner_name} • {company.owner_email}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-6">
                    <div className="text-center">
                      <p className="text-sm font-medium">Plano</p>
                      <p className="text-xs text-muted-foreground">{company.plan}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium">Receita</p>
                      <p className="text-xs text-muted-foreground">R$ 0</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium">Status</p>
                      {getStatusBadge(company.status)}
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-card border-primary/20">
                        <DropdownMenuLabel>Ações</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleEditCompany(company)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => updateCompanyStatus(company.id, 'active')}>
                          <Play className="mr-2 h-4 w-4" />
                          Ativar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => updateCompanyStatus(company.id, 'paused')}>
                          <Pause className="mr-2 h-4 w-4" />
                          Pausar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => updateCompanyStatus(company.id, 'blocked')}>
                          <Ban className="mr-2 h-4 w-4" />
                          Bloquear
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteCompany(company)}>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Edit Company Dialog */}
      <EditCompanyDialog
        company={editingCompany}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSuccess={fetchData}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-card border-primary/20">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a empresa "{companyToDelete?.name}"? 
              Esta ação não pode ser desfeita e todos os dados relacionados serão perdidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteCompany} className="bg-destructive hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}