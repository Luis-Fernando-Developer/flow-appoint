-- Criar enum para tipos de ausência
CREATE TYPE absence_type AS ENUM ('vacation', 'day_off', 'sick_leave', 'suspension', 'other');

-- 1. Tabela de horários de funcionamento da empresa
CREATE TABLE public.business_hours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Domingo, 6=Sábado
  is_open BOOLEAN DEFAULT true,
  open_time TIME,
  close_time TIME,
  -- Para horários intervalados (ex: 08:00-12:00 e 14:00-18:00)
  second_open_time TIME,
  second_close_time TIME,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(company_id, day_of_week)
);

-- 2. Tabela de jornada dos funcionários fixos
CREATE TABLE public.employee_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  is_working BOOLEAN DEFAULT true,
  start_time TIME,
  end_time TIME,
  -- Horário de intervalo obrigatório
  break_start TIME,
  break_end TIME,
  -- Permitir hora extra neste dia
  allows_overtime BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(employee_id, day_of_week)
);

-- 3. Tabela de disponibilidade dos autônomos (por data específica)
CREATE TABLE public.employee_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  available_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  -- Horário de intervalo
  break_start TIME,
  break_end TIME,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(employee_id, available_date)
);

-- 4. Tabela de ausências (férias, folgas, afastamentos, suspensões)
CREATE TABLE public.employee_absences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  absence_type absence_type NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Tabela de bloqueios manuais de horário
CREATE TABLE public.blocked_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  blocked_date DATE NOT NULL,
  -- Se NULL, bloqueia o dia inteiro
  start_time TIME,
  end_time TIME,
  reason TEXT,
  -- Se true, afeta toda a empresa (feriado, etc)
  is_company_wide BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Tabela de configurações gerais de horários da empresa
CREATE TABLE public.company_schedule_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE UNIQUE,
  -- Intervalo obrigatório
  min_break_duration INTEGER DEFAULT 60, -- minutos
  max_break_duration INTEGER DEFAULT 120, -- minutos
  -- Pausas simultâneas
  max_simultaneous_breaks INTEGER DEFAULT 2,
  -- Horas extras
  allows_overtime BOOLEAN DEFAULT false,
  max_overtime_hours INTEGER DEFAULT 2, -- horas extras máximas por dia
  -- Slot de tempo para agendamentos
  slot_duration INTEGER DEFAULT 30, -- minutos
  -- Antecedência mínima para agendamento
  min_booking_advance_hours INTEGER DEFAULT 1,
  -- Antecedência máxima para agendamento
  max_booking_advance_days INTEGER DEFAULT 30,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.business_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_absences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_schedule_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies para business_hours
CREATE POLICY "Anyone can view business hours for active companies"
ON public.business_hours FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.companies c
  WHERE c.id = business_hours.company_id AND c.status = 'active'
));

CREATE POLICY "Company admins can manage business hours"
ON public.business_hours FOR ALL
USING (is_company_admin(company_id, auth.uid()));

-- RLS Policies para employee_schedules
CREATE POLICY "Employees can view their own schedules"
ON public.employee_schedules FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.employees e
  WHERE e.id = employee_schedules.employee_id AND e.user_id = auth.uid()
));

CREATE POLICY "Anyone can view schedules for active employees"
ON public.employee_schedules FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.employees e
  JOIN public.companies c ON c.id = e.company_id
  WHERE e.id = employee_schedules.employee_id AND e.is_active = true AND c.status = 'active'
));

CREATE POLICY "Company admins can manage employee schedules"
ON public.employee_schedules FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.employees e
  WHERE e.id = employee_schedules.employee_id AND is_company_admin(e.company_id, auth.uid())
));

CREATE POLICY "Employees can manage their own schedules if autonomous"
ON public.employee_schedules FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.employees e
  WHERE e.id = employee_schedules.employee_id 
    AND e.user_id = auth.uid() 
    AND e.employee_type = 'autonomo'
));

-- RLS Policies para employee_availability
CREATE POLICY "Anyone can view availability for active employees"
ON public.employee_availability FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.employees e
  JOIN public.companies c ON c.id = e.company_id
  WHERE e.id = employee_availability.employee_id AND e.is_active = true AND c.status = 'active'
));

CREATE POLICY "Company admins can manage employee availability"
ON public.employee_availability FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.employees e
  WHERE e.id = employee_availability.employee_id AND is_company_admin(e.company_id, auth.uid())
));

CREATE POLICY "Autonomous employees can manage their own availability"
ON public.employee_availability FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.employees e
  WHERE e.id = employee_availability.employee_id 
    AND e.user_id = auth.uid() 
    AND e.employee_type = 'autonomo'
));

-- RLS Policies para employee_absences
CREATE POLICY "Employees can view their own absences"
ON public.employee_absences FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.employees e
  WHERE e.id = employee_absences.employee_id AND e.user_id = auth.uid()
));

CREATE POLICY "Company admins can manage employee absences"
ON public.employee_absences FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.employees e
  WHERE e.id = employee_absences.employee_id AND is_company_admin(e.company_id, auth.uid())
));

-- RLS Policies para blocked_slots
CREATE POLICY "Anyone can view blocked slots for active companies"
ON public.blocked_slots FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.companies c
  WHERE c.id = blocked_slots.company_id AND c.status = 'active'
));

CREATE POLICY "Company admins can manage blocked slots"
ON public.blocked_slots FOR ALL
USING (is_company_admin(company_id, auth.uid()));

CREATE POLICY "Autonomous employees can manage their own blocked slots"
ON public.blocked_slots FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.employees e
  WHERE e.id = blocked_slots.employee_id 
    AND e.user_id = auth.uid() 
    AND e.employee_type = 'autonomo'
));

-- RLS Policies para company_schedule_settings
CREATE POLICY "Anyone can view schedule settings for active companies"
ON public.company_schedule_settings FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.companies c
  WHERE c.id = company_schedule_settings.company_id AND c.status = 'active'
));

CREATE POLICY "Company admins can manage schedule settings"
ON public.company_schedule_settings FOR ALL
USING (is_company_admin(company_id, auth.uid()));

-- Triggers para updated_at
CREATE TRIGGER update_business_hours_updated_at
BEFORE UPDATE ON public.business_hours
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_employee_schedules_updated_at
BEFORE UPDATE ON public.employee_schedules
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_employee_absences_updated_at
BEFORE UPDATE ON public.employee_absences
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_company_schedule_settings_updated_at
BEFORE UPDATE ON public.company_schedule_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();