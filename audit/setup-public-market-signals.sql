-- ============================================================================
-- En Pensent — Public Market Signals View
-- ============================================================================
--
-- PURPOSE
--   Creates a public, read-only Supabase view that exposes LIVE market
--   predictions for the free trading signals section on enpensent.com.
--   Anyone with the public anon key can read the latest predictions.
--
-- HOW TO RUN
--   1. Open Supabase Dashboard for project ezvfslkjyjsqycztyfxh
--   2. Go to SQL Editor → New Query
--   3. Paste this entire file
--   4. Click Run
--   5. Verify: SELECT * FROM market_signals_public LIMIT 5;
--
-- WHAT IT EXPOSES
--   - Latest prediction per symbol (direction, confidence, archetype)
--   - Prediction metadata (VIX, chess consensus, volume flow, etc.)
--   - Calibrated confidence (v38 isotonic regression)
--   - No PII, no user data, no trading positions
--
-- WHAT IT DOES NOT EXPOSE
--   - User accounts, profiles, or settings
--   - Trading positions, IBKR account info, or order history
--   - Any write access
--
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. PUBLIC VIEW: market_signals_public
--    Exposes the latest prediction per symbol with full metadata.
--    No temporal lag — these are LIVE signals for the public signals page.
-- ----------------------------------------------------------------------------

CREATE OR REPLACE VIEW public.market_signals_public AS
SELECT DISTINCT ON (symbol)
  symbol,
  predicted_direction,
  confidence,
  archetype,
  time_horizon,
  price_at_prediction,
  baseline_direction,
  baseline_confidence,
  prediction_metadata,
  created_at
FROM public.market_prediction_attempts
WHERE
  prediction_metadata IS NOT NULL
  AND predicted_direction IS NOT NULL
  -- v38 AUDIT FIX: Exclude backtest/replay rows from the LIVE signals feed.
  -- historical_replay rows are written with HISTORICAL created_at timestamps,
  -- so a walk-forward backtest row could fall inside the window and win the
  -- DISTINCT ON — publishing a backtest result as a live signal.
  AND prediction_source NOT IN ('historical_replay', 'backtest')
  -- v38 AUDIT FIX: Tightened 7d -> 48h. 48h keeps cards populated across a
  -- weekend gap (Fri close -> Mon pre-open) without presenting multi-day-old
  -- predictions as current signals.
  AND created_at >= (NOW() - INTERVAL '48 hours')
  -- Directional only — 'neutral' carries no tradeable information
  AND predicted_direction IN ('bullish', 'bearish')
ORDER BY symbol, created_at DESC;

GRANT SELECT ON public.market_signals_public TO anon;
GRANT SELECT ON public.market_signals_public TO authenticated;

-- ----------------------------------------------------------------------------
-- 2. PUBLIC VIEW: market_signal_stats
--    Aggregate accuracy stats per symbol (last 30 days, resolved only)
-- ----------------------------------------------------------------------------

CREATE OR REPLACE VIEW public.market_signal_stats AS
SELECT
  symbol,
  COUNT(*) AS total_predictions,
  SUM((ep_correct = true)::int) AS correct_predictions,
  ROUND(100.0 * SUM((ep_correct = true)::int) / NULLIF(COUNT(*), 0), 1) AS accuracy_pct,
  -- v38 AUDIT FIX: confidence is a 0.0-1.0 decimal, so round to 3dp not 1dp
  -- (1dp collapsed 0.284 -> 0.3 and destroyed the published precision).
  ROUND(AVG(confidence)::numeric, 3) AS avg_confidence,
  MAX(created_at) AS latest_prediction
FROM public.market_prediction_attempts
WHERE
  ep_correct IS NOT NULL
  -- v38 AUDIT FIX: LIVE accuracy only. Publishing backtest accuracy as the
  -- live signal track record would misrepresent real-time performance.
  AND prediction_source NOT IN ('historical_replay', 'backtest')
  AND created_at >= (NOW() - INTERVAL '30 days')
GROUP BY symbol
ORDER BY total_predictions DESC;

GRANT SELECT ON public.market_signal_stats TO anon;
GRANT SELECT ON public.market_signal_stats TO authenticated;

-- ----------------------------------------------------------------------------
-- 3. PUBLIC VIEW: market_archetype_stats
--    Accuracy by archetype (chess-market bridge performance)
-- ----------------------------------------------------------------------------

CREATE OR REPLACE VIEW public.market_archetype_stats AS
SELECT
  archetype,
  COUNT(*) AS total_predictions,
  SUM((ep_correct = true)::int) AS correct_predictions,
  ROUND(100.0 * SUM((ep_correct = true)::int) / NULLIF(COUNT(*), 0), 1) AS accuracy_pct,
  -- v38 AUDIT FIX: 0.0-1.0 decimal scale — round to 3dp
  ROUND(AVG(confidence)::numeric, 3) AS avg_confidence
FROM public.market_prediction_attempts
WHERE
  ep_correct IS NOT NULL
  AND archetype IS NOT NULL
  -- v38 AUDIT FIX: LIVE archetype performance only (exclude backtest)
  AND prediction_source NOT IN ('historical_replay', 'backtest')
  AND created_at >= (NOW() - INTERVAL '30 days')
GROUP BY archetype
ORDER BY accuracy_pct DESC;

GRANT SELECT ON public.market_archetype_stats TO anon;
GRANT SELECT ON public.market_archetype_stats TO authenticated;

-- ----------------------------------------------------------------------------
-- DONE. Verify with:
--   SELECT * FROM market_signals_public LIMIT 5;
--   SELECT * FROM market_signal_stats;
--   SELECT * FROM market_archetype_stats;
-- ----------------------------------------------------------------------------
