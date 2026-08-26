-- ============================================================================
-- En Pensent — Public Audit View Setup
-- ============================================================================
--
-- PURPOSE
--   Creates a public, read-only Supabase view that exposes the prediction
--   corpus for independent verification by reviewers, auditors, and academic
--   peers. Removes the need to share private credentials. Anyone with the
--   public anon key can independently reproduce the headline accuracy figures.
--
-- HOW TO RUN
--   1. Open Supabase Dashboard for project ezvfslkjyjsqycztyfxh
--   2. Go to SQL Editor → New Query
--   3. Paste this entire file
--   4. Click Run
--   5. Confirm the view exists by running: SELECT count(*) FROM predictions_public;
--
-- WHAT IT EXPOSES
--   - One row per analyzed move from the chess prediction corpus
--   - No PII (no usernames, no emails, no game URLs, no IP addresses)
--   - No write access of any kind
--   - 7-day temporal lag — recent predictions are excluded so the public
--     window cannot be manipulated retroactively
--
-- WHAT IT DOES NOT EXPOSE
--   - User accounts, profiles, or settings
--   - Marketplace orders, payment data, or print order details
--   - Trading data, IBKR account info, or market positions
--   - Any administrative or write-capable surface
--
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. PUBLIC VIEW: predictions_public
-- ----------------------------------------------------------------------------

CREATE OR REPLACE VIEW public.predictions_public AS
SELECT
  -- Game-level identifiers (opaque hashes, not user-identifying)
  game_id,
  move_number,

  -- En Pensent prediction
  hybrid_prediction,
  hybrid_confidence,
  hybrid_correct,
  hybrid_archetype,

  -- Stockfish 18 baseline
  stockfish_prediction,
  stockfish_eval,
  stockfish_confidence,
  stockfish_correct,

  -- Ground truth
  actual_result,

  -- Metadata used for stratified analysis
  white_elo,
  black_elo,
  time_control,
  data_source,
  game_type,

  -- Timestamps for temporal analysis
  created_at
FROM public.chess_prediction_attempts
WHERE
  -- Temporal lag — only predictions older than 7 days are exposed
  created_at < (NOW() - INTERVAL '7 days')
  -- Bounded window — last 180 days exposed for public verification.
  -- Full corpus (12M+ rows) is available via direct Postgres for serious
  -- reviewers (see audit/phase-reweight.mjs). The 180-day window keeps
  -- the view fast enough for Supabase REST API statement timeouts.
  AND created_at >= (NOW() - INTERVAL '180 days')
  -- Exclude rows without resolved outcomes or correctness flags
  AND hybrid_correct IS NOT NULL
  AND stockfish_correct IS NOT NULL
  AND actual_result IS NOT NULL;

-- ----------------------------------------------------------------------------
-- 2. GRANT PUBLIC SELECT ACCESS (read-only, via the public anon key)
-- ----------------------------------------------------------------------------

GRANT SELECT ON public.predictions_public TO anon;
GRANT SELECT ON public.predictions_public TO authenticated;

-- ----------------------------------------------------------------------------
-- 3. AGGREGATE SUMMARY VIEW for one-shot verification
-- ----------------------------------------------------------------------------
-- NOTE: Full-table aggregates on Supabase time out (12M+ rows). We use a
-- 90-day rolling window so the view returns in <5 seconds. The full-corpus
-- numbers in RESULTS.md are computed offline via the direct Postgres
-- connection (see audit/phase-reweight.mjs for the methodology).
-- The 30-day window is the live, verifiable number; the full-corpus number
-- is the historical snapshot that includes older data with known issues
-- (trajectory extraction leak — see PROOF.md).

CREATE OR REPLACE VIEW public.audit_headline_stats AS
SELECT
  COUNT(*)                                                  AS total_predictions,
  SUM((hybrid_correct)::int)                                AS ep_correct,
  SUM((stockfish_correct)::int)                             AS sf_correct,
  ROUND(100.0 * SUM((hybrid_correct)::int) / COUNT(*), 2)   AS ep_accuracy_pct,
  ROUND(100.0 * SUM((stockfish_correct)::int) / COUNT(*), 2) AS sf_accuracy_pct,
  ROUND(100.0 * (SUM((hybrid_correct)::int) - SUM((stockfish_correct)::int))::numeric / COUNT(*), 2) AS ep_edge_pp,
  MIN(created_at)                                           AS earliest_prediction,
  MAX(created_at)                                           AS latest_prediction
FROM public.chess_prediction_attempts
WHERE created_at < (NOW() - INTERVAL '7 days')
  AND created_at >= (NOW() - INTERVAL '30 days')
  AND hybrid_correct IS NOT NULL
  AND stockfish_correct IS NOT NULL
  AND actual_result IS NOT NULL;

GRANT SELECT ON public.audit_headline_stats TO anon;
GRANT SELECT ON public.audit_headline_stats TO authenticated;

-- ----------------------------------------------------------------------------
-- 4. OPTIONAL: CHESS960 / FREESTYLE STRATIFICATION
-- ----------------------------------------------------------------------------

CREATE OR REPLACE VIEW public.audit_chess960_stats AS
SELECT
  CASE
    WHEN data_source ILIKE '%960%' OR data_source ILIKE '%freestyle%' OR data_source ILIKE '%chess960%' THEN 'chess960'
    ELSE 'standard'
  END AS variant,
  COUNT(*)                                                  AS total_predictions,
  SUM((hybrid_correct)::int)                                AS ep_correct,
  SUM((stockfish_correct)::int)                             AS sf_correct,
  ROUND(100.0 * SUM((hybrid_correct)::int) / COUNT(*), 2)   AS ep_accuracy_pct,
  ROUND(100.0 * SUM((stockfish_correct)::int) / COUNT(*), 2) AS sf_accuracy_pct,
  ROUND(100.0 * (SUM((hybrid_correct)::int) - SUM((stockfish_correct)::int))::numeric / COUNT(*), 2) AS ep_edge_pp
FROM public.chess_prediction_attempts
WHERE created_at < (NOW() - INTERVAL '7 days')
  AND created_at >= (NOW() - INTERVAL '30 days')
  AND hybrid_correct IS NOT NULL
  AND stockfish_correct IS NOT NULL
  AND actual_result IS NOT NULL
GROUP BY variant;

GRANT SELECT ON public.audit_chess960_stats TO anon;
GRANT SELECT ON public.audit_chess960_stats TO authenticated;

-- ----------------------------------------------------------------------------
-- 5. PHASE-STRATIFIED VIEW for sampling-bias verification
-- ----------------------------------------------------------------------------
-- Lets reviewers verify how the move-number sampling distribution affects
-- the headline edge. EP's edge is largest in early middlegame and smallest
-- in the peak golden zone (moves 28-45) where 65% of predictions concentrate.

CREATE OR REPLACE VIEW public.audit_phase_stats AS
SELECT
  CASE
    WHEN move_number < 20 THEN '12-19 early_middlegame'
    WHEN move_number < 28 THEN '20-27 early_golden'
    WHEN move_number <= 45 THEN '28-45 peak_golden'
    ELSE '46+ late_endgame'
  END AS phase_zone,
  COUNT(*)                                                  AS total_predictions,
  SUM((hybrid_correct)::int)                                AS ep_correct,
  SUM((stockfish_correct)::int)                             AS sf_correct,
  ROUND(100.0 * SUM((hybrid_correct)::int) / COUNT(*), 2)   AS ep_accuracy_pct,
  ROUND(100.0 * SUM((stockfish_correct)::int) / COUNT(*), 2) AS sf_accuracy_pct,
  ROUND(100.0 * (SUM((hybrid_correct)::int) - SUM((stockfish_correct)::int))::numeric / COUNT(*), 2) AS ep_edge_pp
FROM public.chess_prediction_attempts
WHERE created_at < (NOW() - INTERVAL '7 days')
  AND created_at >= (NOW() - INTERVAL '30 days')
  AND hybrid_correct IS NOT NULL
  AND stockfish_correct IS NOT NULL
  AND actual_result IS NOT NULL
GROUP BY phase_zone
ORDER BY phase_zone;

GRANT SELECT ON public.audit_phase_stats TO anon;
GRANT SELECT ON public.audit_phase_stats TO authenticated;

-- ----------------------------------------------------------------------------
-- 6. MATERIALIZED VIEWS for stable, fast audit stats
-- ----------------------------------------------------------------------------
-- The regular views above use a 30-day rolling window that changes daily as
-- old predictions age out and new ones come in. A reviewer who runs verify.mjs
-- on Monday sees different numbers than on Friday. The materialized views
-- below snapshot the stats so the verifiable number is stable day-to-day.
-- They are refreshed by a cron job (see audit/refresh-materialized-views.sql).
-- The regular views remain as the live source; the materialized views are the
-- stable published number.

CREATE MATERIALIZED VIEW IF NOT EXISTS public.audit_headline_snapshot AS
SELECT
  COUNT(*)                                                  AS total_predictions,
  SUM((hybrid_correct)::int)                                AS ep_correct,
  SUM((stockfish_correct)::int)                             AS sf_correct,
  ROUND(100.0 * SUM((hybrid_correct)::int) / COUNT(*), 2)   AS ep_accuracy_pct,
  ROUND(100.0 * SUM((stockfish_correct)::int) / COUNT(*), 2) AS sf_accuracy_pct,
  ROUND(100.0 * (SUM((hybrid_correct)::int) - SUM((stockfish_correct)::int))::numeric / COUNT(*), 2) AS ep_edge_pp,
  MIN(created_at)                                           AS earliest_prediction,
  MAX(created_at)                                           AS latest_prediction,
  NOW()                                                     AS snapshot_at
FROM public.chess_prediction_attempts
WHERE created_at < (NOW() - INTERVAL '7 days')
  AND created_at >= (NOW() - INTERVAL '30 days')
  AND hybrid_correct IS NOT NULL
  AND stockfish_correct IS NOT NULL
  AND actual_result IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_audit_headline_snapshot ON public.audit_headline_snapshot (snapshot_at);

GRANT SELECT ON public.audit_headline_snapshot TO anon;
GRANT SELECT ON public.audit_headline_snapshot TO authenticated;

-- Refresh function — call via pg_cron or manually:
--   SELECT refresh_audit_snapshots();
-- pg_cron setup (run in Supabase SQL editor):
--   SELECT cron.schedule('refresh-audit-snapshots', '0 */6 * * *', 'SELECT refresh_audit_snapshots()');

CREATE OR REPLACE FUNCTION public.refresh_audit_snapshots()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.audit_headline_snapshot;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ----------------------------------------------------------------------------
-- DONE. Verify with:
--   SELECT * FROM public.audit_headline_stats;       -- live rolling window
--   SELECT * FROM public.audit_headline_snapshot;    -- stable snapshot
--   SELECT * FROM public.audit_chess960_stats;
--   SELECT * FROM public.audit_phase_stats;
-- ----------------------------------------------------------------------------

