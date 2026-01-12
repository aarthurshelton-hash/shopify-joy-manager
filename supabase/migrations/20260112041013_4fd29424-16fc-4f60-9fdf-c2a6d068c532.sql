-- Add RLS policy for profiles to be visible for marketplace sellers
-- This allows buyers to see seller names in the marketplace

CREATE POLICY "Profiles visible for marketplace sellers"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM visualization_listings vl
    WHERE vl.seller_id = profiles.user_id
    AND vl.status = 'active'
  )
);

-- Also add policy for bought listings (so buyer can see who sold to them)
CREATE POLICY "Profiles visible for listing participants"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM visualization_listings vl
    WHERE (vl.seller_id = profiles.user_id OR vl.buyer_id = profiles.user_id)
    AND (vl.seller_id = auth.uid() OR vl.buyer_id = auth.uid())
  )
);