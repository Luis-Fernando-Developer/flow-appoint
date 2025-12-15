-- Tabela de configuração de planos (gerenciada pelo super-admin)
CREATE TABLE subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  features JSONB DEFAULT '[]'::jsonb,
  monthly_price DECIMAL(10,2) NOT NULL,
  quarterly_price DECIMAL(10,2) NOT NULL,
  annual_price DECIMAL(10,2) NOT NULL,
  monthly_checkout_url TEXT,
  quarterly_checkout_url TEXT,
  annual_checkout_url TEXT,
  is_popular BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de assinaturas das empresas (com desconto especial)
CREATE TABLE company_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES subscription_plans(id),
  billing_period TEXT NOT NULL,
  original_price DECIMAL(10,2) NOT NULL,
  discount_percentage DECIMAL(5,2) DEFAULT 0,
  discounted_price DECIMAL(10,2),
  discount_cycles_remaining INTEGER DEFAULT 0,
  next_billing_date DATE,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de combos de serviços
CREATE TABLE service_combos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  combo_price DECIMAL(10,2) NOT NULL,
  original_total_price DECIMAL(10,2),
  total_duration_minutes INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Itens do combo
CREATE TABLE service_combo_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  combo_id UUID REFERENCES service_combos(id) ON DELETE CASCADE,
  service_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de recompensas/brindes
CREATE TABLE client_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  reward_service_id UUID,
  required_procedures INTEGER NOT NULL DEFAULT 10,
  count_specific_service BOOLEAN DEFAULT false,
  specific_service_id UUID,
  requires_payment_confirmed BOOLEAN DEFAULT true,
  requires_completed_booking BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Estrutura de formas de pagamento do cliente
CREATE TABLE client_payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL,
  payment_type TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  card_last_four TEXT,
  card_brand TEXT,
  pix_key TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Adicionar coluna de método de pagamento em bookings
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'cash';

-- RLS para subscription_plans (público para leitura)
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active plans" ON subscription_plans FOR SELECT USING (is_active = true);
CREATE POLICY "Super admins can manage plans" ON subscription_plans FOR ALL USING (true);

-- RLS para company_subscriptions
ALTER TABLE company_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Company members can view their subscription" ON company_subscriptions FOR SELECT USING (
  EXISTS (SELECT 1 FROM employees e WHERE e.company_id = company_subscriptions.company_id AND e.user_id = auth.uid())
);
CREATE POLICY "Super admins can manage subscriptions" ON company_subscriptions FOR ALL USING (true);

-- RLS para service_combos
ALTER TABLE service_combos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active combos" ON service_combos FOR SELECT USING (is_active = true);
CREATE POLICY "Company admins can manage combos" ON service_combos FOR ALL USING (
  EXISTS (SELECT 1 FROM employees e WHERE e.company_id = service_combos.company_id AND e.user_id = auth.uid() AND e.role IN ('owner', 'manager'))
);

-- RLS para service_combo_items
ALTER TABLE service_combo_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view combo items" ON service_combo_items FOR SELECT USING (true);
CREATE POLICY "Company admins can manage combo items" ON service_combo_items FOR ALL USING (
  EXISTS (SELECT 1 FROM service_combos sc JOIN employees e ON e.company_id = sc.company_id WHERE sc.id = service_combo_items.combo_id AND e.user_id = auth.uid() AND e.role IN ('owner', 'manager'))
);

-- RLS para client_rewards
ALTER TABLE client_rewards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active rewards" ON client_rewards FOR SELECT USING (is_active = true);
CREATE POLICY "Company admins can manage rewards" ON client_rewards FOR ALL USING (
  EXISTS (SELECT 1 FROM employees e WHERE e.company_id = client_rewards.company_id AND e.user_id = auth.uid() AND e.role IN ('owner', 'manager'))
);

-- RLS para client_payment_methods
ALTER TABLE client_payment_methods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Clients can view their own payment methods" ON client_payment_methods FOR SELECT USING (
  EXISTS (SELECT 1 FROM clients c WHERE c.id = client_payment_methods.client_id AND c.user_id = auth.uid())
);
CREATE POLICY "Clients can manage their own payment methods" ON client_payment_methods FOR ALL USING (
  EXISTS (SELECT 1 FROM clients c WHERE c.id = client_payment_methods.client_id AND c.user_id = auth.uid())
);

-- Inserir planos iniciais
INSERT INTO subscription_plans (name, description, features, monthly_price, quarterly_price, annual_price, is_popular, display_order) VALUES
('Starter', 'Ideal para quem está começando', '["Até 50 agendamentos/mês", "1 profissional", "Página personalizada", "Suporte por email"]', 29.00, 78.00, 290.00, false, 1),
('Professional', 'Para negócios em crescimento', '["Agendamentos ilimitados", "Até 5 profissionais", "Relatórios básicos", "Suporte prioritário", "Chatbot personalizado"]', 59.00, 159.00, 590.00, true, 2),
('Enterprise', 'Para grandes estabelecimentos', '["Tudo do Professional", "Profissionais ilimitados", "Relatórios avançados", "API de integração", "Suporte 24/7", "Gerente de conta dedicado"]', 99.00, 269.00, 990.00, false, 3);