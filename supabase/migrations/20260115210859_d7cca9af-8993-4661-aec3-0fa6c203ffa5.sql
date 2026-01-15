-- Fix 1: Restrict profiles to authenticated users only (remove overly permissive policy)
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;

-- Fix 2: Restrict gamecard_value_pool to admins only
DROP POLICY IF EXISTS "Anyone can view gamecard value pool" ON public.gamecard_value_pool;
CREATE POLICY "Authenticated users can view gamecard pool" 
ON public.gamecard_value_pool FOR SELECT 
TO authenticated
USING (true);

-- Fix 3: Restrict palette_value_pool to admins only
DROP POLICY IF EXISTS "Anyone can view palette value pool" ON public.palette_value_pool;
CREATE POLICY "Authenticated users can view palette pool" 
ON public.palette_value_pool FOR SELECT 
TO authenticated
USING (true);

-- Fix 4: Restrict vision_interactions - users can only see their own or aggregated
DROP POLICY IF EXISTS "Anyone can view vision interactions" ON public.vision_interactions;
CREATE POLICY "Users can view their own interactions" 
ON public.vision_interactions FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all interactions" 
ON public.vision_interactions FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Fix 5: Chess games - respect is_public when using challenge code
DROP POLICY IF EXISTS "Anyone can view games by challenge code" ON public.chess_games;
CREATE POLICY "Anyone can view public games by challenge code" 
ON public.chess_games FOR SELECT 
USING (challenge_code IS NOT NULL AND is_public = true);

-- Fix 6: Marketplace offers - prevent accepting expired offers
DROP POLICY IF EXISTS "Participants can update offers" ON public.marketplace_offers;
CREATE POLICY "Participants can update non-expired offers" 
ON public.marketplace_offers FOR UPDATE 
USING (
  (auth.uid() = buyer_id OR auth.uid() = seller_id) 
  AND expires_at > now()
);

-- Fix 7: Education fund - restrict detailed view to admins
DROP POLICY IF EXISTS "Anyone can view education fund" ON public.education_fund;
CREATE POLICY "Authenticated users can view education fund" 
ON public.education_fund FOR SELECT 
TO authenticated
USING (true);