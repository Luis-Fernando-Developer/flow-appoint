import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { BusinessLayout } from "@/components/business/BusinessLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus, Edit, Trash2, Mail, Phone, UserCheck, UserX } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AddEmployeeDialog } from "@/components/business/AddEmployeeDialog";

interface Employee {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  is_active: boolean;
  avatar_url?: string;
  created_at: string;
}

interface Company {
  id: string;
  name: string;
  slug: string;
}

interface CurrentEmployee {
  id: string;
  role: string;
  company: Company;
}

export default function BusinessEmployees() {
  const { slug } = useParams<{ slug: string }>();
  const [company, setCompany] = useState<Company | null>(null);
  const [currentEmployee, setCurrentEmployee] = useState<CurrentEmployee | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, [slug]);

  const fetchData = async () => {
    try {
      // Buscar dados da empresa
      const { data: companyData } = await supabase
        .from('companies')
        .select('*')
        .eq('slug', slug)
        .single();

      if (!companyData) return;

      setCompany(companyData);

      // Buscar dados do funcionário atual
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setCurrentUser(user);
      const { data: currentEmployeeData } = await supabase
        .from('employees')
        .select('*, company:companies(*)')
        .eq('user_id', user.id)
        .eq('company_id', companyData.id)
        .single();

      if (!currentEmployeeData) return;

      setCurrentEmployee(currentEmployeeData);

      // Buscar todos os funcionários
      const { data: employeesData } = await supabase
        .from('employees')
        .select('*')
        .eq('company_id', companyData.id)
        .order('created_at');

      setEmployees(employeesData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadge = (role: string) => {
    const roleNames = {
      owner: { label: "Proprietário", variant: "default" as const },
      admin: { label: "Administrador", variant: "secondary" as const },
      manager: { label: "Gerente", variant: "outline" as const },
      receptionist: { label: "Recepcionista", variant: "outline" as const },
      employee: { label: "Funcionário", variant: "outline" as const },
    };

    const roleInfo = roleNames[role as keyof typeof roleNames] || { label: role, variant: "outline" as const };
    return <Badge variant={roleInfo.variant}>{roleInfo.label}</Badge>;
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (loading) {
    return (
      <BusinessLayout
        companySlug={slug || ""}
        companyName="Carregando..."
        companyId=""
        userRole="loading"
      >
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Carregando...</p>
          </div>
        </div>
      </BusinessLayout>
    );
  }

  if (!company || !currentEmployee) {
    return (
      <BusinessLayout
        companySlug={slug || ""}
        companyName="Acesso Negado"
        companyId=""
        userRole="unauthorized"
      >
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-destructive">Acesso Negado</h2>
            <p className="text-muted-foreground">Você não tem permissão para acessar esta página.</p>
          </div>
        </div>
      </BusinessLayout>
    );
  }

  // Verificar se pode gerenciar funcionários
  const canManageEmployees = ['owner', 'admin', 'manager'].includes(currentEmployee.role);

  return (
    <BusinessLayout 
      companySlug={company.slug} 
      companyName={company.name}
      companyId={company.id}
      userRole={currentEmployee.role}
      currentUser={currentUser}
    >
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gradient">Colaboradores</h1>
            <p className="text-muted-foreground">Gerencie a equipe da sua empresa</p>
          </div>
          {canManageEmployees && (
            <AddEmployeeDialog 
              companyId={company.id} 
              onEmployeeAdded={fetchData}
            />
          )}
        </div>

        <div className="grid gap-6">
          {employees.map((employee) => (
            <Card key={employee.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={employee.avatar_url} />
                      <AvatarFallback>{getInitials(employee.name)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {employee.name}
                        {employee.is_active ? (
                          <UserCheck className="w-4 h-4 text-green-500" />
                        ) : (
                          <UserX className="w-4 h-4 text-red-500" />
                        )}
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        {getRoleBadge(employee.role)}
                        {!employee.is_active && (
                          <Badge variant="destructive">Inativo</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  {canManageEmployees && employee.role !== 'owner' && (
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="w-4 h-4 text-primary" />
                    <span>{employee.email}</span>
                  </div>
                  {employee.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="w-4 h-4 text-primary" />
                      <span>{employee.phone}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </BusinessLayout>
  );
}