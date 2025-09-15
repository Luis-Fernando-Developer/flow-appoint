-- Create company_customization table to store landing page customizations
CREATE TABLE public.company_customizations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  
  -- Header customization
  header_position TEXT DEFAULT 'fixed',
  header_background_type TEXT DEFAULT 'solid',
  header_background_color TEXT DEFAULT 'hsl(251, 91%, 65%)',
  header_background_gradient JSONB DEFAULT '{"type": "linear", "angle": 45, "colors": ["hsl(251, 91%, 65%)", "hsl(308, 56%, 85%)"]}',
  
  -- Font customization
  font_family TEXT DEFAULT 'Inter',
  font_size_base INTEGER DEFAULT 16,
  font_color_type TEXT DEFAULT 'solid',
  font_color TEXT DEFAULT 'hsl(240, 10%, 3.9%)',
  font_gradient JSONB DEFAULT '{"type": "linear", "angle": 45, "colors": ["hsl(240, 10%, 3.9%)", "hsl(251, 91%, 65%)"]}',
  
  -- Hero customization
  hero_banner_type TEXT DEFAULT 'single',
  hero_banner_urls TEXT[] DEFAULT ARRAY[]::TEXT[],
  hero_background_type TEXT DEFAULT 'gradient',
  hero_background_color TEXT DEFAULT 'hsl(240, 10%, 3.9%)',
  hero_background_gradient JSONB DEFAULT '{"type": "linear", "angle": 135, "colors": ["hsl(251, 91%, 65%)", "hsl(308, 56%, 85%)", "hsl(240, 10%, 3.9%)"]}',
  hero_title TEXT DEFAULT 'Agendamentos Inteligentes',
  hero_description TEXT DEFAULT 'Transforme a gestão do seu negócio com nossa plataforma completa de agendamentos online.',
  
  -- Cards customization
  cards_show_images BOOLEAN DEFAULT false,
  cards_layout TEXT DEFAULT 'vertical',
  cards_font_family TEXT DEFAULT 'Inter',
  cards_color_type TEXT DEFAULT 'solid',
  cards_color TEXT DEFAULT 'hsl(240, 10%, 3.9%)',
  cards_gradient JSONB DEFAULT '{"type": "linear", "angle": 45, "colors": ["hsl(240, 10%, 3.9%)", "hsl(251, 91%, 65%)"]}',
  
  -- Extra section
  extra_section_enabled BOOLEAN DEFAULT false,
  extra_section_code TEXT DEFAULT '',
  
  -- Footer customization
  footer_background_type TEXT DEFAULT 'gradient',
  footer_background_color TEXT DEFAULT 'hsl(240, 10%, 3.9%)',
  footer_background_gradient JSONB DEFAULT '{"type": "linear", "angle": 180, "colors": ["hsl(240, 10%, 3.9%)", "hsl(251, 91%, 65%)"]}',
  footer_font_family TEXT DEFAULT 'Inter',
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE public.company_customizations ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Company members can view customizations" 
ON public.company_customizations 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.employees e 
    WHERE e.company_id = company_customizations.company_id 
    AND e.user_id = auth.uid()
  )
);

CREATE POLICY "Company admins can manage customizations" 
ON public.company_customizations 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.employees e 
    WHERE e.company_id = company_customizations.company_id 
    AND e.user_id = auth.uid() 
    AND e.role IN ('owner', 'manager')
  )
);

-- Add trigger for updated_at
CREATE TRIGGER update_company_customizations_updated_at
BEFORE UPDATE ON public.company_customizations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();