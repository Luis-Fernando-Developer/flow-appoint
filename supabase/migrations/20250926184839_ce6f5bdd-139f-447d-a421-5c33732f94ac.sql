-- Fix company_customizations RLS to allow public access to landing pages
-- Landing pages should be visible to everyone, not just company employees

-- Drop the restrictive policy
DROP POLICY IF EXISTS "Company members can view customizations" ON public.company_customizations;

-- Create a new policy that allows anyone to view customizations for active companies
CREATE POLICY "Anyone can view customizations for active companies"
ON public.company_customizations
FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1
    FROM public.companies c
    WHERE c.id = company_customizations.company_id
      AND c.status = 'active'
  )
);

-- Keep the admin management policy unchanged
-- "Company admins can manage customizations" should already exist