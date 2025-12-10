-- Atualizar is_company_admin: owners sempre têm acesso, managers precisam estar ativos
CREATE OR REPLACE FUNCTION public.is_company_admin(_company_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.employees
    WHERE company_id = _company_id 
      AND user_id = _user_id
      AND (
        -- Owners sempre têm acesso administrativo, independente de is_active
        role = 'owner'::employee_role
        OR 
        -- Managers precisam estar ativos
        (role = 'manager'::employee_role AND is_active = true)
      )
  );
$$;

-- Atualizar is_company_member: owners sempre são members, outros precisam estar ativos
CREATE OR REPLACE FUNCTION public.is_company_member(_company_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.employees
    WHERE company_id = _company_id 
      AND user_id = _user_id
      AND (
        -- Owners sempre são membros
        role = 'owner'::employee_role
        OR
        -- Outros precisam estar ativos  
        is_active = true
      )
  );
$$;

-- Atualizar has_permission_level: owners sempre têm acesso total
CREATE OR REPLACE FUNCTION public.has_permission_level(_company_id uuid, _user_id uuid, _required_level text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM employees e
    WHERE e.company_id = _company_id 
      AND e.user_id = _user_id
      AND (
        -- Owners sempre têm acesso total a qualquer nível
        e.role = 'owner'::employee_role
        OR
        -- Outros devem estar ativos e ter o nível adequado
        (e.is_active = true AND CASE _required_level
          WHEN 'owner' THEN false -- Apenas owner real
          WHEN 'manager' THEN e.role = 'manager'::employee_role
          WHEN 'supervisor' THEN e.role IN ('manager'::employee_role, 'supervisor'::employee_role)
          WHEN 'receptionist' THEN e.role IN ('manager'::employee_role, 'supervisor'::employee_role, 'receptionist'::employee_role)
          WHEN 'employee' THEN e.role IN ('manager'::employee_role, 'supervisor'::employee_role, 'receptionist'::employee_role, 'employee'::employee_role)
          ELSE false
        END)
      )
  );
$$;

-- Atualizar get_user_role: owners sempre retornam sua role
CREATE OR REPLACE FUNCTION public.get_user_role(_company_id uuid, _user_id uuid)
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT e.role::text
  FROM employees e
  WHERE e.company_id = _company_id 
    AND e.user_id = _user_id
    AND (
      -- Owners sempre retornam role
      e.role = 'owner'::employee_role
      OR
      -- Outros precisam estar ativos
      e.is_active = true
    )
  LIMIT 1;
$$;