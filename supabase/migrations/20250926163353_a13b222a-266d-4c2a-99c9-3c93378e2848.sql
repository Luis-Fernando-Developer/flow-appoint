-- First, let's add a policy that allows authenticated users to insert their own client records
-- when they are not already a client of any company
CREATE POLICY "Allow authenticated users to create their own client profile" 
ON public.clients 
FOR INSERT 
TO authenticated
WITH CHECK (
  auth.uid() = user_id AND
  NOT EXISTS (
    SELECT 1 FROM public.clients c2 
    WHERE c2.user_id = auth.uid() AND c2.company_id = clients.company_id
  )
);

-- Also update our function to be more robust
CREATE OR REPLACE FUNCTION public.create_client_profile(
  _company_slug text,
  _name text,
  _email text,
  _phone text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company_id uuid;
  v_client_id uuid;
  v_user_id uuid := auth.uid();
BEGIN
  -- Require authenticated user
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Resolve active company by slug
  SELECT id INTO v_company_id
  FROM companies
  WHERE slug = _company_slug AND status = 'active'
  LIMIT 1;

  IF v_company_id IS NULL THEN
    RAISE EXCEPTION 'Company not found or inactive';
  END IF;

  -- Check if client already exists for this user and company
  SELECT id INTO v_client_id
  FROM clients
  WHERE company_id = v_company_id AND user_id = v_user_id
  LIMIT 1;

  IF v_client_id IS NOT NULL THEN
    -- Update existing client
    UPDATE clients
    SET name = COALESCE(NULLIF(_name, ''), name),
        email = COALESCE(NULLIF(_email, ''), email),
        phone = COALESCE(NULLIF(_phone, ''), phone),
        updated_at = now()
    WHERE id = v_client_id;

    RETURN v_client_id;
  END IF;

  -- Insert new client profile
  INSERT INTO clients (company_id, user_id, name, email, phone)
  VALUES (
    v_company_id,
    v_user_id,
    COALESCE(NULLIF(_name, ''), COALESCE(NULLIF(_email, ''), '')), 
    COALESCE(NULLIF(_email, ''), ''),
    NULLIF(_phone, '')
  )
  RETURNING id INTO v_client_id;

  RETURN v_client_id;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error creating client profile: %', SQLERRM;
END;
$$;