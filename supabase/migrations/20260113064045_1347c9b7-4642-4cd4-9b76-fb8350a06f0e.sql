-- Create security audit log table
CREATE TABLE public.security_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL,
  action_category TEXT NOT NULL DEFAULT 'general',
  target_type TEXT,
  target_id TEXT,
  ip_address TEXT,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}',
  severity TEXT NOT NULL DEFAULT 'info',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for fast querying
CREATE INDEX idx_security_audit_user_id ON public.security_audit_log(user_id);
CREATE INDEX idx_security_audit_admin_id ON public.security_audit_log(admin_id);
CREATE INDEX idx_security_audit_action_type ON public.security_audit_log(action_type);
CREATE INDEX idx_security_audit_action_category ON public.security_audit_log(action_category);
CREATE INDEX idx_security_audit_created_at ON public.security_audit_log(created_at DESC);
CREATE INDEX idx_security_audit_severity ON public.security_audit_log(severity);

-- Enable RLS
ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can read audit logs
CREATE POLICY "Admins can read audit logs"
ON public.security_audit_log
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- System can insert audit logs
CREATE POLICY "System can insert audit logs"
ON public.security_audit_log
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Create user location analytics table
CREATE TABLE public.user_location_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  country TEXT,
  country_code TEXT,
  region TEXT,
  city TEXT,
  timezone TEXT,
  latitude DECIMAL(9,6),
  longitude DECIMAL(9,6),
  ip_hash TEXT,
  last_seen_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Create indexes
CREATE INDEX idx_user_location_country ON public.user_location_analytics(country_code);
CREATE INDEX idx_user_location_region ON public.user_location_analytics(region);
CREATE INDEX idx_user_location_city ON public.user_location_analytics(city);
CREATE INDEX idx_user_location_last_seen ON public.user_location_analytics(last_seen_at DESC);

-- Enable RLS
ALTER TABLE public.user_location_analytics ENABLE ROW LEVEL SECURITY;

-- Only admins can read location analytics
CREATE POLICY "Admins can read location analytics"
ON public.user_location_analytics
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- System can insert/update location
CREATE POLICY "System can insert location"
ON public.user_location_analytics
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "System can update own location"
ON public.user_location_analytics
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Create function to log security events
CREATE OR REPLACE FUNCTION public.log_security_event(
  p_action_type TEXT,
  p_action_category TEXT DEFAULT 'general',
  p_user_id UUID DEFAULT NULL,
  p_admin_id UUID DEFAULT NULL,
  p_target_type TEXT DEFAULT NULL,
  p_target_id TEXT DEFAULT NULL,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}',
  p_severity TEXT DEFAULT 'info'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO public.security_audit_log (
    user_id, admin_id, action_type, action_category, target_type, target_id,
    ip_address, user_agent, metadata, severity
  ) VALUES (
    p_user_id, p_admin_id, p_action_type, p_action_category, p_target_type, p_target_id,
    p_ip_address, p_user_agent, p_metadata, p_severity
  ) RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$;

-- Enable realtime for audit logs
ALTER PUBLICATION supabase_realtime ADD TABLE public.security_audit_log;