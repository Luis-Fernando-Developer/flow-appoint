import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Save } from "lucide-react";

interface ScheduleRulesConfigProps {
  companyId: string;
}

interface ScheduleSettings {
  min_break_duration: number;
  max_break_duration: number;
  max_simultaneous_breaks: number;
  allows_overtime: boolean;
  max_overtime_hours: number;
  slot_duration: number;
  min_booking_advance_hours: number;
  max_booking_advance_days: number;
}

const DEFAULT_SETTINGS: ScheduleSettings = {
  min_break_duration: 60,
  max_break_duration: 120,
  max_simultaneous_breaks: 2,
  allows_overtime: false,
  max_overtime_hours: 2,
  slot_duration: 30,
  min_booking_advance_hours: 1,
  max_booking_advance_days: 30,
};

export function ScheduleRulesConfig({ companyId }: ScheduleRulesConfigProps) {
  const { toast } = useToast();
  const [settings, setSettings] = useState<ScheduleSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, [companyId]);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('company_schedule_settings')
        .select('*')
        .eq('company_id', companyId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setSettings({
          min_break_duration: data.min_break_duration ?? DEFAULT_SETTINGS.min_break_duration,
          max_break_duration: data.max_break_duration ?? DEFAULT_SETTINGS.max_break_duration,
          max_simultaneous_breaks: data.max_simultaneous_breaks ?? DEFAULT_SETTINGS.max_simultaneous_breaks,
          allows_overtime: data.allows_overtime ?? DEFAULT_SETTINGS.allows_overtime,
          max_overtime_hours: data.max_overtime_hours ?? DEFAULT_SETTINGS.max_overtime_hours,
          slot_duration: data.slot_duration ?? DEFAULT_SETTINGS.slot_duration,
          min_booking_advance_hours: data.min_booking_advance_hours ?? DEFAULT_SETTINGS.min_booking_advance_hours,
          max_booking_advance_days: data.max_booking_advance_days ?? DEFAULT_SETTINGS.max_booking_advance_days,
        });
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSettingChange = (field: keyof ScheduleSettings, value: any) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('company_schedule_settings')
        .upsert({
          company_id: companyId,
          ...settings,
        }, { onConflict: 'company_id' });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Configurações salvas com sucesso!"
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar as configurações.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Regras de Intervalo */}
      <Card className="card-glow">
        <CardHeader>
          <CardTitle>Regras de Intervalo</CardTitle>
          <CardDescription>
            Configure as regras de intervalo/pausa para os colaboradores (atende normas trabalhistas).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Duração Mínima do Intervalo (minutos)</Label>
              <Input
                type="number"
                min={0}
                value={settings.min_break_duration}
                onChange={(e) => handleSettingChange('min_break_duration', parseInt(e.target.value) || 0)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                CLT exige mínimo de 60 min para jornadas acima de 6h
              </p>
            </div>
            <div>
              <Label>Duração Máxima do Intervalo (minutos)</Label>
              <Input
                type="number"
                min={0}
                value={settings.max_break_duration}
                onChange={(e) => handleSettingChange('max_break_duration', parseInt(e.target.value) || 0)}
              />
            </div>
          </div>

          <div>
            <Label>Máximo de Pessoas em Pausa Simultânea</Label>
            <Input
              type="number"
              min={1}
              value={settings.max_simultaneous_breaks}
              onChange={(e) => handleSettingChange('max_simultaneous_breaks', parseInt(e.target.value) || 1)}
              className="max-w-[200px]"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Evita que o estabelecimento fique sem atendimento
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Horas Extras */}
      <Card className="card-glow">
        <CardHeader>
          <CardTitle>Horas Extras</CardTitle>
          <CardDescription>
            Configure se o estabelecimento permite horas extras.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Switch
              checked={settings.allows_overtime}
              onCheckedChange={(checked) => handleSettingChange('allows_overtime', checked)}
            />
            <Label>Permitir horas extras globalmente</Label>
          </div>

          {settings.allows_overtime && (
            <div>
              <Label>Máximo de Horas Extras por Dia</Label>
              <Input
                type="number"
                min={0}
                max={4}
                value={settings.max_overtime_hours}
                onChange={(e) => handleSettingChange('max_overtime_hours', parseInt(e.target.value) || 0)}
                className="max-w-[200px]"
              />
              <p className="text-xs text-muted-foreground mt-1">
                CLT permite no máximo 2h extras por dia
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Configurações de Agendamento */}
      <Card className="card-glow">
        <CardHeader>
          <CardTitle>Configurações de Agendamento</CardTitle>
          <CardDescription>
            Configure como os slots de horário são gerados para os clientes.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Duração do Slot (minutos)</Label>
            <Input
              type="number"
              min={5}
              step={5}
              value={settings.slot_duration}
              onChange={(e) => handleSettingChange('slot_duration', parseInt(e.target.value) || 30)}
              className="max-w-[200px]"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Intervalo entre horários disponíveis (ex: 30 = 9:00, 9:30, 10:00...)
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Antecedência Mínima (horas)</Label>
              <Input
                type="number"
                min={0}
                value={settings.min_booking_advance_hours}
                onChange={(e) => handleSettingChange('min_booking_advance_hours', parseInt(e.target.value) || 0)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Quantas horas antes o cliente pode agendar
              </p>
            </div>
            <div>
              <Label>Antecedência Máxima (dias)</Label>
              <Input
                type="number"
                min={1}
                value={settings.max_booking_advance_days}
                onChange={(e) => handleSettingChange('max_booking_advance_days', parseInt(e.target.value) || 1)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Até quantos dias no futuro o cliente pode agendar
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
        <Save className="w-4 h-4 mr-2" />
        {saving ? "Salvando..." : "Salvar Configurações"}
      </Button>
    </div>
  );
}
