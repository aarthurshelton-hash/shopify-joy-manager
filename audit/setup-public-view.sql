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
  total_moves_in_game,

  -- Timestamps for temporal analysis
  created_at
FROM public.chess_prediction_attempts
WHERE
  -- Temporal lag — only predictions older than 7 days are exposed
  created_at < (NOW() - INTERVAL '7 days')
  -- Exclude any rows that were marked invalid during QA
  AND COALESCE(invalid, FALSE) = FALSE;

-- ----------------------------------------------------------------------------
-- 2. GRANT PUBLIC SELECT ACCESS (read-only, via the public anon key)
-- ----------------------------------------------------------------------------

GRANT SELECT ON public.predictions_public TO anon;
GRANT SELECT ON public.predictions_public TO authenticated;

-- ----------------------------------------------------------------------------
-- 3. OPTIONAL: AGGREGATE SUMMARY VIEW for one-shot verification
-- ----------------------------------------------------------------------------

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
FROM public.predictions_public;

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
FROM public.predictions_public
GROUP BY variant;

GRANT SELECT ON public.audit_chess960_stats TO anon;
GRANT SELECT ON public.audit_chess960_stats TO authenticated;

-- ----------------------------------------------------------------------------
-- DONE. Verify with:
--   SELECT * FROM public.audit_headline_stats;
--   SELECT * FROM public.audit_chess960_stats;
-- ----------------------------------------------------------------------------
