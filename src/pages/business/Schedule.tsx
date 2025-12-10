import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { BusinessLayout } from "@/components/business/BusinessLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { BusinessHoursConfig } from "@/components/business/schedule/BusinessHoursConfig";
import { EmployeeScheduleConfig } from "@/components/business/schedule/EmployeeScheduleConfig";
import { AutonomousAvailabilityConfig } from "@/components/business/schedule/AutonomousAvailabilityConfig";
import { ScheduleRulesConfig } from "@/components/business/schedule/ScheduleRulesConfig";
import { AbsencesManager } from "@/components/business/schedule/AbsencesManager";
import { BlockedSlotsManager } from "@/components/business/schedule/BlockedSlotsManager";
import { Clock, Users, Calendar, Settings, UserX, Ban } from "lucide-react";

interface Company {
  id: string;
  name: string;
  slug: string;
}

export default function BusinessSchedule() {
  const { slug } = useParams<{ slug: string }>();
  const { toast } = useToast();
  const [company, setCompany] = useState<Company | null>(null);
  const [currentEmployee, setCurrentEmployee] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [slug]);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .select('id, name, slug')
        .eq('slug', slug)
        .single();

      if (companyError) throw companyError;
      setCompany(companyData);

      const { data: employeeData } = await supabase
        .from('employees')
        .select('*')
        .eq('company_id', companyData.id)
        .eq('user_id', user.id)
        .maybeSingle();

      setCurrentEmployee(employeeData);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Empresa não encontrada.</p>
      </div>
    );
  }

  return (
    <BusinessLayout 
      companySlug={company.slug} 
      companyName={company.name}
      companyId={company.id}
      userRole={currentEmployee?.role || 'employee'}
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gradient">Horários e Disponibilidade</h1>
          <p className="text-muted-foreground mt-2">
            Configure horários de funcionamento, jornadas e ausências
          </p>
        </div>

        <Tabs defaultValue="business-hours" className="w-full">
          <TabsList className="grid w-full grid-cols-6 lg:w-auto lg:inline-grid">
            <TabsTrigger value="business-hours" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span className="hidden sm:inline">Estabelecimento</span>
            </TabsTrigger>
            <TabsTrigger value="fixed-schedules" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Fixos</span>
            </TabsTrigger>
            <TabsTrigger value="autonomous" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span className="hidden sm:inline">Autônomos</span>
            </TabsTrigger>
            <TabsTrigger value="absences" className="flex items-center gap-2">
              <UserX className="w-4 h-4" />
              <span className="hidden sm:inline">Ausências</span>
            </TabsTrigger>
            <TabsTrigger value="blocked" className="flex items-center gap-2">
              <Ban className="w-4 h-4" />
              <span className="hidden sm:inline">Bloqueios</span>
            </TabsTrigger>
            <TabsTrigger value="rules" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Regras</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="business-hours" className="mt-6">
            <BusinessHoursConfig companyId={company.id} />
          </TabsContent>

          <TabsContent value="fixed-schedules" className="mt-6">
            <EmployeeScheduleConfig companyId={company.id} />
          </TabsContent>

          <TabsContent value="autonomous" className="mt-6">
            <AutonomousAvailabilityConfig companyId={company.id} />
          </TabsContent>

          <TabsContent value="absences" className="mt-6">
            <AbsencesManager companyId={company.id} />
          </TabsContent>

          <TabsContent value="blocked" className="mt-6">
            <BlockedSlotsManager companyId={company.id} />
          </TabsContent>

          <TabsContent value="rules" className="mt-6">
            <ScheduleRulesConfig companyId={company.id} />
          </TabsContent>
        </Tabs>
      </div>
    </BusinessLayout>
  );
}
