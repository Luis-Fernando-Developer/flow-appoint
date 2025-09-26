-- Add logo fields to company_customizations table
ALTER TABLE public.company_customizations 
ADD COLUMN logo_type text DEFAULT 'url',
ADD COLUMN logo_url text,
ADD COLUMN logo_upload_path text;

-- Create storage bucket for company logos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('company-logos', 'company-logos', true);

-- Create RLS policies for company logos bucket
CREATE POLICY "Company admins can upload logos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'company-logos' 
  AND EXISTS (
    SELECT 1 FROM employees e
    WHERE e.user_id = auth.uid() 
    AND e.role IN ('owner', 'manager')
    AND e.is_active = true
  )
);

CREATE POLICY "Company admins can update logos" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'company-logos' 
  AND EXISTS (
    SELECT 1 FROM employees e
    WHERE e.user_id = auth.uid() 
    AND e.role IN ('owner', 'manager')
    AND e.is_active = true
  )
);

CREATE POLICY "Company admins can delete logos" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'company-logos' 
  AND EXISTS (
    SELECT 1 FROM employees e
    WHERE e.user_id = auth.uid() 
    AND e.role IN ('owner', 'manager')
    AND e.is_active = true
  )
);

CREATE POLICY "Anyone can view company logos" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'company-logos');