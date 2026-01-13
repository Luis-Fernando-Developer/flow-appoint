-- Create companies table
CREATE TABLE IF NOT EXISTS public.companies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  owner_name TEXT,
  owner_email TEXT,
  owner_phone TEXT,
  address TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create subscription_plans table
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  monthly_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  quarterly_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  annual_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  features JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create company_subscriptions table
CREATE TABLE IF NOT EXISTS public.company_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.subscription_plans(id),
  billing_period TEXT NOT NULL DEFAULT 'monthly',
  original_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  discount_percentage DECIMAL(5,2) DEFAULT 0,
  discount_cycles_remaining INTEGER DEFAULT 0,
  discount_reason TEXT,
  status TEXT DEFAULT 'active',
  starts_at TIMESTAMPTZ DEFAULT now(),
  ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create company_customizations table
CREATE TABLE IF NOT EXISTS public.company_customizations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  logo_type TEXT DEFAULT 'none',
  logo_url TEXT,
  logo_upload_path TEXT,
  primary_color TEXT,
  secondary_color TEXT,
  theme JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add foreign key from chatbot_flows to companies
ALTER TABLE public.chatbot_flows 
  ADD CONSTRAINT chatbot_flows_company_id_fkey 
  FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_companies_slug ON public.companies(slug);
CREATE INDEX IF NOT EXISTS idx_companies_status ON public.companies(status);
CREATE INDEX IF NOT EXISTS idx_company_subscriptions_company_id ON public.company_subscriptions(company_id);
CREATE INDEX IF NOT EXISTS idx_company_customizations_company_id ON public.company_customizations(company_id);

-- Enable RLS
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_customizations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for companies
CREATE POLICY "Anyone can view companies" ON public.companies FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create companies" ON public.companies FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can update companies" ON public.companies FOR UPDATE USING (true);
CREATE POLICY "Authenticated users can delete companies" ON public.companies FOR DELETE USING (true);

-- RLS Policies for subscription_plans
CREATE POLICY "Anyone can view plans" ON public.subscription_plans FOR SELECT USING (true);
CREATE POLICY "Admins can manage plans" ON public.subscription_plans FOR ALL USING (true);

-- RLS Policies for company_subscriptions
CREATE POLICY "Anyone can view subscriptions" ON public.company_subscriptions FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage subscriptions" ON public.company_subscriptions FOR ALL USING (true);

-- RLS Policies for company_customizations
CREATE POLICY "Anyone can view customizations" ON public.company_customizations FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage customizations" ON public.company_customizations FOR ALL USING (true);

-- Update triggers
CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_chatbot_updated_at();

CREATE TRIGGER update_subscription_plans_updated_at
  BEFORE UPDATE ON public.subscription_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_chatbot_updated_at();

CREATE TRIGGER update_company_subscriptions_updated_at
  BEFORE UPDATE ON public.company_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_chatbot_updated_at();

CREATE TRIGGER update_company_customizations_updated_at
  BEFORE UPDATE ON public.company_customizations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_chatbot_updated_at();