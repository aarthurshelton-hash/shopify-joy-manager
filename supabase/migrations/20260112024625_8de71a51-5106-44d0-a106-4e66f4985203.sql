
-- Drop the overly permissive INSERT policy
DROP POLICY IF EXISTS "System can insert interactions via function" ON public.vision_interactions;

-- Create a more restrictive policy - only allow inserts from authenticated users or via the security definer function
-- The record_vision_interaction function is SECURITY DEFINER, so it bypasses RLS
-- We still need a policy for edge function service role access
CREATE POLICY "Service role can insert interactions"
ON public.vision_interactions
FOR INSERT
WITH CHECK (
  -- Allow authenticated users to record their own interactions
  (auth.uid() IS NOT NULL AND user_id = auth.uid())
  OR
  -- Allow anonymous interactions (user_id is null) - these are rate-limited by IP in the function
  (user_id IS NULL)
);
