-- Adicionar novo valor 'supervisor' ao enum employee_role
ALTER TYPE employee_role ADD VALUE IF NOT EXISTS 'supervisor';

-- Criar função para verificar níveis de permissão hierárquicos
CREATE OR REPLACE FUNCTION public.has_permission_level(_company_id uuid, _user_id uuid, _required_level text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM employees e
    WHERE e.company_id = _company_id 
      AND e.user_id = _user_id
      AND e.is_active = true
      AND CASE _required_level
        WHEN 'owner' THEN e.role = 'owner'
        WHEN 'manager' THEN e.role IN ('owner', 'manager')
        WHEN 'supervisor' THEN e.role IN ('owner', 'manager', 'supervisor')
        WHEN 'receptionist' THEN e.role IN ('owner', 'manager', 'supervisor', 'receptionist')
        WHEN 'employee' THEN e.role IN ('owner', 'manager', 'supervisor', 'receptionist', 'employee')
        ELSE false
      END
  );
$$;

-- Criar função para obter o nível de permissão do usuário atual
CREATE OR REPLACE FUNCTION public.get_user_role(_company_id uuid, _user_id uuid)
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT e.role::text
  FROM employees e
  WHERE e.company_id = _company_id 
    AND e.user_id = _user_id
    AND e.is_active = true
  LIMIT 1;
$$;