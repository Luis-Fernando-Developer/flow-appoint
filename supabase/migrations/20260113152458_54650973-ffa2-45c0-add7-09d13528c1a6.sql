-- Create unique partial index to ensure no duplicate public_id within the same company
-- This allows different companies to have the same public_id, but prevents duplicates within a company
CREATE UNIQUE INDEX idx_unique_public_id_per_company 
ON public.chatbot_flows (company_id, public_id) 
WHERE public_id IS NOT NULL;