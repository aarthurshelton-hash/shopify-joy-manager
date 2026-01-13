-- Fix 1: Restrict profiles table to authenticated users only
-- Drop overly permissive public policies

DROP POLICY IF EXISTS "Profiles are publicly readable" ON public.profiles;
DROP POLICY IF EXISTS "Profiles visible for chess game participants" ON public.profiles;
DROP POLICY IF EXISTS "Profiles visible for marketplace listings" ON public.profiles;
DROP POLICY IF EXISTS "Profiles visible for shared visualization creators" ON public.profiles;
DROP POLICY IF EXISTS "Anyone can view profiles" ON public.profiles;

-- Create restricted policies requiring authentication
CREATE POLICY "Authenticated users can view profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Fix 2: Anonymize precise location data
-- Remove precise coordinates, keep only country/region for analytics

-- First, null out existing precise coordinates
UPDATE public.user_location_analytics
SET latitude = NULL, longitude = NULL;

-- Add a comment explaining the data retention policy
COMMENT ON TABLE public.user_location_analytics IS 'Location analytics with anonymized data. Precise lat/long removed for privacy. Only country/region/city retained for aggregate analytics.';

-- Drop existing permissive policies for users inserting their own data
DROP POLICY IF EXISTS "Users can insert own location" ON public.user_location_analytics;
DROP POLICY IF EXISTS "Users can update own location" ON public.user_location_analytics;

-- Create restricted insert policy - only allow country/region level data, no coordinates
CREATE POLICY "Users can insert anonymized location only"
ON public.user_location_analytics
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND latitude IS NULL
  AND longitude IS NULL
);

-- Create restricted update policy - cannot add coordinates
CREATE POLICY "Users can update own location without coordinates"
ON public.user_location_analytics
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id
  AND latitude IS NULL
  AND longitude IS NULL
);