-- Fix recursive RLS on employees and allow proper owner/admin access

-- 1) Ensure RLS is enabled (idempotent)
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

-- 2) Drop problematic recursive policies if they exist
DROP POLICY IF EXISTS "Company owners can manage employees" ON public.employees;
DROP POLICY IF EXISTS "Company owners can insert employees" ON public.employees;

-- 3) Helper function to check if a company already has an owner (SECURITY DEFINER to avoid RLS recursion)
CREATE OR REPLACE FUNCTION public.company_has_owner(_company_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.employees e
    WHERE e.company_id = _company_id
      AND e.role = 'owner'::employee_role
      AND e.is_active = true
  );
$$;

-- 4) New, non-recursive policy that leverages security definer functions
--    This grants full management to admins (owner/manager) and allows first owner creation
CREATE POLICY "Company admins can manage employees"
ON public.employees
FOR ALL
TO authenticated
USING (
  public.is_company_admin(company_id, auth.uid())
)
WITH CHECK (
  public.is_company_admin(company_id, auth.uid())
  OR (
    role = 'owner'::employee_role
    AND NOT public.company_has_owner(company_id)
  )
);

-- Keep existing safe policies (they should already exist):
-- - "Anyone can view active employees" (SELECT USING is_active = true)
-- - "Users can update their own employee record" (UPDATE USING auth.uid() = user_id)
-- - "Users can view their own employee record" (SELECT USING auth.uid() = user_id)

-- 5) Optional: revalidate privileges (no-op but documents intent)
COMMENT ON POLICY "Company admins can manage employees" ON public.employees IS
  'Uses security definer functions to avoid recursion. Admins manage all; allows first owner insert when none exists.';
