-- Tabela de integração com o builder externo (TalkMap)
CREATE TABLE public.chatbot_integration (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL UNIQUE,
  api_key_encrypted text NOT NULL,
  api_key_prefix text NOT NULL,
  builder_workspace_slug text,
  builder_user_id text,
  builder_base_url text DEFAULT 'https://talkbuilder.lovable.app',
  connected_at timestamptz NOT NULL DEFAULT now(),
  last_validated_at timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.chatbot_integration ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view chatbot_integration"
  ON public.chatbot_integration FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage chatbot_integration"
  ON public.chatbot_integration FOR ALL USING (true) WITH CHECK (true);

-- Trigger de updated_at (reaproveita a função já existente)
CREATE TRIGGER update_chatbot_integration_updated_at
  BEFORE UPDATE ON public.chatbot_integration
  FOR EACH ROW
  EXECUTE FUNCTION public.update_chatbot_updated_at();

-- Index pra lookups rápidos
CREATE INDEX idx_chatbot_integration_company ON public.chatbot_integration(company_id);
CREATE INDEX idx_chatbot_integration_prefix ON public.chatbot_integration(api_key_prefix);

-- Adiciona a feature flag chatbot=true nos planos existentes (preservando outras features)
UPDATE public.subscription_plans
   SET features = CASE
     WHEN jsonb_typeof(features) = 'object' THEN features || '{"chatbot": true}'::jsonb
     WHEN jsonb_typeof(features) = 'array'  THEN jsonb_build_object('chatbot', true, 'list', features)
     ELSE '{"chatbot": true}'::jsonb
   END;