-- Drop existing tables if they were partially created
DROP TABLE IF EXISTS public.health_check_metrics CASCADE;
DROP TABLE IF EXISTS public.system_alerts CASCADE;
DROP TABLE IF EXISTS public.rate_limit_records CASCADE;

-- Health Check History Table (for trend analysis)
CREATE TABLE public.health_check_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  hour INTEGER NOT NULL DEFAULT EXTRACT(HOUR FROM NOW()),
  errors_reported INTEGER DEFAULT 0,
  errors_resolved INTEGER DEFAULT 0,
  issues_found INTEGER DEFAULT 0,
  issues_fixed INTEGER DEFAULT 0,
  avg_response_time_ms INTEGER DEFAULT 0,
  uptime_percentage NUMERIC(5,2) DEFAULT 100.00,
  api_requests INTEGER DEFAULT 0,
  rate_limited_requests INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(date, hour)
);

-- System Alerts Table
CREATE TABLE public.system_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  alert_type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'warning' CHECK (severity IN ('info', 'warning', 'critical')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  acknowledged_by UUID,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Rate Limiting Table
CREATE TABLE public.rate_limit_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  identifier TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  window_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  request_count INTEGER DEFAULT 1,
  blocked_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(identifier, endpoint, window_start)
);

-- Indexes
CREATE INDEX idx_rate_limit_identifier ON public.rate_limit_records(identifier, endpoint);
CREATE INDEX idx_rate_limit_window ON public.rate_limit_records(window_start);
CREATE INDEX idx_system_alerts_unresolved ON public.system_alerts(created_at) WHERE resolved_at IS NULL;
CREATE INDEX idx_system_alerts_severity ON public.system_alerts(severity, created_at);
CREATE INDEX idx_health_metrics_date ON public.health_check_metrics(date DESC);

-- Enable RLS
ALTER TABLE public.health_check_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limit_records ENABLE ROW LEVEL SECURITY;

-- Policies using correct has_role signature (user_id, role)
CREATE POLICY "Admins can view health metrics" ON public.health_check_metrics
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can insert health metrics" ON public.health_check_metrics
  FOR INSERT WITH CHECK (true);

CREATE POLICY "System can update health metrics" ON public.health_check_metrics
  FOR UPDATE USING (true);

CREATE POLICY "Admins can view alerts" ON public.system_alerts
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update alerts" ON public.system_alerts
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete alerts" ON public.system_alerts
  FOR DELETE USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can insert alerts" ON public.system_alerts
  FOR INSERT WITH CHECK (true);

CREATE POLICY "System can manage rate limits" ON public.rate_limit_records
  FOR ALL USING (true);

-- Function to record health metrics
CREATE OR REPLACE FUNCTION public.record_health_metric(
  p_errors_reported INTEGER DEFAULT 0,
  p_errors_resolved INTEGER DEFAULT 0,
  p_issues_found INTEGER DEFAULT 0,
  p_issues_fixed INTEGER DEFAULT 0,
  p_api_requests INTEGER DEFAULT 0,
  p_rate_limited INTEGER DEFAULT 0
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.health_check_metrics (
    date, hour, errors_reported, errors_resolved, issues_found, 
    issues_fixed, api_requests, rate_limited_requests
  )
  VALUES (
    CURRENT_DATE,
    EXTRACT(HOUR FROM NOW())::INTEGER,
    p_errors_reported,
    p_errors_resolved,
    p_issues_found,
    p_issues_fixed,
    p_api_requests,
    p_rate_limited
  )
  ON CONFLICT (date, hour) DO UPDATE SET
    errors_reported = health_check_metrics.errors_reported + EXCLUDED.errors_reported,
    errors_resolved = health_check_metrics.errors_resolved + EXCLUDED.errors_resolved,
    issues_found = health_check_metrics.issues_found + EXCLUDED.issues_found,
    issues_fixed = health_check_metrics.issues_fixed + EXCLUDED.issues_fixed,
    api_requests = health_check_metrics.api_requests + EXCLUDED.api_requests,
    rate_limited_requests = health_check_metrics.rate_limited_requests + EXCLUDED.rate_limited_requests;
END;
$$;

-- Function to check rate limit
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_identifier TEXT,
  p_endpoint TEXT,
  p_max_requests INTEGER DEFAULT 100,
  p_window_seconds INTEGER DEFAULT 60
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_window_start TIMESTAMP WITH TIME ZONE;
  v_current_count INTEGER;
  v_blocked_until TIMESTAMP WITH TIME ZONE;
BEGIN
  v_window_start := date_trunc('minute', NOW());
  
  SELECT blocked_until INTO v_blocked_until
  FROM public.rate_limit_records
  WHERE identifier = p_identifier 
    AND endpoint = p_endpoint
    AND blocked_until > NOW()
  ORDER BY blocked_until DESC
  LIMIT 1;
  
  IF v_blocked_until IS NOT NULL THEN
    PERFORM public.record_health_metric(0, 0, 0, 0, 1, 1);
    RETURN jsonb_build_object(
      'allowed', false,
      'blocked_until', v_blocked_until,
      'retry_after', EXTRACT(EPOCH FROM (v_blocked_until - NOW()))::INTEGER
    );
  END IF;
  
  INSERT INTO public.rate_limit_records (identifier, endpoint, window_start, request_count)
  VALUES (p_identifier, p_endpoint, v_window_start, 1)
  ON CONFLICT (identifier, endpoint, window_start) DO UPDATE
  SET request_count = rate_limit_records.request_count + 1
  RETURNING request_count INTO v_current_count;
  
  IF v_current_count > p_max_requests THEN
    v_blocked_until := NOW() + (INTERVAL '1 minute' * LEAST(v_current_count - p_max_requests, 60));
    
    UPDATE public.rate_limit_records
    SET blocked_until = v_blocked_until
    WHERE identifier = p_identifier 
      AND endpoint = p_endpoint
      AND window_start = v_window_start;
    
    IF v_current_count > p_max_requests * 2 THEN
      INSERT INTO public.system_alerts (alert_type, severity, title, message, metadata)
      VALUES (
        'rate_limit_abuse',
        'warning',
        'Excessive Rate Limit Violations',
        'Identifier ' || LEFT(p_identifier, 8) || '... exceeded rate limits on ' || p_endpoint,
        jsonb_build_object('identifier', p_identifier, 'endpoint', p_endpoint, 'count', v_current_count)
      );
    END IF;
    
    PERFORM public.record_health_metric(0, 0, 0, 0, 1, 1);
    RETURN jsonb_build_object(
      'allowed', false,
      'blocked_until', v_blocked_until,
      'retry_after', EXTRACT(EPOCH FROM (v_blocked_until - NOW()))::INTEGER
    );
  END IF;
  
  PERFORM public.record_health_metric(0, 0, 0, 0, 1, 0);
  RETURN jsonb_build_object(
    'allowed', true,
    'remaining', p_max_requests - v_current_count
  );
END;
$$;

-- Function to create system alert
CREATE OR REPLACE FUNCTION public.create_system_alert(
  p_alert_type TEXT,
  p_severity TEXT,
  p_title TEXT,
  p_message TEXT,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_alert_id UUID;
BEGIN
  INSERT INTO public.system_alerts (alert_type, severity, title, message, metadata)
  VALUES (p_alert_type, p_severity, p_title, p_message, p_metadata)
  RETURNING id INTO v_alert_id;
  RETURN v_alert_id;
END;
$$;

-- Function to get health trends
CREATE OR REPLACE FUNCTION public.get_health_trends(p_days INTEGER DEFAULT 7)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'daily_trends', (
      SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb)
      FROM (
        SELECT date, 
               SUM(errors_reported) as errors_reported,
               SUM(errors_resolved) as errors_resolved,
               SUM(issues_found) as issues_found,
               SUM(issues_fixed) as issues_fixed,
               SUM(api_requests) as api_requests,
               SUM(rate_limited_requests) as rate_limited
        FROM public.health_check_metrics
        WHERE date >= CURRENT_DATE - (p_days || ' days')::INTERVAL
        GROUP BY date
        ORDER BY date DESC
      ) t
    ),
    'hourly_trends', (
      SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb)
      FROM (
        SELECT date, hour, errors_reported as errors, issues_fixed as fixed, api_requests as requests
        FROM public.health_check_metrics
        WHERE date >= CURRENT_DATE - INTERVAL '2 days'
        ORDER BY date DESC, hour DESC
        LIMIT 48
      ) t
    ),
    'totals', (
      SELECT jsonb_build_object(
        'total_errors', COALESCE(SUM(errors_reported), 0),
        'total_resolved', COALESCE(SUM(errors_resolved), 0),
        'total_issues_found', COALESCE(SUM(issues_found), 0),
        'total_issues_fixed', COALESCE(SUM(issues_fixed), 0),
        'total_requests', COALESCE(SUM(api_requests), 0),
        'total_rate_limited', COALESCE(SUM(rate_limited_requests), 0)
      )
      FROM public.health_check_metrics
      WHERE date >= CURRENT_DATE - (p_days || ' days')::INTERVAL
    ),
    'active_alerts', (SELECT COUNT(*) FROM public.system_alerts WHERE resolved_at IS NULL),
    'critical_alerts', (SELECT COUNT(*) FROM public.system_alerts WHERE resolved_at IS NULL AND severity = 'critical')
  ) INTO v_result;
  
  RETURN v_result;
END;
$$;

-- Function to get alerts
CREATE OR REPLACE FUNCTION public.get_system_alerts(
  p_include_resolved BOOLEAN DEFAULT false,
  p_limit INTEGER DEFAULT 50
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (
    SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb)
    FROM (
      SELECT id, alert_type, severity, title, message, metadata, 
             acknowledged_at, resolved_at, created_at
      FROM public.system_alerts
      WHERE (p_include_resolved OR resolved_at IS NULL)
      ORDER BY 
        CASE severity WHEN 'critical' THEN 0 WHEN 'warning' THEN 1 ELSE 2 END,
        created_at DESC
      LIMIT p_limit
    ) t
  );
END;
$$;

-- Function to acknowledge alert
CREATE OR REPLACE FUNCTION public.acknowledge_alert(p_alert_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.system_alerts
  SET acknowledged_at = NOW(), acknowledged_by = auth.uid()
  WHERE id = p_alert_id AND acknowledged_at IS NULL;
  RETURN FOUND;
END;
$$;

-- Function to resolve alert
CREATE OR REPLACE FUNCTION public.resolve_alert(p_alert_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.system_alerts
  SET resolved_at = NOW(), resolved_by = auth.uid()
  WHERE id = p_alert_id AND resolved_at IS NULL;
  RETURN FOUND;
END;
$$;

-- Cleanup old rate limit records
CREATE OR REPLACE FUNCTION public.cleanup_rate_limits()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted INTEGER;
BEGIN
  DELETE FROM public.rate_limit_records WHERE window_start < NOW() - INTERVAL '7 days';
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$;