-- Corrigir recursão infinita nas políticas RLS da tabela employees
-- Remover políticas problemáticas primeiro
DROP POLICY IF EXISTS "Company owners and managers can manage employees" ON employees;
DROP POLICY IF EXISTS "Employees are viewable by company members" ON employees;

-- Criar função de segurança definer para verificar se usuário é membro da empresa
CREATE OR REPLACE FUNCTION public.is_company_member(_company_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.employees
    WHERE company_id = _company_id 
      AND user_id = _user_id
      AND is_active = true
  );
$$;

-- Criar função para verificar se usuário é owner/manager da empresa
CREATE OR REPLACE FUNCTION public.is_company_admin(_company_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.employees
    WHERE company_id = _company_id 
      AND user_id = _user_id
      AND role IN ('owner', 'manager')
      AND is_active = true
  );
$$;

-- Recriar políticas usando as funções (sem recursão)
CREATE POLICY "Employees can view own data and company members" 
ON employees FOR SELECT 
USING (
  auth.uid() = user_id 
  OR public.is_company_member(company_id, auth.uid())
);

CREATE POLICY "Company admins can manage employees" 
ON employees FOR ALL 
USING (public.is_company_admin(company_id, auth.uid()))
WITH CHECK (public.is_company_admin(company_id, auth.uid()));

-- Política especial para permitir INSERT de novos owners (primeira vez)
CREATE POLICY "Allow insert for new company owners" 
ON employees FOR INSERT 
WITH CHECK (
  role = 'owner' 
  AND NOT EXISTS (
    SELECT 1 FROM employees e2 
    WHERE e2.company_id = employees.company_id 
    AND e2.role = 'owner'
  )
);