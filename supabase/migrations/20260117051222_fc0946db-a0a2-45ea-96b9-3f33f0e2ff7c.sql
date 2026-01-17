-- =============================================
-- 1. SECURITY HARDENING: Fix function search paths
-- =============================================

-- Fix acknowledge_alert function
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

-- Fix resolve_alert function
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

-- Fix calculate_portfolio_value function
CREATE OR REPLACE FUNCTION public.calculate_portfolio_value(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_cents INTEGER;
BEGIN
  SELECT COALESCE(SUM(
    FLOOR(vs.total_score * 10) +
    FLOOR(vs.royalty_cents_earned)
  ), 0)::INTEGER INTO v_total_cents
  FROM saved_visualizations sv
  JOIN vision_scores vs ON vs.visualization_id = sv.id
  WHERE sv.user_id = p_user_id;
  
  RETURN v_total_cents;
END;
$$;

-- Fix can_transfer_visualization function  
CREATE OR REPLACE FUNCTION public.can_transfer_visualization(p_visualization_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  transfer_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO transfer_count
  FROM visualization_transfers
  WHERE visualization_id = p_visualization_id
    AND created_at > (now() - INTERVAL '24 hours');
  
  RETURN transfer_count < 3;
END;
$$;

-- =============================================
-- 2. CREATE SYSTEM VITALS TABLE FOR UNIFIED HEALTH
-- =============================================

CREATE TABLE IF NOT EXISTS public.system_vitals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vital_name TEXT UNIQUE NOT NULL,
  vital_type TEXT NOT NULL DEFAULT 'heartbeat',
  last_pulse_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  pulse_count BIGINT DEFAULT 0,
  status TEXT DEFAULT 'unknown',
  last_value NUMERIC DEFAULT 0,
  target_value NUMERIC DEFAULT 1,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.system_vitals ENABLE ROW LEVEL SECURITY;

-- Policies for system vitals
CREATE POLICY "Public can read system vitals" 
ON public.system_vitals FOR SELECT USING (true);

CREATE POLICY "Service can manage system vitals" 
ON public.system_vitals FOR ALL 
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- =============================================
-- 3. ADD UNIQUE CONSTRAINT TO EVOLUTION_STATE
-- =============================================

ALTER TABLE public.evolution_state 
ADD CONSTRAINT evolution_state_state_type_key UNIQUE (state_type);

-- =============================================
-- 4. CREATE PULSE FUNCTION (heartbeat update)
-- =============================================

CREATE OR REPLACE FUNCTION public.pulse_vital(
  p_vital_name TEXT,
  p_status TEXT DEFAULT 'healthy',
  p_value NUMERIC DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.system_vitals
  SET 
    last_pulse_at = now(),
    pulse_count = pulse_count + 1,
    status = p_status,
    last_value = COALESCE(p_value, last_value),
    metadata = CASE WHEN p_metadata IS NOT NULL THEN metadata || p_metadata ELSE metadata END,
    updated_at = now()
  WHERE vital_name = p_vital_name;
  
  IF NOT FOUND THEN
    INSERT INTO public.system_vitals (vital_name, status, last_value, metadata)
    VALUES (p_vital_name, p_status, COALESCE(p_value, 0), COALESCE(p_metadata, '{}'));
  END IF;
END;
$$;

-- =============================================
-- 5. CREATE GET SYSTEM VITALS FUNCTION
-- =============================================

CREATE OR REPLACE FUNCTION public.get_system_vitals()
RETURNS TABLE (
  vital_name TEXT,
  vital_type TEXT,
  status TEXT,
  last_pulse_at TIMESTAMP WITH TIME ZONE,
  seconds_since_pulse NUMERIC,
  pulse_count BIGINT,
  last_value NUMERIC,
  target_value NUMERIC,
  is_healthy BOOLEAN,
  metadata JSONB
)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sv.vital_name,
    sv.vital_type,
    sv.status,
    sv.last_pulse_at,
    EXTRACT(EPOCH FROM (now() - sv.last_pulse_at))::NUMERIC as seconds_since_pulse,
    sv.pulse_count,
    sv.last_value,
    sv.target_value,
    CASE 
      WHEN sv.vital_type = 'heartbeat' THEN 
        EXTRACT(EPOCH FROM (now() - sv.last_pulse_at)) < 
          COALESCE((sv.metadata->>'interval_ms')::NUMERIC / 1000 * 3, 60)
      WHEN sv.vital_type = 'metric' THEN 
        sv.last_value >= sv.target_value * 0.8
      ELSE sv.status = 'healthy'
    END as is_healthy,
    sv.metadata
  FROM public.system_vitals sv
  ORDER BY sv.vital_type, sv.vital_name;
END;
$$;