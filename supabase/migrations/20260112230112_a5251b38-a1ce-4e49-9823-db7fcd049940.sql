-- Create education fund tracking table
CREATE TABLE public.education_fund (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  source_user_id UUID,
  forfeited_value_cents INTEGER NOT NULL DEFAULT 0,
  platform_fee_cents INTEGER NOT NULL DEFAULT 0,
  fund_contribution_cents INTEGER NOT NULL DEFAULT 0,
  visions_released INTEGER NOT NULL DEFAULT 0,
  event_type TEXT NOT NULL DEFAULT 'subscription_lapse',
  notes TEXT
);

-- Create cumulative fund stats view
CREATE OR REPLACE VIEW public.education_fund_stats AS
SELECT 
  COUNT(*) as total_contributions,
  COALESCE(SUM(forfeited_value_cents), 0) as total_forfeited_value_cents,
  COALESCE(SUM(platform_fee_cents), 0) as total_platform_fee_cents,
  COALESCE(SUM(fund_contribution_cents), 0) as total_fund_cents,
  COALESCE(SUM(visions_released), 0) as total_visions_released,
  FLOOR(COALESCE(SUM(fund_contribution_cents), 0) / 700) as scholarships_funded
FROM public.education_fund;

-- Enable RLS
ALTER TABLE public.education_fund ENABLE ROW LEVEL SECURITY;

-- Anyone can view the fund (transparency)
CREATE POLICY "Anyone can view education fund" 
ON public.education_fund 
FOR SELECT 
USING (true);

-- Only service role can insert
CREATE POLICY "Service role can insert to education fund" 
ON public.education_fund 
FOR INSERT 
WITH CHECK (true);

-- Create function to calculate vision portfolio value
CREATE OR REPLACE FUNCTION public.calculate_portfolio_value(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_total_cents INTEGER;
BEGIN
  -- Calculate total value based on vision scores and print revenue
  SELECT COALESCE(SUM(
    -- Base value from score (1 point = $0.10)
    FLOOR(vs.total_score * 10) +
    -- Add actual print revenue earned (80% royalty)
    FLOOR(vs.royalty_cents_earned)
  ), 0)::INTEGER INTO v_total_cents
  FROM saved_visualizations sv
  JOIN vision_scores vs ON vs.visualization_id = sv.id
  WHERE sv.user_id = p_user_id;
  
  RETURN v_total_cents;
END;
$$;

-- Update release_user_visions to return value info
CREATE OR REPLACE FUNCTION public.release_user_visions_with_value(p_user_id UUID)
RETURNS TABLE(released_count INTEGER, forfeited_value_cents INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_released_count INTEGER;
  v_forfeited_value INTEGER;
BEGIN
  -- Calculate portfolio value before release
  v_forfeited_value := calculate_portfolio_value(p_user_id);
  
  -- Cancel any active listings for this user's visions
  UPDATE visualization_listings
  SET status = 'cancelled', updated_at = now()
  WHERE seller_id = p_user_id AND status = 'active';
  
  -- Set visualizations to have NULL user_id (orphaned/claimable)
  UPDATE saved_visualizations
  SET user_id = NULL, updated_at = now()
  WHERE user_id = p_user_id;
  
  GET DIAGNOSTICS v_released_count = ROW_COUNT;
  
  RETURN QUERY SELECT v_released_count, v_forfeited_value;
END;
$$;