-- Create a SECURITY DEFINER function to create or update a client profile safely
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

  -- If a client row already exists for this user and company, update basic fields
  SELECT id INTO v_client_id
  FROM clients
  WHERE company_id = v_company_id AND user_id = v_user_id
  LIMIT 1;

  IF v_client_id IS NOT NULL THEN
    UPDATE clients
    SET name = COALESCE(NULLIF(_name, ''), name),
        email = COALESCE(NULLIF(_email, ''), email),
        phone = COALESCE(NULLIF(_phone, ''), phone),
        updated_at = now()
    WHERE id = v_client_id;

    RETURN v_client_id;
  END IF;

  -- Insert new client profile, defaulting name to email when name is missing
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
END;
$$;

-- Ensure only authenticated users can execute it
GRANT EXECUTE ON FUNCTION public.create_client_profile(text, text, text, text) TO authenticated;