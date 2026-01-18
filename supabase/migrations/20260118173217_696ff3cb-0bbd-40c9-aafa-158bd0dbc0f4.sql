-- Add data quality tier to track legacy vs new pipeline data
ALTER TABLE public.chess_benchmark_results 
ADD COLUMN IF NOT EXISTS data_quality_tier TEXT DEFAULT 'legacy';

-- Add stockfish prediction mode to track TCEC unlimited
ALTER TABLE public.chess_benchmark_results 
ADD COLUMN IF NOT EXISTS stockfish_mode TEXT DEFAULT 'cloud_api';

-- Update existing records to mark them as legacy
UPDATE public.chess_benchmark_results 
SET data_quality_tier = 'legacy', stockfish_mode = 'cloud_api' 
WHERE data_quality_tier IS NULL OR data_quality_tier = 'legacy';

-- Add prediction quality tracking to attempts
ALTER TABLE public.chess_prediction_attempts 
ADD COLUMN IF NOT EXISTS data_quality_tier TEXT DEFAULT 'legacy';

-- Add comment explaining tiers
COMMENT ON COLUMN public.chess_benchmark_results.data_quality_tier IS 'legacy = pre-TCEC calibration, tcec_calibrated = TCEC SF17 thresholds, tcec_unlimited = full depth analysis';
COMMENT ON COLUMN public.chess_benchmark_results.stockfish_mode IS 'cloud_api = Lichess cached, tcec_unlimited = max depth local WASM';