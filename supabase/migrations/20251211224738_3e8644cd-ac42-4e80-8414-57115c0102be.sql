-- Add new columns to clients table for profile and LGPD compliance
ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS cpf TEXT,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS state TEXT,
ADD COLUMN IF NOT EXISTS zip_code TEXT,
ADD COLUMN IF NOT EXISTS accepts_marketing BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS data_deleted_at TIMESTAMP WITH TIME ZONE;

-- Create index for CPF lookups
CREATE INDEX IF NOT EXISTS idx_clients_cpf ON public.clients(cpf) WHERE cpf IS NOT NULL;

-- Update RLS policy to allow clients to update their own profile
CREATE POLICY "Clients can update their own profile" 
ON public.clients 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);