-- Add button color customization columns
ALTER TABLE public.company_customizations
ADD COLUMN IF NOT EXISTS button_color_type text DEFAULT 'solid',
ADD COLUMN IF NOT EXISTS button_color text DEFAULT 'hsl(251, 91%, 65%)',
ADD COLUMN IF NOT EXISTS button_gradient jsonb DEFAULT '{"type": "linear", "angle": 45, "colors": ["hsl(251, 91%, 65%)", "hsl(308, 56%, 85%)"]}'::jsonb;

-- Add hero content positioning column
ALTER TABLE public.company_customizations
ADD COLUMN IF NOT EXISTS hero_content_position text DEFAULT 'absolute';

-- Add comments for documentation
COMMENT ON COLUMN public.company_customizations.button_color_type IS 'Button color type: solid or gradient';
COMMENT ON COLUMN public.company_customizations.button_color IS 'Solid color for buttons in HSL format';
COMMENT ON COLUMN public.company_customizations.button_gradient IS 'Gradient settings for buttons';
COMMENT ON COLUMN public.company_customizations.hero_content_position IS 'Hero content position: absolute (over image), below (under image), or above (before image)';