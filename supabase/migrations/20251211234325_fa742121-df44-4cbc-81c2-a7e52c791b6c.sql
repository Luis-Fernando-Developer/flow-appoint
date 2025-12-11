-- Create a function to auto-confirm pending bookings after 1 hour
CREATE OR REPLACE FUNCTION public.auto_confirm_pending_bookings()
RETURNS void
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  UPDATE public.bookings
  SET 
    booking_status = 'confirmed',
    updated_at = now()
  WHERE 
    booking_status = 'pending'
    AND created_at < now() - interval '1 hour';
    
  RAISE NOTICE 'Auto-confirmed pending bookings older than 1 hour';
END;
$$;

-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;

-- Grant usage to postgres
GRANT USAGE ON SCHEMA cron TO postgres;

-- Create the cron job to run every 5 minutes
SELECT cron.schedule(
  'auto-confirm-bookings',
  '*/5 * * * *', -- Every 5 minutes
  $$ SELECT public.auto_confirm_pending_bookings() $$
);