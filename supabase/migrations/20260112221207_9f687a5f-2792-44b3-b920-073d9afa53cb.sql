-- Add royalty tracking columns to vision_scores
ALTER TABLE public.vision_scores 
ADD COLUMN IF NOT EXISTS royalty_cents_earned integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS royalty_orders_count integer NOT NULL DEFAULT 0;

-- Update the record_vision_interaction function to track royalties for owners
CREATE OR REPLACE FUNCTION public.record_vision_interaction(
  p_visualization_id uuid, 
  p_user_id uuid, 
  p_interaction_type text, 
  p_value_cents integer DEFAULT 0, 
  p_ip_hash text DEFAULT NULL::text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_recent_count INTEGER;
  v_cooldown_minutes INTEGER;
  v_max_per_window INTEGER;
  v_royalty_cents INTEGER;
  v_owner_id uuid;
BEGIN
  -- Set rate limits based on interaction type
  CASE p_interaction_type
    WHEN 'view' THEN
      v_cooldown_minutes := 5;
      v_max_per_window := 3;
    WHEN 'download_hd' THEN
      v_cooldown_minutes := 60;
      v_max_per_window := 2;
    WHEN 'download_gif' THEN
      v_cooldown_minutes := 60;
      v_max_per_window := 2;
    WHEN 'trade' THEN
      v_cooldown_minutes := 0;
      v_max_per_window := 1000;
    WHEN 'print_order' THEN
      v_cooldown_minutes := 0;
      v_max_per_window := 1000;
    ELSE
      RETURN FALSE;
  END CASE;

  -- Check rate limit (using user_id if available, else ip_hash)
  IF v_cooldown_minutes > 0 THEN
    SELECT COUNT(*) INTO v_recent_count
    FROM vision_interactions
    WHERE visualization_id = p_visualization_id
      AND interaction_type = p_interaction_type
      AND created_at > (now() - (v_cooldown_minutes || ' minutes')::INTERVAL)
      AND (
        (p_user_id IS NOT NULL AND user_id = p_user_id) OR
        (p_user_id IS NULL AND p_ip_hash IS NOT NULL AND ip_hash = p_ip_hash)
      );

    IF v_recent_count >= v_max_per_window THEN
      RETURN FALSE;
    END IF;
  END IF;

  -- Record the interaction
  INSERT INTO vision_interactions (visualization_id, user_id, interaction_type, value_cents, ip_hash)
  VALUES (p_visualization_id, p_user_id, p_interaction_type, p_value_cents, p_ip_hash);

  -- Calculate royalty for print orders (80% to owner)
  v_royalty_cents := 0;
  IF p_interaction_type = 'print_order' AND p_value_cents > 0 THEN
    v_royalty_cents := FLOOR(p_value_cents * 0.80);
    
    -- Get owner of the visualization
    SELECT user_id INTO v_owner_id 
    FROM saved_visualizations 
    WHERE id = p_visualization_id;
  END IF;

  -- Update cached scores
  INSERT INTO vision_scores (visualization_id)
  VALUES (p_visualization_id)
  ON CONFLICT (visualization_id) DO NOTHING;

  UPDATE vision_scores
  SET 
    view_count = (SELECT COUNT(*) FROM vision_interactions WHERE visualization_id = p_visualization_id AND interaction_type = 'view'),
    download_hd_count = (SELECT COUNT(*) FROM vision_interactions WHERE visualization_id = p_visualization_id AND interaction_type = 'download_hd'),
    download_gif_count = (SELECT COUNT(*) FROM vision_interactions WHERE visualization_id = p_visualization_id AND interaction_type = 'download_gif'),
    trade_count = (SELECT COUNT(*) FROM vision_interactions WHERE visualization_id = p_visualization_id AND interaction_type = 'trade'),
    print_order_count = (SELECT COUNT(*) FROM vision_interactions WHERE visualization_id = p_visualization_id AND interaction_type = 'print_order'),
    print_revenue_cents = (SELECT COALESCE(SUM(value_cents), 0) FROM vision_interactions WHERE visualization_id = p_visualization_id AND interaction_type = 'print_order'),
    unique_viewers = (SELECT COUNT(DISTINCT COALESCE(user_id::TEXT, ip_hash)) FROM vision_interactions WHERE visualization_id = p_visualization_id),
    -- Track royalties earned by the owner
    royalty_cents_earned = CASE 
      WHEN p_interaction_type = 'print_order' THEN royalty_cents_earned + v_royalty_cents 
      ELSE royalty_cents_earned 
    END,
    royalty_orders_count = CASE 
      WHEN p_interaction_type = 'print_order' AND p_user_id IS DISTINCT FROM v_owner_id THEN royalty_orders_count + 1 
      ELSE royalty_orders_count 
    END,
    total_score = calculate_vision_score(
      (SELECT COUNT(*) FROM vision_interactions WHERE visualization_id = p_visualization_id AND interaction_type = 'view'),
      (SELECT COUNT(*) FROM vision_interactions WHERE visualization_id = p_visualization_id AND interaction_type = 'download_hd'),
      (SELECT COUNT(*) FROM vision_interactions WHERE visualization_id = p_visualization_id AND interaction_type = 'download_gif'),
      (SELECT COUNT(*) FROM vision_interactions WHERE visualization_id = p_visualization_id AND interaction_type = 'trade'),
      (SELECT COUNT(*) FROM vision_interactions WHERE visualization_id = p_visualization_id AND interaction_type = 'print_order'),
      (SELECT COALESCE(SUM(value_cents), 0) FROM vision_interactions WHERE visualization_id = p_visualization_id AND interaction_type = 'print_order')
    ),
    updated_at = now()
  WHERE visualization_id = p_visualization_id;

  RETURN TRUE;
END;
$function$;