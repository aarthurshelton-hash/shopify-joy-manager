-- Drop the overly permissive public profiles policy
DROP POLICY IF EXISTS "Anyone can view profiles" ON public.profiles;

-- Add targeted policy: only expose profiles for users who have shared visualizations
CREATE POLICY "Profiles visible for shared visualization creators"
ON public.profiles
FOR SELECT
USING (
  -- Owner can always view their own profile
  auth.uid() = user_id
  OR
  -- Only expose profiles of users who have publicly shared content
  user_id IN (
    SELECT user_id FROM public.saved_visualizations 
    WHERE public_share_id IS NOT NULL
  )
);