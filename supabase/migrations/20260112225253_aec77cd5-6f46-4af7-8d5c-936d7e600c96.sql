-- Fix overly permissive INSERT policy - only service role should insert
DROP POLICY IF EXISTS "Service role can insert notifications" ON public.subscription_notifications;

-- No user-facing INSERT policy needed - notifications are created by edge functions using service role