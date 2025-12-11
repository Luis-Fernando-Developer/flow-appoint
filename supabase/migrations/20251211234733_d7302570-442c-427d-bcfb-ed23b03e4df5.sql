-- Allow clients to update their own bookings (for reschedule)
CREATE POLICY "Clients can update their own bookings"
ON public.bookings
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM clients c
    WHERE c.id = bookings.client_id
    AND c.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM clients c
    WHERE c.id = bookings.client_id
    AND c.user_id = auth.uid()
  )
);

-- Allow clients to cancel their own bookings (update status to cancelled)
-- This is covered by the above policy