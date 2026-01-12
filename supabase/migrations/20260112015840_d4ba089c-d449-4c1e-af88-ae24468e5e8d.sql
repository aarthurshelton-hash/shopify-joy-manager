-- Fix security issues identified in the security scan

-- 1. Add RLS policy for admins to manage testimonials
CREATE POLICY "Admins can view all testimonials"
ON public.testimonials
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update testimonial status"
ON public.testimonials
FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

-- 2. Add policy for viewing profiles of game participants and shared visualization creators
CREATE POLICY "Profiles visible for shared visualization creators"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM saved_visualizations sv
    WHERE sv.user_id = profiles.user_id
    AND sv.public_share_id IS NOT NULL
  )
);

CREATE POLICY "Profiles visible for game opponents"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM chess_games cg
    WHERE (cg.white_player_id = profiles.user_id OR cg.black_player_id = profiles.user_id)
    AND (cg.white_player_id = auth.uid() OR cg.black_player_id = auth.uid())
  )
);

-- 3. Add policy for viewing moves in public/challenge games
CREATE POLICY "Anyone can view moves of public games"
ON public.chess_moves
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM chess_games cg
    WHERE cg.id = chess_moves.game_id
    AND (cg.is_public = true OR cg.challenge_code IS NOT NULL)
  )
);

-- 4. Fix marketplace purchase authorization gap
-- Allow authenticated users to purchase (update buyer_id) on active listings
CREATE POLICY "Buyers can complete purchases"
ON public.visualization_listings
FOR UPDATE
USING (
  status = 'active'
  AND buyer_id IS NULL
  AND auth.uid() IS NOT NULL
  AND auth.uid() != seller_id
)
WITH CHECK (
  buyer_id = auth.uid()
  AND status = 'sold'
);