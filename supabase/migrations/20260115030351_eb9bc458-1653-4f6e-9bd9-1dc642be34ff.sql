-- Add scan_count to vision_scores table
ALTER TABLE public.vision_scores 
ADD COLUMN IF NOT EXISTS scan_count integer NOT NULL DEFAULT 0;

-- Update the calculate_vision_score function to include scans
CREATE OR REPLACE FUNCTION public.calculate_vision_score(
  p_download_gif_count integer,
  p_download_hd_count integer,
  p_print_order_count integer,
  p_print_revenue_cents integer,
  p_trade_count integer,
  p_view_count integer,
  p_scan_count integer DEFAULT 0
)
RETURNS numeric
LANGUAGE plpgsql
AS $$
BEGIN
  -- Scoring weights:
  -- View: 0.01 points
  -- HD Download: 0.10 points
  -- GIF Download: 0.25 points
  -- Scan: 0.50 points (higher value - validated real-world presence)
  -- Trade: 1.00 point
  -- Print Order: 2.00 points + revenue in dollars
  RETURN (
    (p_view_count * 0.01) +
    (p_download_hd_count * 0.10) +
    (p_download_gif_count * 0.25) +
    (p_scan_count * 0.50) +
    (p_trade_count * 1.00) +
    (p_print_order_count * 2.00) +
    (p_print_revenue_cents / 100.0)
  );
END;
$$;

-- Update record_vision_interaction to handle 'scan' type
CREATE OR REPLACE FUNCTION public.record_vision_interaction(
  p_visualization_id uuid,
  p_user_id uuid DEFAULT NULL,
  p_interaction_type text DEFAULT 'view',
  p_value_cents integer DEFAULT 0,
  p_ip_hash text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_last_interaction timestamptz;
  v_rate_limit_seconds integer;
  v_should_record boolean := true;
  v_current_score record;
BEGIN
  -- Set rate limit based on interaction type
  CASE p_interaction_type
    WHEN 'view' THEN v_rate_limit_seconds := 60; -- 1 minute
    WHEN 'download_hd' THEN v_rate_limit_seconds := 300; -- 5 minutes
    WHEN 'download_gif' THEN v_rate_limit_seconds := 300; -- 5 minutes
    WHEN 'scan' THEN v_rate_limit_seconds := 30; -- 30 seconds for scans
    WHEN 'trade' THEN v_rate_limit_seconds := 0; -- No limit
    WHEN 'print_order' THEN v_rate_limit_seconds := 0; -- No limit
    ELSE v_rate_limit_seconds := 60;
  END CASE;

  -- Check rate limit for non-purchase interactions
  IF v_rate_limit_seconds > 0 THEN
    SELECT MAX(created_at) INTO v_last_interaction
    FROM vision_interactions
    WHERE visualization_id = p_visualization_id
      AND interaction_type = p_interaction_type
      AND (
        (p_user_id IS NOT NULL AND user_id = p_user_id)
        OR (p_user_id IS NULL AND ip_hash = p_ip_hash)
      )
      AND created_at > NOW() - (v_rate_limit_seconds || ' seconds')::interval;

    IF v_last_interaction IS NOT NULL THEN
      v_should_record := false;
    END IF;
  END IF;

  -- Record the interaction if not rate limited
  IF v_should_record THEN
    INSERT INTO vision_interactions (visualization_id, user_id, interaction_type, value_cents, ip_hash)
    VALUES (p_visualization_id, p_user_id, p_interaction_type, p_value_cents, p_ip_hash);

    -- Update vision_scores
    INSERT INTO vision_scores (
      visualization_id, 
      view_count, 
      download_hd_count, 
      download_gif_count,
      scan_count,
      trade_count, 
      print_order_count, 
      print_revenue_cents,
      unique_viewers,
      total_score
    )
    VALUES (
      p_visualization_id,
      CASE WHEN p_interaction_type = 'view' THEN 1 ELSE 0 END,
      CASE WHEN p_interaction_type = 'download_hd' THEN 1 ELSE 0 END,
      CASE WHEN p_interaction_type = 'download_gif' THEN 1 ELSE 0 END,
      CASE WHEN p_interaction_type = 'scan' THEN 1 ELSE 0 END,
      CASE WHEN p_interaction_type = 'trade' THEN 1 ELSE 0 END,
      CASE WHEN p_interaction_type = 'print_order' THEN 1 ELSE 0 END,
      CASE WHEN p_interaction_type = 'print_order' THEN p_value_cents ELSE 0 END,
      1,
      calculate_vision_score(
        CASE WHEN p_interaction_type = 'download_gif' THEN 1 ELSE 0 END,
        CASE WHEN p_interaction_type = 'download_hd' THEN 1 ELSE 0 END,
        CASE WHEN p_interaction_type = 'print_order' THEN 1 ELSE 0 END,
        CASE WHEN p_interaction_type = 'print_order' THEN p_value_cents ELSE 0 END,
        CASE WHEN p_interaction_type = 'trade' THEN 1 ELSE 0 END,
        CASE WHEN p_interaction_type = 'view' THEN 1 ELSE 0 END,
        CASE WHEN p_interaction_type = 'scan' THEN 1 ELSE 0 END
      )
    )
    ON CONFLICT (visualization_id) DO UPDATE SET
      view_count = vision_scores.view_count + CASE WHEN p_interaction_type = 'view' THEN 1 ELSE 0 END,
      download_hd_count = vision_scores.download_hd_count + CASE WHEN p_interaction_type = 'download_hd' THEN 1 ELSE 0 END,
      download_gif_count = vision_scores.download_gif_count + CASE WHEN p_interaction_type = 'download_gif' THEN 1 ELSE 0 END,
      scan_count = vision_scores.scan_count + CASE WHEN p_interaction_type = 'scan' THEN 1 ELSE 0 END,
      trade_count = vision_scores.trade_count + CASE WHEN p_interaction_type = 'trade' THEN 1 ELSE 0 END,
      print_order_count = vision_scores.print_order_count + CASE WHEN p_interaction_type = 'print_order' THEN 1 ELSE 0 END,
      print_revenue_cents = vision_scores.print_revenue_cents + CASE WHEN p_interaction_type = 'print_order' THEN p_value_cents ELSE 0 END,
      unique_viewers = vision_scores.unique_viewers + CASE WHEN p_interaction_type = 'view' AND p_user_id IS NOT NULL THEN 1 ELSE 0 END,
      total_score = calculate_vision_score(
        vision_scores.download_gif_count + CASE WHEN p_interaction_type = 'download_gif' THEN 1 ELSE 0 END,
        vision_scores.download_hd_count + CASE WHEN p_interaction_type = 'download_hd' THEN 1 ELSE 0 END,
        vision_scores.print_order_count + CASE WHEN p_interaction_type = 'print_order' THEN 1 ELSE 0 END,
        vision_scores.print_revenue_cents + CASE WHEN p_interaction_type = 'print_order' THEN p_value_cents ELSE 0 END,
        vision_scores.trade_count + CASE WHEN p_interaction_type = 'trade' THEN 1 ELSE 0 END,
        vision_scores.view_count + CASE WHEN p_interaction_type = 'view' THEN 1 ELSE 0 END,
        vision_scores.scan_count + CASE WHEN p_interaction_type = 'scan' THEN 1 ELSE 0 END
      ),
      updated_at = NOW();
  END IF;

  RETURN v_should_record;
END;
$$;