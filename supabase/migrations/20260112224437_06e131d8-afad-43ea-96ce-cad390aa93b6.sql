-- Fix search_path for release_user_visions function
CREATE OR REPLACE FUNCTION public.release_user_visions(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  released_count INTEGER;
BEGIN
  -- Cancel any active listings for this user's visions
  UPDATE visualization_listings
  SET status = 'cancelled', updated_at = now()
  WHERE seller_id = p_user_id AND status = 'active';
  
  -- Set visualizations to have NULL user_id (orphaned/claimable)
  UPDATE saved_visualizations
  SET user_id = NULL, updated_at = now()
  WHERE user_id = p_user_id;
  
  GET DIAGNOSTICS released_count = ROW_COUNT;
  
  RETURN released_count;
END;
$$;