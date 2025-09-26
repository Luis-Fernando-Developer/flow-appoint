-- Allow company clients to view active employees
CREATE POLICY "Company clients can view active employees"
ON public.employees
AS PERMISSIVE
FOR SELECT
USING (
  is_active = true
  AND EXISTS (
    SELECT 1 FROM public.clients c
    WHERE c.company_id = employees.company_id
      AND c.user_id = auth.uid()
  )
);

-- Allow company clients to view employee-services mappings
CREATE POLICY "Company clients can view employee services"
ON public.employee_services
AS PERMISSIVE
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.employees e
    JOIN public.clients c
      ON c.company_id = e.company_id
     AND c.user_id = auth.uid()
    WHERE e.id = employee_services.employee_id
  )
);
