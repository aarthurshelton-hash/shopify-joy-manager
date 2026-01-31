-- =====================================================
-- BULLETPROOF MARKETPLACE SECURITY SCHEMA
-- Digital Assets, Payment States, Royalties, Audit
-- =====================================================

-- 1. Digital Assets table for true digital scarcity
CREATE TABLE IF NOT EXISTS digital_assets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  visualization_id UUID NOT NULL REFERENCES saved_visualizations(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL,
  current_owner_id UUID NOT NULL,
  minted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  transfer_count INTEGER DEFAULT 0,
  ownership_proof TEXT NOT NULL,
  edition_number INTEGER NOT NULL DEFAULT 1,
  max_editions INTEGER NOT NULL DEFAULT 1,
  is_frozen BOOLEAN DEFAULT FALSE,
  freeze_reason TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(visualization_id, edition_number),
  CHECK (edition_number >= 1 AND edition_number <= max_editions),
  CHECK (max_editions >= 1 AND max_editions <= 100),
  CHECK (transfer_count >= 0)
);

-- 2. Payment States table for atomic payment operations
CREATE TABLE IF NOT EXISTS payment_states (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  payment_intent_id TEXT UNIQUE,
  listing_id UUID NOT NULL REFERENCES visualization_listings(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL,
  state TEXT NOT NULL DEFAULT 'pending' CHECK (state IN ('pending', 'processing', 'completed', 'failed', 'refunded', 'expired')),
  amount_cents INTEGER NOT NULL CHECK (amount_cents >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  metadata JSONB DEFAULT '{}'
);

-- 3. Royalty Distributions table for tracking creator earnings
CREATE TABLE IF NOT EXISTS royalty_distributions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  payment_intent_id TEXT,
  visualization_id UUID NOT NULL REFERENCES saved_visualizations(id) ON DELETE CASCADE,
  listing_id UUID REFERENCES visualization_listings(id),
  creator_id UUID NOT NULL,
  buyer_id UUID NOT NULL,
  seller_id UUID NOT NULL,
  sale_amount_cents INTEGER NOT NULL CHECK (sale_amount_cents >= 0),
  marketplace_fee_cents INTEGER NOT NULL DEFAULT 0 CHECK (marketplace_fee_cents >= 0),
  creator_royalty_cents INTEGER NOT NULL DEFAULT 0 CHECK (creator_royalty_cents >= 0),
  platform_share_cents INTEGER NOT NULL DEFAULT 0 CHECK (platform_share_cents >= 0),
  seller_proceeds_cents INTEGER NOT NULL CHECK (seller_proceeds_cents >= 0),
  distribution_metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Rate Limits table for abuse prevention
CREATE TABLE IF NOT EXISTS rate_limits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  action TEXT NOT NULL,
  resource_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);

-- Create index for efficient rate limit queries
CREATE INDEX IF NOT EXISTS idx_rate_limits_user_action ON rate_limits(user_id, action, created_at);
CREATE INDEX IF NOT EXISTS idx_rate_limits_resource ON rate_limits(resource_id, action, created_at);

-- 5. Marketplace Audit Events table
CREATE TABLE IF NOT EXISTS marketplace_audit_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL CHECK (resource_type IN ('listing', 'visualization', 'payment', 'transfer', 'asset', 'user')),
  resource_id UUID,
  metadata JSONB DEFAULT '{}',
  ip_address TEXT,
  user_agent TEXT,
  severity TEXT NOT NULL DEFAULT 'low' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for audit queries
CREATE INDEX IF NOT EXISTS idx_audit_events_user ON marketplace_audit_events(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_audit_events_severity ON marketplace_audit_events(severity, created_at);
CREATE INDEX IF NOT EXISTS idx_audit_events_action ON marketplace_audit_events(action, created_at);

-- 6. Enable RLS on all new tables
ALTER TABLE digital_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE royalty_distributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_audit_events ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies for digital_assets
CREATE POLICY "Users can view their own assets"
  ON digital_assets FOR SELECT
  USING (current_owner_id = auth.uid() OR creator_id = auth.uid());

CREATE POLICY "Users can view assets on active listings"
  ON digital_assets FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM visualization_listings vl
      WHERE vl.visualization_id = digital_assets.visualization_id
      AND vl.status = 'active'
    )
  );

-- 8. RLS Policies for payment_states (users can only see their own)
CREATE POLICY "Users can view their own payment states"
  ON payment_states FOR SELECT
  USING (buyer_id = auth.uid());

-- 9. RLS Policies for royalty_distributions
CREATE POLICY "Creators can view their royalties"
  ON royalty_distributions FOR SELECT
  USING (creator_id = auth.uid() OR seller_id = auth.uid() OR buyer_id = auth.uid());

-- 10. RLS for rate_limits (service role only for writes)
CREATE POLICY "Users can view their own rate limits"
  ON rate_limits FOR SELECT
  USING (user_id = auth.uid());

-- 11. Audit events - admins only
CREATE POLICY "Admins can view audit events"
  ON marketplace_audit_events FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- 12. Atomic transfer function with rate limiting
CREATE OR REPLACE FUNCTION atomic_transfer_visualization(
  p_visualization_id UUID,
  p_from_user_id UUID,
  p_to_user_id UUID,
  p_transfer_type TEXT DEFAULT 'marketplace'
) RETURNS JSONB AS $$
DECLARE
  transfer_count INTEGER;
  v_result JSONB;
BEGIN
  -- Check rate limit (3 transfers per 24 hours)
  SELECT COUNT(*) INTO transfer_count
  FROM visualization_transfers
  WHERE visualization_id = p_visualization_id
    AND created_at > NOW() - INTERVAL '24 hours';
  
  IF transfer_count >= 3 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Transfer rate limit exceeded (3 per 24h)',
      'remaining', 0,
      'reset_at', (SELECT MIN(created_at) + INTERVAL '24 hours' FROM visualization_transfers WHERE visualization_id = p_visualization_id AND created_at > NOW() - INTERVAL '24 hours')
    );
  END IF;
  
  -- Verify current ownership
  IF NOT EXISTS (
    SELECT 1 FROM saved_visualizations 
    WHERE id = p_visualization_id AND user_id = p_from_user_id
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Visualization not owned by seller'
    );
  END IF;
  
  -- Perform atomic transfer
  UPDATE saved_visualizations 
  SET user_id = p_to_user_id, updated_at = NOW()
  WHERE id = p_visualization_id AND user_id = p_from_user_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Transfer failed - ownership changed'
    );
  END IF;
  
  -- Record transfer
  INSERT INTO visualization_transfers 
  (visualization_id, from_user_id, to_user_id, transfer_type)
  VALUES (p_visualization_id, p_from_user_id, p_to_user_id, p_transfer_type);
  
  -- Update digital asset if exists
  UPDATE digital_assets
  SET current_owner_id = p_to_user_id,
      transfer_count = transfer_count + 1,
      updated_at = NOW()
  WHERE visualization_id = p_visualization_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'visualization_id', p_visualization_id,
    'from_user_id', p_from_user_id,
    'to_user_id', p_to_user_id,
    'remaining_transfers', 3 - transfer_count - 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 13. Listing lock acquisition function
CREATE OR REPLACE FUNCTION acquire_listing_lock(
  p_listing_id UUID,
  p_buyer_id UUID,
  p_lock_duration_minutes INTEGER DEFAULT 5
) RETURNS JSONB AS $$
DECLARE
  v_listing RECORD;
  v_existing_lock RECORD;
BEGIN
  -- Check for existing active lock
  SELECT * INTO v_existing_lock
  FROM payment_states
  WHERE listing_id = p_listing_id
    AND state IN ('pending', 'processing')
    AND expires_at > NOW();
  
  IF FOUND THEN
    IF v_existing_lock.buyer_id = p_buyer_id THEN
      -- Return existing lock
      RETURN jsonb_build_object(
        'success', true,
        'lock_id', v_existing_lock.id,
        'expires_at', v_existing_lock.expires_at,
        'existing', true
      );
    ELSE
      RETURN jsonb_build_object(
        'success', false,
        'error', 'Listing is currently locked by another buyer'
      );
    END IF;
  END IF;
  
  -- Get listing details
  SELECT l.*, sv.user_id as owner_id
  INTO v_listing
  FROM visualization_listings l
  JOIN saved_visualizations sv ON sv.id = l.visualization_id
  WHERE l.id = p_listing_id
    AND l.status = 'active'
  FOR UPDATE OF l NOWAIT;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Listing not found or not active'
    );
  END IF;
  
  -- Prevent self-purchase
  IF v_listing.seller_id = p_buyer_id THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Cannot purchase your own listing'
    );
  END IF;
  
  -- Create lock
  INSERT INTO payment_states (
    listing_id,
    buyer_id,
    state,
    amount_cents,
    expires_at
  ) VALUES (
    p_listing_id,
    p_buyer_id,
    'pending',
    v_listing.price_cents,
    NOW() + (p_lock_duration_minutes || ' minutes')::INTERVAL
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'listing_id', p_listing_id,
    'visualization_id', v_listing.visualization_id,
    'seller_id', v_listing.seller_id,
    'price_cents', v_listing.price_cents,
    'expires_at', NOW() + (p_lock_duration_minutes || ' minutes')::INTERVAL
  );
EXCEPTION
  WHEN lock_not_available THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Listing is being processed by another request'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 14. Check rate limit function
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_user_id UUID,
  p_action TEXT,
  p_resource_id UUID DEFAULT NULL,
  p_window_minutes INTEGER DEFAULT 60,
  p_max_requests INTEGER DEFAULT 10
) RETURNS JSONB AS $$
DECLARE
  v_count INTEGER;
  v_window_start TIMESTAMP WITH TIME ZONE;
BEGIN
  v_window_start := NOW() - (p_window_minutes || ' minutes')::INTERVAL;
  
  -- Count requests in window
  IF p_resource_id IS NOT NULL THEN
    SELECT COUNT(*) INTO v_count
    FROM rate_limits
    WHERE user_id = p_user_id
      AND action = p_action
      AND resource_id = p_resource_id
      AND created_at > v_window_start;
  ELSE
    SELECT COUNT(*) INTO v_count
    FROM rate_limits
    WHERE user_id = p_user_id
      AND action = p_action
      AND created_at > v_window_start;
  END IF;
  
  IF v_count >= p_max_requests THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'remaining', 0,
      'reset_at', v_window_start + (p_window_minutes || ' minutes')::INTERVAL,
      'limit', p_max_requests
    );
  END IF;
  
  -- Record this request
  INSERT INTO rate_limits (user_id, action, resource_id)
  VALUES (p_user_id, p_action, p_resource_id);
  
  RETURN jsonb_build_object(
    'allowed', true,
    'remaining', p_max_requests - v_count - 1,
    'reset_at', v_window_start + (p_window_minutes || ' minutes')::INTERVAL,
    'limit', p_max_requests
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 15. Log audit event function
CREATE OR REPLACE FUNCTION log_marketplace_audit(
  p_user_id UUID,
  p_action TEXT,
  p_resource_type TEXT,
  p_resource_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}',
  p_severity TEXT DEFAULT 'low',
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_event_id UUID;
BEGIN
  INSERT INTO marketplace_audit_events (
    user_id, action, resource_type, resource_id, 
    metadata, severity, ip_address, user_agent
  ) VALUES (
    p_user_id, p_action, p_resource_type, p_resource_id,
    p_metadata, p_severity, p_ip_address, p_user_agent
  ) RETURNING id INTO v_event_id;
  
  RETURN v_event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 16. Expire stale payment locks (to be called periodically)
CREATE OR REPLACE FUNCTION expire_stale_payment_locks()
RETURNS INTEGER AS $$
DECLARE
  v_expired_count INTEGER;
BEGIN
  UPDATE payment_states
  SET state = 'expired',
      completed_at = NOW()
  WHERE state IN ('pending', 'processing')
    AND expires_at < NOW();
  
  GET DIAGNOSTICS v_expired_count = ROW_COUNT;
  RETURN v_expired_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 17. Clean up old rate limit entries (to be called periodically)
CREATE OR REPLACE FUNCTION cleanup_old_rate_limits(p_older_than_hours INTEGER DEFAULT 24)
RETURNS INTEGER AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  DELETE FROM rate_limits
  WHERE created_at < NOW() - (p_older_than_hours || ' hours')::INTERVAL;
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;