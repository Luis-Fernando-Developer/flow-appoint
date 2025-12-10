import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Save, ChevronDown, ChevronUp } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface EmployeeScheduleConfigProps {
  companyId: string;
}

interface Employee {
  id: string;
  name: string;
  employee_type: string;
}

interface EmployeeSchedule {
  id?: string;
  employee_id: string;
  day_of_week: number;
  is_working: boolean;
  start_time: string | null;
  end_time: string | null;
  break_start: string | null;
  break_end: string | null;
  allows_overtime: boolean;
}

const DAYS_OF_WEEK = [
  { value: 0, label: "Domingo", short: "Dom" },
  { value: 1, label: "Segunda", short: "Seg" },
  { value: 2, label: "Terça", short: "Ter" },
  { value: 3, label: "Quarta", short: "Qua" },
  { value: 4, label: "Quinta", short: "Qui" },
  { value: 5, label: "Sexta", short: "Sex" },
  { value: 6, label: "Sábado", short: "Sáb" },
];

export function EmployeeScheduleConfig({ companyId }: EmployeeScheduleConfigProps) {
  const { toast } = useToast();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<string>("");
  const [schedules, setSchedules] = useState<EmployeeSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [openDays, setOpenDays] = useState<number[]>([]);

  useEffect(() => {
    fetchEmployees();
  }, [companyId]);

  useEffect(() => {
    if (selectedEmployee) {
      fetchSchedules();
    }
  }, [selectedEmployee]);

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('id, name, employee_type')
        .eq('company_id', companyId)
        .eq('employee_type', 'fixo')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setEmployees(data || []);
      
      if (data && data.length > 0) {
        setSelectedEmployee(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSchedules = async () => {
    try {
      const { data, error } = await supabase
        .from('employee_schedules')
        .select('*')
        .eq('employee_id', selectedEmployee)
        .order('day_of_week');

      if (error) throw error;

      // Create default schedules for all days
      const defaultSchedules = DAYS_OF_WEEK.map(day => ({
        employee_id: selectedEmployee,
        day_of_week: day.value,
        is_working: day.value !== 0 && day.value !== 6, // Work Mon-Fri by default
        start_time: "08:00",
        end_time: "18:00",
        break_start: "12:00",
        break_end: "13:00",
        allows_overtime: false,
      }));

      if (data && data.length > 0) {
        const schedulesMap = new Map(data.map(s => [s.day_of_week, s]));
        const mergedSchedules = defaultSchedules.map(ds => {
          const existing = schedulesMap.get(ds.day_of_week);
          return existing ? {
            id: existing.id,
            employee_id: existing.employee_id,
            day_of_week: existing.day_of_week,
            is_working: existing.is_working ?? true,
            start_time: existing.start_time || "08:00",
            end_time: existing.end_time || "18:00",
            break_start: existing.break_start,
            break_end: existing.break_end,
            allows_overtime: existing.allows_overtime ?? false,
          } : ds;
        });
        setSchedules(mergedSchedules);
      } else {
        setSchedules(defaultSchedules);
      }
    } catch (error) {
      console.error('Error fetching schedules:', error);
    }
  };

  const handleScheduleChange = (dayIndex: number, field: keyof EmployeeSchedule, value: any) => {
    setSchedules(prev => prev.map((s, i) => 
      i === dayIndex ? { ...s, [field]: value } : s
    ));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('employee_schedules')
        .upsert(
          schedules.map(s => ({
            employee_id: selectedEmployee,
            day_of_week: s.day_of_week,
            is_working: s.is_working,
            start_time: s.start_time,
            end_time: s.end_time,
            break_start: s.break_start || null,
            break_end: s.break_end || null,
            allows_overtime: s.allows_overtime,
          })),
          { onConflict: 'employee_id,day_of_week' }
        );

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Jornada salva com sucesso!"
      });
    } catch (error) {
      console.error('Error saving schedules:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar a jornada.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const toggleDay = (dayIndex: number) => {
    setOpenDays(prev => 
      prev.includes(dayIndex) 
        ? prev.filter(d => d !== dayIndex) 
        : [...prev, dayIndex]
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (employees.length === 0) {
    return (
      <Card className="card-glow">
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">
            Nenhum colaborador fixo cadastrado. Adicione colaboradores do tipo "Fixo" para configurar jornadas.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="card-glow">
      <CardHeader>
        <CardTitle>Jornada dos Colaboradores Fixos</CardTitle>
        <CardDescription>
          Configure a jornada de trabalho semanal para cada colaborador fixo, incluindo horário de intervalo.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="max-w-sm">
          <Label>Selecione o Colaborador</Label>
          <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent>
              {employees.map(emp => (
                <SelectItem key={emp.id} value={emp.id}>
                  {emp.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3">
          {schedules.map((schedule, index) => (
            <Collapsible 
              key={schedule.day_of_week}
              open={openDays.includes(index)}
              onOpenChange={() => toggleDay(index)}
            >
              <div 
                className={`rounded-lg border transition-colors ${
                  schedule.is_working ? 'border-primary/30 bg-card/50' : 'border-muted bg-muted/20'
                }`}
              >
                <CollapsibleTrigger asChild>
                  <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-primary/5">
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={schedule.is_working}
                        onCheckedChange={(checked) => handleScheduleChange(index, 'is_working', checked)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <span className={`font-medium ${!schedule.is_working && 'text-muted-foreground'}`}>
                        {DAYS_OF_WEEK[schedule.day_of_week].label}
                      </span>
                      {schedule.is_working && (
                        <span className="text-sm text-muted-foreground">
                          {schedule.start_time} - {schedule.end_time}
                        </span>
                      )}
                    </div>
                    {openDays.includes(index) ? (
                      <ChevronUp className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  {schedule.is_working && (
                    <div className="px-4 pb-4 space-y-4 border-t border-primary/10 pt-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm">Entrada</Label>
                          <Input
                            type="time"
                            value={schedule.start_time || ""}
                            onChange={(e) => handleScheduleChange(index, 'start_time', e.target.value)}
                          />
                        </div>
                        <div>
                          <Label className="text-sm">Saída</Label>
                          <Input
                            type="time"
                            value={schedule.end_time || ""}
                            onChange={(e) => handleScheduleChange(index, 'end_time', e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm">Início do Intervalo</Label>
                          <Input
                            type="time"
                            value={schedule.break_start || ""}
                            onChange={(e) => handleScheduleChange(index, 'break_start', e.target.value || null)}
                            placeholder="--:--"
                          />
                        </div>
                        <div>
                          <Label className="text-sm">Fim do Intervalo</Label>
                          <Input
                            type="time"
                            value={schedule.break_end || ""}
                            onChange={(e) => handleScheduleChange(index, 'break_end', e.target.value || null)}
                            placeholder="--:--"
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Switch
                          checked={schedule.allows_overtime}
                          onCheckedChange={(checked) => handleScheduleChange(index, 'allows_overtime', checked)}
                        />
                        <Label className="text-sm">Permitir hora extra neste dia</Label>
                      </div>
                    </div>
                  )}
                </CollapsibleContent>
              </div>
            </Collapsible>
          ))}
        </div>

        <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
          <Save className="w-4 h-4 mr-2" />
          {saving ? "Salvando..." : "Salvar Jornada"}
        </Button>
      </CardContent>
    </Card>
  );
}
