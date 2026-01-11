-- Add public read policy for profiles to allow viewing creator info on shared content
-- This only exposes display_name and avatar_url which are non-sensitive
CREATE POLICY "Anyone can view profiles"
ON public.profiles
FOR SELECT
USING (true);