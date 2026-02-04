-- Ensure table exists first
CREATE TABLE IF NOT EXISTS public.membership_funnel_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  session_id TEXT,
  ip_hash TEXT,
  metadata JSONB,
  trigger_source TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Remove the overly permissive INSERT policy
DROP POLICY IF EXISTS "Anyone can insert funnel events" ON membership_funnel_events;

-- Add a comment documenting that inserts now go through the track-funnel-event edge function
COMMENT ON TABLE membership_funnel_events IS 'Marketing funnel analytics. Inserts are restricted to service role via track-funnel-event edge function for rate limiting and validation.';