-- Fix infinite recursion: replace self-referencing INSERT policy on clients
DROP POLICY IF EXISTS "Allow authenticated users to create their own client profile" ON public.clients;

-- Simpler INSERT policy without self-reference; uniqueness handled by unique index
CREATE POLICY "Authenticated users can insert their own client profile"
ON public.clients
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Ensure uniqueness of one client per (company, user)
CREATE UNIQUE INDEX IF NOT EXISTS clients_company_user_unique
ON public.clients (company_id, user_id)
WHERE user_id IS NOT NULL;