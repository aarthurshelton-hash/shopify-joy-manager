
-- Fix SECURITY DEFINER views by recreating them as SECURITY INVOKER
-- This prevents privilege escalation attacks

-- 1. Drop and recreate education_fund_stats
DROP VIEW IF EXISTS public.education_fund_stats;
CREATE VIEW public.education_fund_stats 
WITH (security_invoker = true) AS
SELECT 
  count(*) AS total_contributions,
  COALESCE(sum(forfeited_value_cents), 0::bigint) AS total_forfeited_value_cents,
  COALESCE(sum(platform_fee_cents), 0::bigint) AS total_platform_fee_cents,
  COALESCE(sum(fund_contribution_cents), 0::bigint) AS total_fund_cents,
  COALESCE(sum(visions_released), 0::bigint) AS total_visions_released,
  floor((COALESCE(sum(fund_contribution_cents), 0::bigint) / 700)::double precision) AS scholarships_funded
FROM education_fund;

-- 2. Drop and recreate scan_leaderboard
DROP VIEW IF EXISTS public.scan_leaderboard;
CREATE VIEW public.scan_leaderboard 
WITH (security_invoker = true) AS
SELECT 
  sh.user_id,
  p.display_name,
  p.avatar_url,
  count(DISTINCT sh.visualization_id) FILTER (WHERE sh.matched = true) AS unique_visions_scanned,
  count(*) FILTER (WHERE sh.matched = true) AS total_successful_scans,
  count(*) AS total_scans,
  max(sh.scanned_at) AS last_scan_at
FROM scan_history sh
JOIN profiles p ON p.user_id = sh.user_id
WHERE sh.user_id IS NOT NULL
GROUP BY sh.user_id, p.display_name, p.avatar_url
ORDER BY unique_visions_scanned DESC, total_successful_scans DESC;

-- 3. Drop and recreate profit_pools_summary
DROP VIEW IF EXISTS public.profit_pools_summary;
CREATE VIEW public.profit_pools_summary 
WITH (security_invoker = true) AS
SELECT 'Total Extractable Profit'::text AS metric,
  COALESCE(sum(total_extractable_cents), 0::bigint) AS value_cents,
  'company_reserve'::text AS pool_type
FROM revenue_stream_summary
UNION ALL
SELECT 'Gamecard Pool Value'::text AS metric,
  COALESCE(sum(earned_value_cents + base_value_cents), 0::bigint) AS value_cents,
  'gamecard'::text AS pool_type
FROM gamecard_value_pool
UNION ALL
SELECT 'Palette Pool Value'::text AS metric,
  COALESCE(sum(earned_value_cents + base_value_cents), 0::bigint) AS value_cents,
  'palette'::text AS pool_type
FROM palette_value_pool
UNION ALL
SELECT 'Opening Pool Value'::text AS metric,
  COALESCE(sum(earned_value_cents + base_value_cents), 0::bigint) AS value_cents,
  'opening'::text AS pool_type
FROM opening_value_pool;

-- 4. Drop and recreate live_economics_summary
DROP VIEW IF EXISTS public.live_economics_summary;
CREATE VIEW public.live_economics_summary 
WITH (security_invoker = true) AS
SELECT 
  (SELECT COALESCE(sum(extractable_profit_cents), 0::bigint) FROM company_profit_pool) AS total_extractable_cents,
  (SELECT COALESCE(sum(reinvested_cents), 0::bigint) FROM company_profit_pool) AS total_reinvested_cents,
  (SELECT COALESCE(sum(stripe_fees_cents), 0::bigint) FROM company_profit_pool) AS total_stripe_fees_cents,
  (SELECT COALESCE(sum(tax_collected_cents), 0::bigint) FROM company_profit_pool) AS total_tax_collected_cents,
  (SELECT COALESCE(sum(gross_revenue_cents), 0::bigint) FROM company_profit_pool) AS total_gross_revenue_cents,
  (SELECT COALESCE(sum(net_profit_cents), 0::bigint) FROM company_profit_pool) AS total_net_profit_cents,
  (SELECT COALESCE(sum(earned_value_cents), 0::bigint) FROM gamecard_value_pool) AS gamecard_pool_total_cents,
  (SELECT COALESCE(sum(earned_value_cents), 0::bigint) FROM palette_value_pool) AS palette_pool_total_cents,
  (SELECT COALESCE(sum(earned_value_cents), 0::bigint) FROM opening_value_pool) AS opening_pool_total_cents,
  (SELECT count(*) FROM gamecard_value_pool WHERE earned_value_cents > 0) AS active_gamecards,
  (SELECT count(*) FROM palette_value_pool WHERE earned_value_cents > 0) AS active_palettes,
  (SELECT count(*) FROM opening_value_pool WHERE earned_value_cents > 0) AS active_openings,
  (SELECT count(*) FROM user_wallets WHERE balance_cents > 0) AS wallets_with_balance,
  (SELECT COALESCE(sum(balance_cents), 0::bigint) FROM user_wallets) AS total_wallet_balance_cents,
  (SELECT COALESCE(sum(total_earned_cents), 0::bigint) FROM user_wallets) AS total_user_earnings_cents;

-- Grant access to authenticated users
GRANT SELECT ON public.education_fund_stats TO authenticated;
GRANT SELECT ON public.scan_leaderboard TO authenticated;
GRANT SELECT ON public.profit_pools_summary TO authenticated;
GRANT SELECT ON public.live_economics_summary TO authenticated;
