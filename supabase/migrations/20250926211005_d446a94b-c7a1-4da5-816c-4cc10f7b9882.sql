-- Fix employee_services RLS policies to allow owners to manage all employee services regardless of their active status

-- Drop existing policies
DROP POLICY IF EXISTS "Company admins can manage employee services" ON employee_services;

-- Create new policy that allows owners to manage employee services even when inactive
CREATE POLICY "Company owners can manage all employee services" 
ON employee_services 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 
    FROM employees e 
    WHERE e.id = employee_services.employee_id 
      AND EXISTS (
        SELECT 1 
        FROM employees owner 
        WHERE owner.company_id = e.company_id 
          AND owner.user_id = auth.uid() 
          AND owner.role = 'owner'
      )
  )
);

-- Create policy for active managers to manage employee services in their company
CREATE POLICY "Active company managers can manage employee services" 
ON employee_services 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 
    FROM employees e 
    WHERE e.id = employee_services.employee_id 
      AND is_company_admin(e.company_id, auth.uid())
  )
);