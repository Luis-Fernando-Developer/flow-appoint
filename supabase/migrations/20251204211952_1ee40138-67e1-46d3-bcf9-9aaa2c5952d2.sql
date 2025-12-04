-- Drop the current policy
DROP POLICY IF EXISTS "Company members can manage flows" ON public.chatbot_flows;

-- Create separate policies for better control
-- SELECT: company members can view
CREATE POLICY "Company members can view flows"
ON public.chatbot_flows
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.employees e
    WHERE e.company_id = chatbot_flows.company_id
    AND e.user_id = auth.uid()
  )
);

-- INSERT: any employee of the company can create (regardless of is_active)
CREATE POLICY "Company employees can create flows"
ON public.chatbot_flows
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.employees e
    WHERE e.company_id = chatbot_flows.company_id
    AND e.user_id = auth.uid()
  )
);

-- UPDATE: any employee of the company can update
CREATE POLICY "Company employees can update flows"
ON public.chatbot_flows
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.employees e
    WHERE e.company_id = chatbot_flows.company_id
    AND e.user_id = auth.uid()
  )
);

-- DELETE: any employee of the company can delete
CREATE POLICY "Company employees can delete flows"
ON public.chatbot_flows
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.employees e
    WHERE e.company_id = chatbot_flows.company_id
    AND e.user_id = auth.uid()
  )
);