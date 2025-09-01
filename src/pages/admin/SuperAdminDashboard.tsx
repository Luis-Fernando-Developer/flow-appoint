import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookingLogo } from "@/components/BookingLogo";
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

// Mock data para demonstração
const mockCompanies = [
  {
    id: 1,
    name: "Viking Barbearia",
    owner: "João Silva",
    email: "joao@viking.com",
    status: "active",
    plan: "Professional",
    monthlyRevenue: 2500,
    totalBookings: 156,
    createdAt: "2024-01-15"
  },
  {
    id: 2,
    name: "Clínica Beleza",
    owner: "Maria Santos",
    email: "maria@beleza.com",
    status: "paused",
    plan: "Enterprise",
    monthlyRevenue: 4800,
    totalBookings: 234,
    createdAt: "2024-02-20"
  },
  {
    id: 3,
    name: "Spa Relax",
    owner: "Ana Costa",
    email: "ana@relax.com",
    status: "blocked",
    plan: "Starter",
    monthlyRevenue: 890,
    totalBookings: 67,
    createdAt: "2024-03-10"
  }
];

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
  const [companies] = useState(mockCompanies);

  const stats = {
    totalCompanies: companies.length,
    activeCompanies: companies.filter(c => c.status === 'active').length,
    totalRevenue: companies.reduce((acc, c) => acc + c.monthlyRevenue, 0),
    totalBookings: companies.reduce((acc, c) => acc + c.totalBookings, 0)
  };

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
              <Button variant="neon" onClick={() => navigate("/admin/create-company")}>
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
                      <p className="text-sm text-muted-foreground">{company.owner} • {company.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-6">
                    <div className="text-center">
                      <p className="text-sm font-medium">Plano</p>
                      <p className="text-xs text-muted-foreground">{company.plan}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium">Receita</p>
                      <p className="text-xs text-muted-foreground">R$ {company.monthlyRevenue}</p>
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
                        <DropdownMenuItem>
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Play className="mr-2 h-4 w-4" />
                          Ativar
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Pause className="mr-2 h-4 w-4" />
                          Pausar
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Ban className="mr-2 h-4 w-4" />
                          Bloquear
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive">
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
    </div>
  );
}