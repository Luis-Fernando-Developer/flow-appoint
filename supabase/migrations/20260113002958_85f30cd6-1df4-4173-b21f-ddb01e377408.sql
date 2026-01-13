-- Force PostgREST to reload its schema cache
NOTIFY pgrst, 'reload schema';

-- Ensure the chatbot_flows table has proper constraints
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'chatbot_flows_company_id_fkey'
    AND table_name = 'chatbot_flows'
  ) THEN
    ALTER TABLE public.chatbot_flows 
    ADD CONSTRAINT chatbot_flows_company_id_fkey 
    FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Update comments to force schema change detection
COMMENT ON COLUMN public.chatbot_flows.is_published IS 'Indicates if the chatbot flow is publicly accessible';
COMMENT ON COLUMN public.chatbot_flows.published_at IS 'Timestamp when the flow was last published';
COMMENT ON COLUMN public.chatbot_flows.published_containers IS 'Snapshot of containers at publish time';
COMMENT ON COLUMN public.chatbot_flows.published_edges IS 'Snapshot of edges at publish time';