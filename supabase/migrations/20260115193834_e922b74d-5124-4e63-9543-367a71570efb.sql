-- 1. Calculate comprehensive user statistics
CREATE OR REPLACE FUNCTION public.get_user_statistics(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result jsonb;
BEGIN
  -- Authorization check: user can only get their own stats, or admin can get anyone's
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  
  IF auth.uid() != p_user_id AND NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Access denied: can only view your own statistics';
  END IF;

  SELECT jsonb_build_object(
    'user_id', p_user_id,
    'generated_at', now(),
    -- Vision statistics
    'total_visions_owned', (SELECT COUNT(*) FROM saved_visualizations WHERE user_id = p_user_id),
    'total_visions_created', (SELECT COUNT(*) FROM visualization_transfers WHERE to_user_id = p_user_id AND transfer_type = 'creation'),
    'private_visions', (SELECT COUNT(*) FROM saved_visualizations WHERE user_id = p_user_id AND is_private = true),
    'public_visions', (SELECT COUNT(*) FROM saved_visualizations WHERE user_id = p_user_id AND is_private = false),
    -- Earnings statistics
    'wallet_balance_cents', COALESCE((SELECT balance_cents FROM user_wallets WHERE user_id = p_user_id), 0),
    'total_earned_cents', COALESCE((SELECT total_earned_cents FROM user_wallets WHERE user_id = p_user_id), 0),
    'total_spent_cents', COALESCE((SELECT total_spent_cents FROM user_wallets WHERE user_id = p_user_id), 0),
    'total_royalties_cents', COALESCE((
      SELECT SUM(creator_royalty_cents) 
      FROM order_financials 
      WHERE visualization_id IN (SELECT id FROM saved_visualizations WHERE user_id = p_user_id)
    ), 0),
    -- Marketplace activity
    'active_listings', (SELECT COUNT(*) FROM visualization_listings WHERE seller_id = p_user_id AND status = 'active'),
    'total_sales', (SELECT COUNT(*) FROM visualization_listings WHERE seller_id = p_user_id AND status = 'sold'),
    'total_purchases', (SELECT COUNT(*) FROM visualization_listings WHERE buyer_id = p_user_id AND status = 'sold'),
    'pending_offers_received', (SELECT COUNT(*) FROM marketplace_offers WHERE seller_id = p_user_id AND status = 'pending'),
    'pending_offers_sent', (SELECT COUNT(*) FROM marketplace_offers WHERE buyer_id = p_user_id AND status = 'pending'),
    -- Engagement metrics
    'total_views_received', COALESCE((
      SELECT SUM(view_count) 
      FROM vision_scores 
      WHERE visualization_id IN (SELECT id FROM saved_visualizations WHERE user_id = p_user_id)
    ), 0),
    'total_downloads_received', COALESCE((
      SELECT SUM(download_hd_count + download_gif_count) 
      FROM vision_scores 
      WHERE visualization_id IN (SELECT id FROM saved_visualizations WHERE user_id = p_user_id)
    ), 0),
    'total_scans_received', COALESCE((
      SELECT SUM(scan_count) 
      FROM vision_scores 
      WHERE visualization_id IN (SELECT id FROM saved_visualizations WHERE user_id = p_user_id)
    ), 0),
    'portfolio_score', COALESCE((
      SELECT SUM(total_score) 
      FROM vision_scores 
      WHERE visualization_id IN (SELECT id FROM saved_visualizations WHERE user_id = p_user_id)
    ), 0),
    -- Account info
    'is_premium', is_premium_user(p_user_id),
    'member_since', (SELECT created_at FROM profiles WHERE user_id = p_user_id),
    'last_activity', GREATEST(
      (SELECT MAX(created_at) FROM saved_visualizations WHERE user_id = p_user_id),
      (SELECT MAX(created_at) FROM vision_interactions WHERE user_id = p_user_id),
      (SELECT MAX(updated_at) FROM user_wallets WHERE user_id = p_user_id)
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- 2. Validate and process listing publication with authorization
CREATE OR REPLACE FUNCTION public.publish_listing_with_validation(
  p_visualization_id uuid,
  p_price_cents integer,
  p_min_price_cents integer DEFAULT 100,
  p_max_price_cents integer DEFAULT 100000000
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_visualization record;
  v_existing_listing record;
  v_listing_id uuid;
  v_result jsonb;
BEGIN
  -- Get authenticated user
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Authentication required');
  END IF;

  -- Check if user is banned
  IF is_user_banned(v_user_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Your account is suspended');
  END IF;

  -- Validate price range
  IF p_price_cents < p_min_price_cents THEN
    RETURN jsonb_build_object('success', false, 'error', 'Price must be at least $' || (p_min_price_cents / 100.0)::text);
  END IF;

  IF p_price_cents > p_max_price_cents THEN
    RETURN jsonb_build_object('success', false, 'error', 'Price exceeds maximum allowed');
  END IF;

  -- Verify ownership
  SELECT * INTO v_visualization 
  FROM saved_visualizations 
  WHERE id = p_visualization_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Vision not found');
  END IF;

  IF v_visualization.user_id != v_user_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'You do not own this vision');
  END IF;

  -- Check for existing active listing
  SELECT * INTO v_existing_listing 
  FROM visualization_listings 
  WHERE visualization_id = p_visualization_id AND status = 'active';

  IF FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'This vision is already listed', 'listing_id', v_existing_listing.id);
  END IF;

  -- Check transfer limits
  IF NOT can_transfer_visualization(p_visualization_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Transfer limit reached (max 3 per 24 hours)');
  END IF;

  -- Create the listing
  INSERT INTO visualization_listings (visualization_id, seller_id, price_cents, status)
  VALUES (p_visualization_id, v_user_id, p_price_cents, 'active')
  RETURNING id INTO v_listing_id;

  -- Log the security event
  PERFORM log_security_event(
    p_action_type := 'listing_created',
    p_action_category := 'marketplace',
    p_user_id := v_user_id,
    p_target_type := 'listing',
    p_target_id := v_listing_id::text,
    p_metadata := jsonb_build_object('price_cents', p_price_cents, 'visualization_id', p_visualization_id),
    p_severity := 'info'
  );

  RETURN jsonb_build_object(
    'success', true,
    'listing_id', v_listing_id,
    'price_cents', p_price_cents,
    'message', 'Vision listed successfully'
  );
END;
$$;

-- 3. Data maintenance: Archive old interactions and cleanup expired data
CREATE OR REPLACE FUNCTION public.perform_data_maintenance(
  p_days_to_keep_interactions integer DEFAULT 90,
  p_days_to_keep_expired_offers integer DEFAULT 30,
  p_days_to_keep_notifications integer DEFAULT 60
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id uuid;
  v_deleted_interactions integer := 0;
  v_deleted_offers integer := 0;
  v_deleted_notifications integer := 0;
  v_deleted_analytics integer := 0;
  v_deleted_funnel_events integer := 0;
BEGIN
  -- Only admins can run maintenance
  v_caller_id := auth.uid();
  
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF NOT has_role(v_caller_id, 'admin') THEN
    RAISE EXCEPTION 'Admin privileges required for data maintenance';
  END IF;

  -- Archive old vision interactions (keep aggregated scores, remove raw events)
  DELETE FROM vision_interactions 
  WHERE created_at < now() - (p_days_to_keep_interactions || ' days')::interval
    AND interaction_type = 'view'; -- Only delete view events, keep purchases/trades
  GET DIAGNOSTICS v_deleted_interactions = ROW_COUNT;

  -- Delete expired/rejected marketplace offers
  DELETE FROM marketplace_offers 
  WHERE status IN ('expired', 'rejected', 'cancelled')
    AND updated_at < now() - (p_days_to_keep_expired_offers || ' days')::interval;
  GET DIAGNOSTICS v_deleted_offers = ROW_COUNT;

  -- Delete old read notifications
  DELETE FROM subscription_notifications 
  WHERE read_at IS NOT NULL 
    AND created_at < now() - (p_days_to_keep_notifications || ' days')::interval;
  GET DIAGNOSTICS v_deleted_notifications = ROW_COUNT;

  -- Delete expired premium analytics cache
  DELETE FROM premium_analytics 
  WHERE expires_at < now();
  GET DIAGNOSTICS v_deleted_analytics = ROW_COUNT;

  -- Archive old funnel events (older than 180 days)
  DELETE FROM membership_funnel_events 
  WHERE created_at < now() - interval '180 days';
  GET DIAGNOSTICS v_deleted_funnel_events = ROW_COUNT;

  -- Log the maintenance operation
  PERFORM log_security_event(
    p_action_type := 'data_maintenance_completed',
    p_action_category := 'admin',
    p_admin_id := v_caller_id,
    p_metadata := jsonb_build_object(
      'deleted_interactions', v_deleted_interactions,
      'deleted_offers', v_deleted_offers,
      'deleted_notifications', v_deleted_notifications,
      'deleted_analytics', v_deleted_analytics,
      'deleted_funnel_events', v_deleted_funnel_events,
      'retention_days', jsonb_build_object(
        'interactions', p_days_to_keep_interactions,
        'offers', p_days_to_keep_expired_offers,
        'notifications', p_days_to_keep_notifications
      )
    ),
    p_severity := 'info'
  );

  RETURN jsonb_build_object(
    'success', true,
    'completed_at', now(),
    'deleted', jsonb_build_object(
      'view_interactions', v_deleted_interactions,
      'expired_offers', v_deleted_offers,
      'read_notifications', v_deleted_notifications,
      'expired_analytics_cache', v_deleted_analytics,
      'old_funnel_events', v_deleted_funnel_events
    ),
    'total_records_cleaned', v_deleted_interactions + v_deleted_offers + v_deleted_notifications + v_deleted_analytics + v_deleted_funnel_events
  );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_user_statistics(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.publish_listing_with_validation(uuid, integer, integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.perform_data_maintenance(integer, integer, integer) TO authenticated;