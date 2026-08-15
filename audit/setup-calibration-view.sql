-- ============================================================================
-- En Pensent — Calibration Metrics View Setup
-- ============================================================================
--
-- PURPOSE
--   Exposes per-bin calibration statistics (Brier, ECE, log-loss components)
--   for both the En Pensent (hybrid) and Stockfish 18 predictors, computed
--   from the public predictions_public view. This lets any reviewer verify
--   that the published accuracy edge is not bought at the cost of poor
--   probability calibration — the metric a platform (e.g. Chess.com) actually
--   buys.
--
-- HOW TO RUN
--   1. Open the Supabase Dashboard SQL Editor for project
--      ezvfslkjyjsqycztyfxh
--   2. Ensure audit/setup-public-view.sql has already been run (it creates
--      predictions_public).
--   3. Paste this entire file and click Run.
--   4. Verify with:
--        SELECT * FROM public.audit_calibration_overall;
--        SELECT * FROM public.audit_calibration_bins ORDER BY predictor, bin_floor;
--
-- WHAT IT EXPOSES
--   - audit_calibration_overall : one row per predictor with Brier, log-loss,
--     ECE, and accuracy aggregated over the full public corpus.
--   - audit_calibration_bins     : per-decile confidence bin statistics so
--     reviewers can plot reliability diagrams.
--
-- NOTES
--   - Confidence columns are stored as integer percentages (0-100). We divide
--     by 100 to get probabilities in [0,1].
--   - Predictions are 3-way (white/black/draw). We treat the predicted
--     outcome's confidence as p_hat and the indicator that the prediction
--     matched actual_result as the binary target y. This is the standard
--     "top-1 confidence" calibration used for multi-class classifiers when
--     the platform surfaces a single win% to users.
--   - For a true 3-vector calibration we would need per-class probabilities,
--     which the public view does not expose. The audit/calibration.mjs script
--     documents this limitation explicitly.
--
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. OVERALL CALIBRATION METRICS (one row per predictor)
-- ----------------------------------------------------------------------------

CREATE OR REPLACE VIEW public.audit_calibration_overall AS
WITH probs AS (
  SELECT
    'en_pensent'::text                              AS predictor,
    (hybrid_confidence / 100.0)::double precision   AS p_hat,
    (hybrid_correct)::int                           AS y
  FROM public.predictions_public
  WHERE hybrid_confidence IS NOT NULL
    AND hybrid_prediction IS NOT NULL
  UNION ALL
  SELECT
    'stockfish_18'::text                            AS predictor,
    (stockfish_confidence / 100.0)::double precision AS p_hat,
    (stockfish_correct)::int                        AS y
  FROM public.predictions_public
  WHERE stockfish_confidence IS NOT NULL
    AND stockfish_prediction IS NOT NULL
),
binned AS (
  SELECT
    predictor,
    COUNT(*)                                                        AS n,
    AVG(p_hat)                                                      AS mean_conf,
    AVG(y)::double precision                                        AS accuracy,
    -- Brier score = mean((p_hat - y)^2)
    AVG((p_hat - y) ^ 2)::double precision                          AS brier,
    -- Log-loss = -mean( y*log(p) + (1-y)*log(1-p) ), clamped
    AVG(
      - (y * LN(LEAST(GREATEST(p_hat, 1e-12), 1 - 1e-12)))
      - ((1 - y) * LN(LEAST(GREATEST(1 - p_hat, 1e-12), 1 - 1e-12)))
    )::double precision                                             AS log_loss
  FROM probs
  GROUP BY predictor
)
SELECT
  b.*,
  -- Expected Calibration Error = sum over bins of |acc - conf| * (n_bin / n)
  -- Computed here as a single-bin approximation; the binned view below gives
  -- the true 10-bin ECE. We expose both so reviewers can cross-check.
  ABS(b.accuracy - b.mean_conf)::double precision                   AS single_bin_ece
FROM binned b;

GRANT SELECT ON public.audit_calibration_overall TO anon;
GRANT SELECT ON public.audit_calibration_overall TO authenticated;

-- ----------------------------------------------------------------------------
-- 2. PER-DECILE CONFIDENCE BINS (reliability diagram data)
-- ----------------------------------------------------------------------------

CREATE OR REPLACE VIEW public.audit_calibration_bins AS
WITH probs AS (
  SELECT
    'en_pensent'::text                              AS predictor,
    (hybrid_confidence / 100.0)::double precision   AS p_hat,
    (hybrid_correct)::int                           AS y
  FROM public.predictions_public
  WHERE hybrid_confidence IS NOT NULL
    AND hybrid_prediction IS NOT NULL
  UNION ALL
  SELECT
    'stockfish_18'::text                            AS predictor,
    (stockfish_confidence / 100.0)::double precision AS p_hat,
    (stockfish_correct)::int                        AS y
  FROM public.predictions_public
  WHERE stockfish_confidence IS NOT NULL
    AND stockfish_prediction IS NOT NULL
),
binned AS (
  SELECT
    predictor,
    FLOOR(p_hat * 10.0) / 10.0                      AS bin_floor,
    COUNT(*)                                        AS n,
    AVG(p_hat)                                      AS mean_conf,
    AVG(y)::double precision                        AS accuracy
  FROM probs
  GROUP BY predictor, FLOOR(p_hat * 10.0) / 10.0
),
totals AS (
  SELECT predictor, SUM(n) AS total_n FROM binned GROUP BY predictor
)
SELECT
  b.predictor,
  b.bin_floor::double precision                     AS bin_floor,
  b.n,
  b.mean_conf::double precision                     AS mean_confidence,
  b.accuracy                                        AS accuracy,
  ABS(b.accuracy - b.mean_conf)::double precision   AS gap,
  (b.n::double precision / t.total_n)               AS bin_weight,
  (ABS(b.accuracy - b.mean_conf) * (b.n::double precision / t.total_n))::double precision AS weighted_gap
FROM binned b
JOIN totals t USING (predictor)
ORDER BY b.predictor, b.bin_floor;

GRANT SELECT ON public.audit_calibration_bins TO anon;
GRANT SELECT ON public.audit_calibration_bins TO authenticated;

-- ----------------------------------------------------------------------------
-- 3. TRUE 10-BIN ECE (convenience view)
-- ----------------------------------------------------------------------------

CREATE OR REPLACE VIEW public.audit_calibration_ece AS
SELECT
  predictor,
  SUM(weighted_gap)::double precision AS ece_10bin
FROM public.audit_calibration_bins
GROUP BY predictor;

GRANT SELECT ON public.audit_calibration_ece TO anon;
GRANT SELECT ON public.audit_calibration_ece TO authenticated;

-- ----------------------------------------------------------------------------
-- DONE. Verify with:
--   SELECT * FROM public.audit_calibration_overall;
--   SELECT * FROM public.audit_calibration_ece;
--   SELECT * FROM public.audit_calibration_bins ORDER BY predictor, bin_floor;
-- ----------------------------------------------------------------------------
