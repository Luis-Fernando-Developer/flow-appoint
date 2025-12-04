-- Tabela para armazenar os fluxos de chatbot de cada empresa
CREATE TABLE public.chatbot_flows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Novo Fluxo',
  description TEXT,
  containers JSONB NOT NULL DEFAULT '[]'::jsonb,
  edges JSONB NOT NULL DEFAULT '[]'::jsonb,
  variables JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela para armazenar sessões de conversa dos clientes
CREATE TABLE public.chatbot_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  flow_id UUID NOT NULL REFERENCES public.chatbot_flows(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  current_container_id TEXT,
  variables JSONB NOT NULL DEFAULT '{}'::jsonb,
  messages JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.chatbot_flows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chatbot_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for chatbot_flows
CREATE POLICY "Company members can view their flows"
ON public.chatbot_flows
FOR SELECT
USING (public.is_company_member(company_id, auth.uid()));

CREATE POLICY "Company admins can manage flows"
ON public.chatbot_flows
FOR ALL
USING (public.is_company_admin(company_id, auth.uid()));

CREATE POLICY "Anyone can view active flows for active companies"
ON public.chatbot_flows
FOR SELECT
USING (
  is_active = true AND
  EXISTS (SELECT 1 FROM public.companies c WHERE c.id = company_id AND c.status = 'active')
);

-- RLS Policies for chatbot_sessions
CREATE POLICY "Company members can view sessions"
ON public.chatbot_sessions
FOR SELECT
USING (public.is_company_member(company_id, auth.uid()));

CREATE POLICY "Company members can manage sessions"
ON public.chatbot_sessions
FOR ALL
USING (public.is_company_member(company_id, auth.uid()));

CREATE POLICY "Clients can view their own sessions"
ON public.chatbot_sessions
FOR SELECT
USING (
  client_id IS NOT NULL AND
  EXISTS (SELECT 1 FROM public.clients c WHERE c.id = client_id AND c.user_id = auth.uid())
);

CREATE POLICY "Anyone can create sessions for active flows"
ON public.chatbot_sessions
FOR INSERT
WITH CHECK (
  EXISTS (SELECT 1 FROM public.chatbot_flows f WHERE f.id = flow_id AND f.is_active = true)
);

-- Indexes for better performance
CREATE INDEX idx_chatbot_flows_company_id ON public.chatbot_flows(company_id);
CREATE INDEX idx_chatbot_flows_is_active ON public.chatbot_flows(is_active);
CREATE INDEX idx_chatbot_sessions_company_id ON public.chatbot_sessions(company_id);
CREATE INDEX idx_chatbot_sessions_flow_id ON public.chatbot_sessions(flow_id);
CREATE INDEX idx_chatbot_sessions_client_id ON public.chatbot_sessions(client_id);
CREATE INDEX idx_chatbot_sessions_status ON public.chatbot_sessions(status);

-- Triggers for updated_at
CREATE TRIGGER update_chatbot_flows_updated_at
BEFORE UPDATE ON public.chatbot_flows
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_chatbot_sessions_updated_at
BEFORE UPDATE ON public.chatbot_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();