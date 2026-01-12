
-- Create vision interactions tracking table with abuse protection
CREATE TABLE public.vision_interactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  visualization_id UUID NOT NULL REFERENCES public.saved_visualizations(id) ON DELETE CASCADE,
  user_id UUID, -- Nullable for anonymous views
  interaction_type TEXT NOT NULL CHECK (interaction_type IN ('view', 'download_hd', 'download_gif', 'trade', 'print_order')),
  value_cents INTEGER DEFAULT 0, -- For print orders, stores the order value
  ip_hash TEXT, -- Hashed IP for anonymous rate limiting
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for efficient querying
CREATE INDEX idx_vision_interactions_viz_id ON public.vision_interactions(visualization_id);
CREATE INDEX idx_vision_interactions_user_viz ON public.vision_interactions(user_id, visualization_id, interaction_type);
CREATE INDEX idx_vision_interactions_created ON public.vision_interactions(created_at);

-- Create vision scores table (materialized/cached scores)
CREATE TABLE public.vision_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  visualization_id UUID NOT NULL UNIQUE REFERENCES public.saved_visualizations(id) ON DELETE CASCADE,
  view_count INTEGER NOT NULL DEFAULT 0,
  download_hd_count INTEGER NOT NULL DEFAULT 0,
  download_gif_count INTEGER NOT NULL DEFAULT 0,
  trade_count INTEGER NOT NULL DEFAULT 0,
  print_order_count INTEGER NOT NULL DEFAULT 0,
  print_revenue_cents INTEGER NOT NULL DEFAULT 0,
  total_score NUMERIC(12,2) NOT NULL DEFAULT 0,
  unique_viewers INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for leaderboard queries
CREATE INDEX idx_vision_scores_total ON public.vision_scores(total_score DESC);

-- Function to calculate vision score with weighted values
CREATE OR REPLACE FUNCTION public.calculate_vision_score(
  p_view_count INTEGER,
  p_download_hd_count INTEGER,
  p_download_gif_count INTEGER,
  p_trade_count INTEGER,
  p_print_order_count INTEGER,
  p_print_revenue_cents INTEGER
)
RETURNS NUMERIC(12,2)
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- Weighted scoring system:
  -- Views: 0.01 points each
  -- HD Downloads: 0.10 points each
  -- GIF Downloads: 0.25 points each
  -- Trades: 1.00 point each
  -- Print Orders: 2.00 points + (revenue_cents / 100) as dollar value bonus
  RETURN 
    (p_view_count * 0.01) +
    (p_download_hd_count * 0.10) +
    (p_download_gif_count * 0.25) +
    (p_trade_count * 1.00) +
    (p_print_order_count * 2.00) +
    (p_print_revenue_cents::NUMERIC / 100);
END;
$$;

-- Function to record interaction with abuse protection
CREATE OR REPLACE FUNCTION public.record_vision_interaction(
  p_visualization_id UUID,
  p_user_id UUID,
  p_interaction_type TEXT,
  p_value_cents INTEGER DEFAULT 0,
  p_ip_hash TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_recent_count INTEGER;
  v_cooldown_minutes INTEGER;
  v_max_per_window INTEGER;
BEGIN
  -- Set rate limits based on interaction type
  CASE p_interaction_type
    WHEN 'view' THEN
      v_cooldown_minutes := 5;  -- 5 minute cooldown
      v_max_per_window := 3;    -- Max 3 views per window
    WHEN 'download_hd' THEN
      v_cooldown_minutes := 60; -- 1 hour cooldown
      v_max_per_window := 2;    -- Max 2 HD downloads per hour
    WHEN 'download_gif' THEN
      v_cooldown_minutes := 60; -- 1 hour cooldown
      v_max_per_window := 2;    -- Max 2 GIF downloads per hour
    WHEN 'trade' THEN
      v_cooldown_minutes := 0;  -- No cooldown for trades (verified by transaction)
      v_max_per_window := 1000; -- Effectively unlimited
    WHEN 'print_order' THEN
      v_cooldown_minutes := 0;  -- No cooldown for orders (verified by payment)
      v_max_per_window := 1000; -- Effectively unlimited
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
      RETURN FALSE; -- Rate limited
    END IF;
  END IF;

  -- Record the interaction
  INSERT INTO vision_interactions (visualization_id, user_id, interaction_type, value_cents, ip_hash)
  VALUES (p_visualization_id, p_user_id, p_interaction_type, p_value_cents, p_ip_hash);

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
$$;

-- Enable RLS
ALTER TABLE public.vision_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vision_scores ENABLE ROW LEVEL SECURITY;

-- RLS Policies for vision_interactions
CREATE POLICY "Anyone can view aggregated interaction counts"
ON public.vision_interactions
FOR SELECT
USING (true);

CREATE POLICY "System can insert interactions via function"
ON public.vision_interactions
FOR INSERT
WITH CHECK (true);

-- RLS Policies for vision_scores
CREATE POLICY "Anyone can view vision scores"
ON public.vision_scores
FOR SELECT
USING (true);

-- Trigger to update updated_at
CREATE TRIGGER update_vision_scores_updated_at
BEFORE UPDATE ON public.vision_scores
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
