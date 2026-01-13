-- Add is_private column to saved_visualizations for public/private gallery sections
ALTER TABLE public.saved_visualizations 
ADD COLUMN IF NOT EXISTS is_private boolean NOT NULL DEFAULT false;

-- Add index for faster filtering by privacy status
CREATE INDEX IF NOT EXISTS idx_saved_visualizations_is_private ON public.saved_visualizations(user_id, is_private);

-- Update RLS policy to allow users to see public visualizations from other users
-- (They can already see their own, this extends to public ones from others)
DROP POLICY IF EXISTS "Anyone can view public visualizations" ON public.saved_visualizations;
CREATE POLICY "Anyone can view public visualizations" 
ON public.saved_visualizations 
FOR SELECT 
USING (
  is_private = false 
  OR user_id = auth.uid()
  OR public.has_role(auth.uid(), 'admin')
);

-- Create a function to check available palettes for a given game (PGN)
CREATE OR REPLACE FUNCTION public.get_available_palettes_for_game(p_pgn text)
RETURNS TABLE (
  palette_id text,
  is_taken boolean,
  owner_user_id uuid,
  owner_display_name text,
  visualization_id uuid,
  listing_price_cents integer
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  normalized_pgn text;
BEGIN
  -- Normalize the PGN for comparison
  normalized_pgn := lower(trim(regexp_replace(regexp_replace(p_pgn, '\{[^}]*\}', '', 'g'), '\s+', ' ', 'g')));
  
  -- Return palette availability info
  RETURN QUERY
  SELECT 
    COALESCE(
      (sv.game_data->'visualizationState'->>'paletteId')::text,
      'modern'
    ) as palette_id,
    true as is_taken,
    sv.user_id as owner_user_id,
    p.display_name as owner_display_name,
    sv.id as visualization_id,
    vl.price_cents as listing_price_cents
  FROM saved_visualizations sv
  LEFT JOIN profiles p ON p.user_id = sv.user_id
  LEFT JOIN visualization_listings vl ON vl.visualization_id = sv.id AND vl.status = 'active'
  WHERE lower(trim(regexp_replace(regexp_replace(COALESCE(sv.pgn, ''), '\{[^}]*\}', '', 'g'), '\s+', ' ', 'g'))) = normalized_pgn;
END;
$$;