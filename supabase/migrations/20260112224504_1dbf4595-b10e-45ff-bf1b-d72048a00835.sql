-- Fix the remaining security warnings by dropping and recreating functions with proper search_path
-- The two warnings are for can_transfer_visualization and get_remaining_transfers which already have SET search_path
-- The real issue is likely older functions. Let's check and fix calculate_vision_score

-- Fix calculate_vision_score to have proper search_path
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
SET search_path TO 'public'
AS $$
DECLARE
  v_score numeric;
BEGIN
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

-- Fix get_funnel_stats to have proper search_path
CREATE OR REPLACE FUNCTION public.get_funnel_stats(days_back integer DEFAULT 30)
RETURNS TABLE(event_type text, trigger_source text, total_count bigint, unique_users bigint, conversion_rate numeric)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  WITH base_stats AS (
    SELECT 
      e.event_type,
      e.trigger_source,
      COUNT(*) as total_count,
      COUNT(DISTINCT COALESCE(e.user_id::text, e.session_id, e.ip_hash)) as unique_users
    FROM public.membership_funnel_events e
    WHERE e.created_at >= now() - (days_back || ' days')::interval
    GROUP BY e.event_type, e.trigger_source
  ),
  modal_views AS (
    SELECT bs.trigger_source, bs.unique_users as view_count
    FROM base_stats bs WHERE bs.event_type = 'modal_view'
  ),
  signups AS (
    SELECT bs.trigger_source, bs.unique_users as signup_count
    FROM base_stats bs WHERE bs.event_type = 'sign_up_click'
  )
  SELECT 
    bs.event_type,
    bs.trigger_source,
    bs.total_count,
    bs.unique_users,
    CASE 
      WHEN bs.event_type = 'sign_up_click' THEN 
        ROUND((bs.unique_users::NUMERIC / NULLIF(mv.view_count, 0)) * 100, 2)
      WHEN bs.event_type = 'checkout_initiated' THEN 
        ROUND((bs.unique_users::NUMERIC / NULLIF(s.signup_count, 0)) * 100, 2)
      ELSE NULL
    END as conversion_rate
  FROM base_stats bs
  LEFT JOIN modal_views mv ON bs.trigger_source = mv.trigger_source
  LEFT JOIN signups s ON bs.trigger_source = s.trigger_source
  ORDER BY bs.event_type, bs.unique_users DESC;
END;
$$;