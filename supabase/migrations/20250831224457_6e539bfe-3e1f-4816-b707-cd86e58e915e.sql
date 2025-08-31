-- Criar tabelas para o sistema de agendamento

-- Tabela de empresas/estabelecimentos
CREATE TABLE public.companies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  owner_name TEXT NOT NULL,
  owner_email TEXT NOT NULL,
  owner_cpf TEXT NOT NULL,
  cnpj TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  logo_url TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'blocked')),
  plan TEXT NOT NULL DEFAULT 'starter' CHECK (plan IN ('starter', 'professional', 'enterprise')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de funcionários/colaboradores
CREATE TYPE public.employee_role AS ENUM ('owner', 'manager', 'supervisor', 'receptionist', 'employee');

CREATE TABLE public.employees (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  role employee_role NOT NULL DEFAULT 'employee',
  permissions JSONB DEFAULT '{}',
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(company_id, email)
);

-- Tabela de serviços
CREATE TABLE public.services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de clientes
CREATE TABLE public.clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  birth_date DATE,
  avatar_url TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(company_id, email)
);

-- Tabela de agendamentos
CREATE TYPE public.booking_status AS ENUM ('pending', 'confirmed', 'cancelled', 'completed', 'no_show');
CREATE TYPE public.payment_status AS ENUM ('pending', 'confirmed', 'cancelled', 'free');

CREATE TABLE public.bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
  booking_date DATE NOT NULL,
  booking_time TIME NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  booking_status booking_status NOT NULL DEFAULT 'pending',
  payment_status payment_status NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para companies
CREATE POLICY "Companies are viewable by everyone" 
ON public.companies FOR SELECT USING (true);

CREATE POLICY "Only authenticated users can insert companies" 
ON public.companies FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Company owners can update their company" 
ON public.companies FOR UPDATE 
USING (auth.uid()::text = owner_email OR 
       EXISTS (SELECT 1 FROM public.employees WHERE company_id = companies.id AND user_id = auth.uid() AND role IN ('owner', 'manager')));

-- Políticas RLS para employees
CREATE POLICY "Employees are viewable by company members" 
ON public.employees FOR SELECT 
USING (auth.uid() = user_id OR 
       EXISTS (SELECT 1 FROM public.employees e WHERE e.company_id = employees.company_id AND e.user_id = auth.uid()));

CREATE POLICY "Company owners and managers can manage employees" 
ON public.employees FOR ALL 
USING (EXISTS (SELECT 1 FROM public.employees e WHERE e.company_id = employees.company_id AND e.user_id = auth.uid() AND e.role IN ('owner', 'manager')));

-- Políticas RLS para services
CREATE POLICY "Services are viewable by everyone" 
ON public.services FOR SELECT USING (true);

CREATE POLICY "Company members can manage services" 
ON public.services FOR ALL 
USING (EXISTS (SELECT 1 FROM public.employees e WHERE e.company_id = services.company_id AND e.user_id = auth.uid()));

-- Políticas RLS para clients
CREATE POLICY "Clients are viewable by company members and themselves" 
ON public.clients FOR SELECT 
USING (auth.uid() = user_id OR 
       EXISTS (SELECT 1 FROM public.employees e WHERE e.company_id = clients.company_id AND e.user_id = auth.uid()));

CREATE POLICY "Company members can manage clients" 
ON public.clients FOR ALL 
USING (EXISTS (SELECT 1 FROM public.employees e WHERE e.company_id = clients.company_id AND e.user_id = auth.uid()));

-- Políticas RLS para bookings
CREATE POLICY "Bookings are viewable by company members and clients" 
ON public.bookings FOR SELECT 
USING (EXISTS (SELECT 1 FROM public.employees e WHERE e.company_id = bookings.company_id AND e.user_id = auth.uid()) OR
       EXISTS (SELECT 1 FROM public.clients c WHERE c.id = bookings.client_id AND c.user_id = auth.uid()));

CREATE POLICY "Company members can manage bookings" 
ON public.bookings FOR ALL 
USING (EXISTS (SELECT 1 FROM public.employees e WHERE e.company_id = bookings.company_id AND e.user_id = auth.uid()));

-- Triggers para updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_employees_updated_at
  BEFORE UPDATE ON public.employees
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_services_updated_at
  BEFORE UPDATE ON public.services
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir dados de exemplo
INSERT INTO public.companies (name, slug, owner_name, owner_email, owner_cpf, status, plan) VALUES
('Viking Barbearia', 'viking-barbearia', 'João Silva', 'joao@viking.com', '123.456.789-00', 'active', 'professional'),
('Clínica Beleza', 'clinica-beleza', 'Maria Santos', 'maria@beleza.com', '987.654.321-00', 'active', 'enterprise'),
('Spa Relax', 'spa-relax', 'Ana Costa', 'ana@relax.com', '456.789.123-00', 'active', 'starter');