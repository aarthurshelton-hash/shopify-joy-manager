-- Drop the overly permissive INSERT policy
DROP POLICY IF EXISTS "Users can submit counter-notifications" ON public.dmca_counter_notifications;

-- Create a more secure INSERT policy that requires the user_id to match if authenticated
CREATE POLICY "Anyone can submit counter-notifications"
ON public.dmca_counter_notifications
FOR INSERT
WITH CHECK (
  -- If user is authenticated, user_id must match their id or be null
  (auth.uid() IS NULL) OR (user_id IS NULL) OR (auth.uid() = user_id)
);