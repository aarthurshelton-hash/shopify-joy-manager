-- Fix the security definer view by making it invoker
DROP VIEW IF EXISTS public.education_fund_stats;

CREATE VIEW public.education_fund_stats 
WITH (security_invoker = true)
AS
SELECT 
  COUNT(*) as total_contributions,
  COALESCE(SUM(forfeited_value_cents), 0) as total_forfeited_value_cents,
  COALESCE(SUM(platform_fee_cents), 0) as total_platform_fee_cents,
  COALESCE(SUM(fund_contribution_cents), 0) as total_fund_cents,
  COALESCE(SUM(visions_released), 0) as total_visions_released,
  FLOOR(COALESCE(SUM(fund_contribution_cents), 0) / 700) as scholarships_funded
FROM public.education_fund;

-- Fix the permissive INSERT policy - restrict to service role only
DROP POLICY IF EXISTS "Service role can insert to education fund" ON public.education_fund;

-- No insert policy needed for regular users - only service role (which bypasses RLS) can insert