ALTER TABLE public.chatbot_integration
  ADD COLUMN IF NOT EXISTS talkmap_provisioned boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS talkmap_provisioned_at timestamptz NULL,
  ALTER COLUMN api_key_encrypted DROP NOT NULL,
  ALTER COLUMN api_key_prefix DROP NOT NULL,
  ALTER COLUMN is_active SET DEFAULT false;