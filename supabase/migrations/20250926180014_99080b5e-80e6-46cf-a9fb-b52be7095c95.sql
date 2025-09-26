-- Fix infinite recursion in employees table RLS policies
-- Drop all existing policies that cause recursion
DROP POLICY IF EXISTS "Allow insert for new company owners" ON public.employees;
DROP POLICY IF EXISTS "Company admins can manage employees" ON public.employees;
DROP POLICY IF EXISTS "Company clients can view active employees" ON public.employees;
DROP POLICY IF EXISTS "Employees can view own data and company members" ON public.employees;

-- Create simple, non-recursive policies
-- Users can view and update their own employee record
CREATE POLICY "Users can view their own employee record" ON public.employees
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own employee record" ON public.employees  
FOR UPDATE USING (auth.uid() = user_id);

-- Allow authenticated users to view active employees (for client booking)
CREATE POLICY "Anyone can view active employees" ON public.employees
FOR SELECT USING (is_active = true);

-- Allow owners to insert new company employees
CREATE POLICY "Company owners can insert employees" ON public.employees
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.employees existing
    WHERE existing.company_id = employees.company_id
    AND existing.user_id = auth.uid()
    AND existing.role = 'owner'
    AND existing.is_active = true
  )
  OR 
  -- Allow first owner to be created
  (role = 'owner' AND NOT EXISTS (
    SELECT 1 FROM public.employees existing
    WHERE existing.company_id = employees.company_id
    AND existing.role = 'owner'
  ))
);

-- Allow owners to manage all employees in their company
CREATE POLICY "Company owners can manage employees" ON public.employees
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.employees owner
    WHERE owner.company_id = employees.company_id
    AND owner.user_id = auth.uid()
    AND owner.role = 'owner'
    AND owner.is_active = true
  )
);