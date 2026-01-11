-- Remove the overly permissive profiles policy that allows viewing based on shared visualizations
-- The VisualizationView page doesn't actually need profile data - it only shows game info
DROP POLICY IF EXISTS "Profiles visible for shared visualization creators" ON public.profiles;

-- Restore simple owner-only access (users can only view their own profile)
-- Note: "Users can view their own profile" policy already exists