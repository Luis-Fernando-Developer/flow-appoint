-- Create services table
CREATE TABLE IF NOT EXISTS public.services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  duration INTEGER NOT NULL DEFAULT 30,
  price NUMERIC NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create employees table
CREATE TABLE IF NOT EXISTS public.employees (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  role TEXT DEFAULT 'employee',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create employee_services junction table
CREATE TABLE IF NOT EXISTS public.employee_services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(employee_id, service_id)
);

-- Create clients table
CREATE TABLE IF NOT EXISTS public.clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  cpf TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create bookings table
CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id),
  employee_id UUID REFERENCES public.employees(id),
  service_id UUID REFERENCES public.services(id),
  booking_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status TEXT DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create service_combos table
CREATE TABLE IF NOT EXISTS public.service_combos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create service_combo_items junction table
CREATE TABLE IF NOT EXISTS public.service_combo_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  combo_id UUID NOT NULL REFERENCES public.service_combos(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(combo_id, service_id)
);

-- Create rewards table
CREATE TABLE IF NOT EXISTS public.rewards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  points_required INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create blocked_slots table
CREATE TABLE IF NOT EXISTS public.blocked_slots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE,
  start_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
  end_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create absences table
CREATE TABLE IF NOT EXISTS public.absences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE,
  absence_type TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_combos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_combo_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.absences ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for services
CREATE POLICY "Anyone can view services" ON public.services FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage services" ON public.services FOR ALL USING (true);

-- Create RLS policies for employees
CREATE POLICY "Anyone can view employees" ON public.employees FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage employees" ON public.employees FOR ALL USING (true);

-- Create RLS policies for employee_services
CREATE POLICY "Anyone can view employee_services" ON public.employee_services FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage employee_services" ON public.employee_services FOR ALL USING (true);

-- Create RLS policies for clients
CREATE POLICY "Anyone can view clients" ON public.clients FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage clients" ON public.clients FOR ALL USING (true);

-- Create RLS policies for bookings
CREATE POLICY "Anyone can view bookings" ON public.bookings FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage bookings" ON public.bookings FOR ALL USING (true);

-- Create RLS policies for service_combos
CREATE POLICY "Anyone can view service_combos" ON public.service_combos FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage service_combos" ON public.service_combos FOR ALL USING (true);

-- Create RLS policies for service_combo_items
CREATE POLICY "Anyone can view service_combo_items" ON public.service_combo_items FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage service_combo_items" ON public.service_combo_items FOR ALL USING (true);

-- Create RLS policies for rewards
CREATE POLICY "Anyone can view rewards" ON public.rewards FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage rewards" ON public.rewards FOR ALL USING (true);

-- Create RLS policies for blocked_slots
CREATE POLICY "Anyone can view blocked_slots" ON public.blocked_slots FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage blocked_slots" ON public.blocked_slots FOR ALL USING (true);

-- Create RLS policies for absences
CREATE POLICY "Anyone can view absences" ON public.absences FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage absences" ON public.absences FOR ALL USING (true);