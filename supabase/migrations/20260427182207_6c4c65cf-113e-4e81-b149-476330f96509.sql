CREATE OR REPLACE FUNCTION public.encrypt_chatbot_key(p_plain text, p_secret text)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
  SELECT encode(extensions.pgp_sym_encrypt(p_plain, p_secret), 'base64');
$$;

CREATE OR REPLACE FUNCTION public.decrypt_chatbot_key(p_cipher text, p_secret text)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
  SELECT extensions.pgp_sym_decrypt(decode(p_cipher, 'base64'), p_secret);
$$;

-- Restringe acesso direto destas funções via PostgREST: somente service_role pode chamar.
REVOKE ALL ON FUNCTION public.encrypt_chatbot_key(text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.decrypt_chatbot_key(text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.encrypt_chatbot_key(text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.decrypt_chatbot_key(text, text) TO service_role;