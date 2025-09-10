-- Adicionar tipo de funcionário na tabela employees
ALTER TABLE public.employees 
ADD COLUMN employee_type TEXT NOT NULL DEFAULT 'fixo' CHECK (employee_type IN ('autonomo', 'fixo'));

-- Criar tabela de relacionamento entre funcionários e serviços
CREATE TABLE public.employee_services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(employee_id, service_id)
);

-- Habilitar RLS na tabela employee_services
ALTER TABLE public.employee_services ENABLE ROW LEVEL SECURITY;

-- Política para funcionários verem seus próprios serviços
CREATE POLICY "Employees can view their own services"
ON public.employee_services
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.employees e
    WHERE e.id = employee_services.employee_id 
    AND e.user_id = auth.uid()
  )
);

-- Política para administradores gerenciarem serviços dos funcionários
CREATE POLICY "Company admins can manage employee services"
ON public.employee_services
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.employees e
    WHERE e.id = employee_services.employee_id 
    AND is_company_admin(e.company_id, auth.uid())
  )
);

-- Criar índice para melhor performance
CREATE INDEX idx_employee_services_employee_id ON public.employee_services(employee_id);
CREATE INDEX idx_employee_services_service_id ON public.employee_services(service_id);