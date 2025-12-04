-- Drop the restrictive admin-only policy
DROP POLICY IF EXISTS "Company admins can manage flows" ON public.chatbot_flows;

-- Create a new policy that allows company members to manage flows
CREATE POLICY "Company members can manage flows"
ON public.chatbot_flows
FOR ALL
USING (public.is_company_member(company_id, auth.uid()))
WITH CHECK (public.is_company_member(company_id, auth.uid()));