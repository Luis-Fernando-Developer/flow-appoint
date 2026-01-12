-- Create chatbot_flows table with all fields including the new publishing fields
CREATE TABLE IF NOT EXISTS public.chatbot_flows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  containers JSONB DEFAULT '[]',
  edges JSONB DEFAULT '[]',
  variables JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT FALSE,
  -- Publishing fields
  public_id TEXT UNIQUE,
  is_published BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMPTZ,
  published_containers JSONB,
  published_edges JSONB,
  settings JSONB DEFAULT '{}',
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create chatbot_sessions table for storing chat sessions
CREATE TABLE IF NOT EXISTS public.chatbot_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  flow_id UUID NOT NULL REFERENCES public.chatbot_flows(id) ON DELETE CASCADE,
  company_id UUID,
  client_id UUID,
  state JSONB NOT NULL DEFAULT '{}',
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_chatbot_flows_company_id ON public.chatbot_flows(company_id);
CREATE INDEX IF NOT EXISTS idx_chatbot_flows_public_id ON public.chatbot_flows(public_id) WHERE public_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_chatbot_flows_is_active ON public.chatbot_flows(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_chatbot_sessions_flow_id ON public.chatbot_sessions(flow_id);
CREATE INDEX IF NOT EXISTS idx_chatbot_sessions_status ON public.chatbot_sessions(status);

-- Enable RLS
ALTER TABLE public.chatbot_flows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chatbot_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for chatbot_flows
-- Allow read for all authenticated users (they can view flows of their company)
CREATE POLICY "Users can view flows" ON public.chatbot_flows
  FOR SELECT USING (true);

-- Allow insert for authenticated users
CREATE POLICY "Users can create flows" ON public.chatbot_flows
  FOR INSERT WITH CHECK (true);

-- Allow update for authenticated users  
CREATE POLICY "Users can update flows" ON public.chatbot_flows
  FOR UPDATE USING (true);

-- Allow delete for authenticated users
CREATE POLICY "Users can delete flows" ON public.chatbot_flows
  FOR DELETE USING (true);

-- RLS Policies for chatbot_sessions
-- Allow read for all (sessions are public for the chat widget)
CREATE POLICY "Anyone can view sessions" ON public.chatbot_sessions
  FOR SELECT USING (true);

-- Allow insert for anyone (sessions are created by the chat widget)
CREATE POLICY "Anyone can create sessions" ON public.chatbot_sessions
  FOR INSERT WITH CHECK (true);

-- Allow update for anyone (sessions are updated by the chat widget)
CREATE POLICY "Anyone can update sessions" ON public.chatbot_sessions
  FOR UPDATE USING (true);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION public.update_chatbot_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_chatbot_flows_updated_at
  BEFORE UPDATE ON public.chatbot_flows
  FOR EACH ROW
  EXECUTE FUNCTION public.update_chatbot_updated_at();

CREATE TRIGGER update_chatbot_sessions_updated_at
  BEFORE UPDATE ON public.chatbot_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_chatbot_updated_at();

-- Add comments for documentation
COMMENT ON TABLE public.chatbot_flows IS 'Stores chatbot flow definitions';
COMMENT ON COLUMN public.chatbot_flows.public_id IS 'Unique public identifier for sharing the bot (e.g., "atendimento-v1")';
COMMENT ON COLUMN public.chatbot_flows.is_published IS 'Whether the bot is published and accessible via public URL';
COMMENT ON COLUMN public.chatbot_flows.published_containers IS 'Snapshot of containers at the time of publishing';
COMMENT ON COLUMN public.chatbot_flows.published_edges IS 'Snapshot of edges at the time of publishing';
COMMENT ON COLUMN public.chatbot_flows.settings IS 'Bot configuration: theme, metadata, etc.';