-- Create client_rewards table
CREATE TABLE IF NOT EXISTS public.client_rewards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  reward_service_id UUID REFERENCES public.services(id),
  specific_service_id UUID REFERENCES public.services(id),
  required_procedures INTEGER NOT NULL DEFAULT 0,
  count_specific_service BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create employee_absences table (different from absences)
CREATE TABLE IF NOT EXISTS public.employee_absences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE,
  absence_type TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create employee_availability table
CREATE TABLE IF NOT EXISTS public.employee_availability (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE,
  available_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  break_start TIME,
  break_end TIME,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create business_hours table
CREATE TABLE IF NOT EXISTS public.business_hours (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL,
  is_open BOOLEAN DEFAULT true,
  open_time TIME,
  close_time TIME,
  break_start TIME,
  break_end TIME,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create employee_schedules table
CREATE TABLE IF NOT EXISTS public.employee_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL,
  is_working BOOLEAN DEFAULT true,
  start_time TIME,
  end_time TIME,
  break_start TIME,
  break_end TIME,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create company_schedule_settings table
CREATE TABLE IF NOT EXISTS public.company_schedule_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE UNIQUE,
  min_advance_hours INTEGER DEFAULT 1,
  max_advance_days INTEGER DEFAULT 30,
  slot_duration_minutes INTEGER DEFAULT 30,
  allow_simultaneous_breaks BOOLEAN DEFAULT false,
  max_simultaneous_breaks INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add duration_minutes to services if it doesn't exist
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'services' AND column_name = 'duration_minutes') THEN
    ALTER TABLE public.services ADD COLUMN duration_minutes INTEGER DEFAULT 30;
  END IF;
END $$;

-- Enable RLS
ALTER TABLE public.client_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_absences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_schedule_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view client_rewards" ON public.client_rewards FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage client_rewards" ON public.client_rewards FOR ALL USING (true);

CREATE POLICY "Anyone can view employee_absences" ON public.employee_absences FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage employee_absences" ON public.employee_absences FOR ALL USING (true);

CREATE POLICY "Anyone can view employee_availability" ON public.employee_availability FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage employee_availability" ON public.employee_availability FOR ALL USING (true);

CREATE POLICY "Anyone can view business_hours" ON public.business_hours FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage business_hours" ON public.business_hours FOR ALL USING (true);

CREATE POLICY "Anyone can view employee_schedules" ON public.employee_schedules FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage employee_schedules" ON public.employee_schedules FOR ALL USING (true);

CREATE POLICY "Anyone can view company_schedule_settings" ON public.company_schedule_settings FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage company_schedule_settings" ON public.company_schedule_settings FOR ALL USING (true);