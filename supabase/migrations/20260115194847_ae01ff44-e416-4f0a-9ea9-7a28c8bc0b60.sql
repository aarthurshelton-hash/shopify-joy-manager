-- Create table to store client-side errors
CREATE TABLE public.client_errors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  error_message TEXT NOT NULL,
  error_stack TEXT,
  component_name TEXT,
  error_type TEXT DEFAULT 'runtime',
  url TEXT,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}',
  occurrence_count INTEGER DEFAULT 1,
  first_occurred_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_occurred_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create index for querying recent unresolved errors
CREATE INDEX idx_client_errors_unresolved ON public.client_errors (resolved_at, last_occurred_at DESC) WHERE resolved_at IS NULL;
CREATE INDEX idx_client_errors_type ON public.client_errors (error_type, created_at DESC);

-- Create table for system health checks
CREATE TABLE public.system_health_checks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  check_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  issues_found INTEGER DEFAULT 0,
  issues_fixed INTEGER DEFAULT 0,
  details JSONB DEFAULT '{}',
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_health_checks_recent ON public.system_health_checks (check_type, created_at DESC);

-- Enable RLS
ALTER TABLE public.client_errors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_health_checks ENABLE ROW LEVEL SECURITY;

-- Client errors: anyone can insert (for error reporting), admins can view all
CREATE POLICY "Anyone can report client errors"
ON public.client_errors FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can view client errors"
ON public.client_errors FOR SELECT
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update client errors"
ON public.client_errors FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

-- Health checks: admins only
CREATE POLICY "Admins can view health checks"
ON public.system_health_checks FOR SELECT
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert health checks"
ON public.system_health_checks FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update health checks"
ON public.system_health_checks FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

-- Data integrity validation function
CREATE OR REPLACE FUNCTION public.validate_and_fix_data_integrity()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_issues_found INTEGER := 0;
  v_issues_fixed INTEGER := 0;
  v_details JSONB := '[]'::JSONB;
  v_check_id UUID;
BEGIN
  -- Record health check start
  INSERT INTO system_health_checks (check_type, status)
  VALUES ('data_integrity', 'running')
  RETURNING id INTO v_check_id;

  -- Check 1: Orphaned vision scores (no matching visualization)
  WITH orphaned AS (
    DELETE FROM vision_scores vs
    WHERE NOT EXISTS (SELECT 1 FROM saved_visualizations sv WHERE sv.id = vs.visualization_id)
    RETURNING visualization_id
  )
  SELECT COUNT(*) INTO v_issues_fixed FROM orphaned;
  IF v_issues_fixed > 0 THEN
    v_issues_found := v_issues_found + v_issues_fixed;
    v_details := v_details || jsonb_build_object('orphaned_vision_scores_removed', v_issues_fixed);
  END IF;

  -- Check 2: Orphaned wallet transactions (no matching wallet)
  WITH orphaned AS (
    DELETE FROM wallet_transactions wt
    WHERE NOT EXISTS (SELECT 1 FROM user_wallets uw WHERE uw.user_id = wt.user_id)
    RETURNING id
  )
  SELECT COUNT(*) INTO v_issues_fixed FROM orphaned;
  IF v_issues_fixed > 0 THEN
    v_issues_found := v_issues_found + v_issues_fixed;
    v_details := v_details || jsonb_build_object('orphaned_wallet_transactions_removed', v_issues_fixed);
  END IF;

  -- Check 3: Negative wallet balances (should never happen)
  WITH fixed AS (
    UPDATE user_wallets
    SET balance_cents = 0, updated_at = now()
    WHERE balance_cents < 0
    RETURNING user_id
  )
  SELECT COUNT(*) INTO v_issues_fixed FROM fixed;
  IF v_issues_fixed > 0 THEN
    v_issues_found := v_issues_found + v_issues_fixed;
    v_details := v_details || jsonb_build_object('negative_balances_corrected', v_issues_fixed);
  END IF;

  -- Check 4: Expired offers still marked pending
  WITH fixed AS (
    UPDATE marketplace_offers
    SET status = 'expired', updated_at = now()
    WHERE status = 'pending' AND expires_at < now()
    RETURNING id
  )
  SELECT COUNT(*) INTO v_issues_fixed FROM fixed;
  IF v_issues_fixed > 0 THEN
    v_issues_found := v_issues_found + v_issues_fixed;
    v_details := v_details || jsonb_build_object('expired_offers_marked', v_issues_fixed);
  END IF;

  -- Check 5: Listings marked active but visualization transferred
  WITH fixed AS (
    UPDATE visualization_listings vl
    SET status = 'cancelled', updated_at = now()
    WHERE status = 'active'
    AND NOT EXISTS (
      SELECT 1 FROM saved_visualizations sv 
      WHERE sv.id = vl.visualization_id 
      AND sv.user_id = vl.seller_id
    )
    RETURNING id
  )
  SELECT COUNT(*) INTO v_issues_fixed FROM fixed;
  IF v_issues_fixed > 0 THEN
    v_issues_found := v_issues_found + v_issues_fixed;
    v_details := v_details || jsonb_build_object('invalid_listings_cancelled', v_issues_fixed);
  END IF;

  -- Check 6: Vision scores with negative counts
  WITH fixed AS (
    UPDATE vision_scores
    SET 
      view_count = GREATEST(0, view_count),
      download_hd_count = GREATEST(0, download_hd_count),
      download_gif_count = GREATEST(0, download_gif_count),
      scan_count = GREATEST(0, scan_count),
      trade_count = GREATEST(0, trade_count),
      print_order_count = GREATEST(0, print_order_count),
      updated_at = now()
    WHERE view_count < 0 OR download_hd_count < 0 OR download_gif_count < 0 
      OR scan_count < 0 OR trade_count < 0 OR print_order_count < 0
    RETURNING visualization_id
  )
  SELECT COUNT(*) INTO v_issues_fixed FROM fixed;
  IF v_issues_fixed > 0 THEN
    v_issues_found := v_issues_found + v_issues_fixed;
    v_details := v_details || jsonb_build_object('negative_scores_corrected', v_issues_fixed);
  END IF;

  -- Update health check record
  UPDATE system_health_checks
  SET 
    status = 'completed',
    issues_found = v_issues_found,
    issues_fixed = v_issues_found, -- All issues are auto-fixed
    details = v_details,
    completed_at = now()
  WHERE id = v_check_id;

  RETURN jsonb_build_object(
    'check_id', v_check_id,
    'issues_found', v_issues_found,
    'issues_fixed', v_issues_found,
    'details', v_details,
    'completed_at', now()
  );
END;
$$;

-- Function to aggregate and deduplicate client errors
CREATE OR REPLACE FUNCTION public.report_client_error(
  p_error_message TEXT,
  p_error_stack TEXT DEFAULT NULL,
  p_component_name TEXT DEFAULT NULL,
  p_error_type TEXT DEFAULT 'runtime',
  p_url TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_error_id UUID;
  v_user_id UUID := auth.uid();
BEGIN
  -- Try to find existing similar error (same message and component)
  SELECT id INTO v_error_id
  FROM client_errors
  WHERE error_message = p_error_message
    AND COALESCE(component_name, '') = COALESCE(p_component_name, '')
    AND resolved_at IS NULL
    AND last_occurred_at > now() - interval '24 hours'
  LIMIT 1;

  IF v_error_id IS NOT NULL THEN
    -- Increment occurrence count
    UPDATE client_errors
    SET 
      occurrence_count = occurrence_count + 1,
      last_occurred_at = now(),
      metadata = metadata || p_metadata
    WHERE id = v_error_id;
  ELSE
    -- Insert new error
    INSERT INTO client_errors (
      user_id, error_message, error_stack, component_name,
      error_type, url, user_agent, metadata
    ) VALUES (
      v_user_id, p_error_message, p_error_stack, p_component_name,
      p_error_type, p_url, p_user_agent, p_metadata
    )
    RETURNING id INTO v_error_id;
  END IF;

  RETURN v_error_id;
END;
$$;

-- Trigger to prevent negative wallet balances
CREATE OR REPLACE FUNCTION public.validate_wallet_balance()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.balance_cents < 0 THEN
    NEW.balance_cents := 0;
    -- Log this correction
    INSERT INTO client_errors (error_message, error_type, metadata)
    VALUES (
      'Wallet balance went negative - auto-corrected',
      'data_integrity',
      jsonb_build_object('user_id', NEW.user_id, 'attempted_balance', NEW.balance_cents)
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER enforce_positive_wallet_balance
BEFORE INSERT OR UPDATE ON public.user_wallets
FOR EACH ROW
EXECUTE FUNCTION validate_wallet_balance();

-- Trigger to auto-expire old pending offers
CREATE OR REPLACE FUNCTION public.auto_expire_offers()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.status = 'pending' AND NEW.expires_at < now() THEN
    NEW.status := 'expired';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER auto_expire_marketplace_offers
BEFORE INSERT OR UPDATE ON public.marketplace_offers
FOR EACH ROW
EXECUTE FUNCTION auto_expire_offers();

-- Function to get error summary for admin dashboard
CREATE OR REPLACE FUNCTION public.get_error_summary(p_days INTEGER DEFAULT 7)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_result JSONB;
BEGIN
  -- Only admins can view error summary
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  SELECT jsonb_build_object(
    'total_unresolved', (SELECT COUNT(*) FROM client_errors WHERE resolved_at IS NULL),
    'last_24h_errors', (SELECT COUNT(*) FROM client_errors WHERE created_at > now() - interval '24 hours'),
    'by_type', (
      SELECT jsonb_agg(jsonb_build_object('type', error_type, 'count', cnt))
      FROM (
        SELECT error_type, COUNT(*) as cnt
        FROM client_errors
        WHERE resolved_at IS NULL
        GROUP BY error_type
        ORDER BY cnt DESC
      ) sub
    ),
    'top_errors', (
      SELECT jsonb_agg(jsonb_build_object(
        'id', id,
        'message', LEFT(error_message, 100),
        'component', component_name,
        'count', occurrence_count,
        'last_seen', last_occurred_at
      ))
      FROM (
        SELECT id, error_message, component_name, occurrence_count, last_occurred_at
        FROM client_errors
        WHERE resolved_at IS NULL
        ORDER BY occurrence_count DESC, last_occurred_at DESC
        LIMIT 10
      ) sub
    ),
    'recent_health_checks', (
      SELECT jsonb_agg(jsonb_build_object(
        'id', id,
        'type', check_type,
        'status', status,
        'issues_found', issues_found,
        'issues_fixed', issues_fixed,
        'completed_at', completed_at
      ))
      FROM (
        SELECT id, check_type, status, issues_found, issues_fixed, completed_at
        FROM system_health_checks
        ORDER BY created_at DESC
        LIMIT 5
      ) sub
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$;