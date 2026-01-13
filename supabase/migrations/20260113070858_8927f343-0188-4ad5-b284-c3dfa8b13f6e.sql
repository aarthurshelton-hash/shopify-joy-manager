-- Remove the overly permissive INSERT policy
DROP POLICY IF EXISTS "Anyone can insert funnel events" ON membership_funnel_events;

-- Add a comment documenting that inserts now go through the track-funnel-event edge function
COMMENT ON TABLE membership_funnel_events IS 'Marketing funnel analytics. Inserts are restricted to service role via track-funnel-event edge function for rate limiting and validation.';