-- Fix calculate_vision_score function to accept bigint (from SQL aggregations)
DROP FUNCTION IF EXISTS public.calculate_vision_score(integer, integer, integer, integer, integer, integer);
DROP FUNCTION IF EXISTS public.calculate_vision_score(bigint, bigint, bigint, bigint, bigint, bigint);

CREATE OR REPLACE FUNCTION public.calculate_vision_score(
  p_download_gif_count bigint,
  p_download_hd_count bigint,
  p_print_order_count bigint,
  p_print_revenue_cents bigint,
  p_trade_count bigint,
  p_view_count bigint
)
RETURNS numeric
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_score numeric;
BEGIN
  -- Scoring weights:
  -- View: 0.01 points
  -- HD Download: 0.10 points
  -- GIF Download: 0.25 points
  -- Trade: 1.00 point
  -- Print Order: 2.00 points + revenue in dollars
  v_score := (
    (COALESCE(p_view_count, 0)::numeric * 0.01) +
    (COALESCE(p_download_hd_count, 0)::numeric * 0.10) +
    (COALESCE(p_download_gif_count, 0)::numeric * 0.25) +
    (COALESCE(p_trade_count, 0)::numeric * 1.00) +
    (COALESCE(p_print_order_count, 0)::numeric * 2.00) +
    (COALESCE(p_print_revenue_cents, 0)::numeric / 100.0)
  );
  
  RETURN ROUND(v_score, 2);
END;
$$;