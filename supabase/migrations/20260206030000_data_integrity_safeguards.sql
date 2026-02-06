-- ============================================================
-- DATA INTEGRITY SAFEGUARDS FOR SCALED BENCHMARKING
-- Run this migration to enforce data quality at the database level
-- ============================================================

-- 1. Add constraints to chess_prediction_attempts for data integrity
ALTER TABLE public.chess_prediction_attempts
ADD CONSTRAINT valid_game_id_format CHECK (
  game_id ~ '^[a-zA-Z0-9_-]+$' AND LENGTH(game_id) >= 8
);

-- 2. Add FEN format validation (basic check for 6 space-separated parts)
ALTER TABLE public.chess_prediction_attempts
ADD CONSTRAINT valid_fen_format CHECK (
  fen IS NULL OR 
  (LENGTH(fen) > 20 AND fen ~ '^[rnbqkpRNBQKP1-8/]+ [wb] [KQkq-]+ [a-h36-] \d+ \d+$')
);

-- 3. Ensure prediction values are valid
ALTER TABLE public.chess_prediction_attempts
ADD CONSTRAINT valid_hybrid_prediction CHECK (
  hybrid_prediction IN ('white_wins', 'black_wins', 'draw')
);

ALTER TABLE public.chess_prediction_attempts
ADD CONSTRAINT valid_stockfish_prediction CHECK (
  stockfish_prediction IN ('white_wins', 'black_wins', 'draw')
);

ALTER TABLE public.chess_prediction_attempts
ADD CONSTRAINT valid_actual_result CHECK (
  actual_result IN ('white_wins', 'black_wins', 'draw')
);

-- 4. Ensure confidence values are in valid range
ALTER TABLE public.chess_prediction_attempts
ADD CONSTRAINT valid_hybrid_confidence CHECK (
  hybrid_confidence >= 0 AND hybrid_confidence <= 100
);

ALTER TABLE public.chess_prediction_attempts
ADD CONSTRAINT valid_stockfish_confidence CHECK (
  stockfish_confidence >= 0 AND stockfish_confidence <= 100
);

-- 5. Data quality tier validation
ALTER TABLE public.chess_prediction_attempts
ADD CONSTRAINT valid_data_quality_tier CHECK (
  data_quality_tier IS NULL OR
  data_quality_tier IN (
    'high_confidence',    -- Web: High quality, validated
    'medium_confidence',  -- Web: Good quality
    'low_confidence',     -- Web: Acceptable but low confidence
    'terminal_live',      -- Terminal: Real-time terminal worker
    'legacy',             -- Old data before tier system
    'farm_generated',     -- Simulated/backup data (should be rare)
    'puzzle_source'       -- From puzzle database
  )
);

-- 6. Add trigger to auto-set data_quality_tier if NULL
CREATE OR REPLACE FUNCTION public.set_default_data_quality_tier()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.data_quality_tier IS NULL THEN
    NEW.data_quality_tier := 'legacy';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS ensure_data_quality_tier ON public.chess_prediction_attempts;
CREATE TRIGGER ensure_data_quality_tier
  BEFORE INSERT ON public.chess_prediction_attempts
  FOR EACH ROW
  EXECUTE FUNCTION public.set_default_data_quality_tier();

-- 7. Add trigger to validate position hash format
CREATE OR REPLACE FUNCTION public.validate_position_hash()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.position_hash IS NOT NULL AND NOT NEW.position_hash ~ '^[a-f0-9]{16}$' THEN
    RAISE EXCEPTION 'Invalid position hash format: %', NEW.position_hash;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS validate_position_hash_trigger ON public.chess_prediction_attempts;
CREATE TRIGGER validate_position_hash_trigger
  BEFORE INSERT OR UPDATE ON public.chess_prediction_attempts
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_position_hash();

-- 8. Create index for faster duplicate detection
CREATE INDEX IF NOT EXISTS idx_chess_prediction_attempts_game_id 
ON public.chess_prediction_attempts(game_id);

-- 9. Create composite index for common queries
CREATE INDEX IF NOT EXISTS idx_chess_prediction_attempts_created_source 
ON public.chess_prediction_attempts(created_at DESC, data_source);

-- 10. Create index for data quality tier queries
CREATE INDEX IF NOT EXISTS idx_chess_prediction_attempts_quality_tier 
ON public.chess_prediction_attempts(data_quality_tier) 
WHERE data_quality_tier IS NOT NULL;

-- 11. Add function to get data quality summary
CREATE OR REPLACE FUNCTION public.get_data_quality_summary(
  p_hours_back INTEGER DEFAULT 24
)
RETURNS TABLE (
  data_quality_tier TEXT,
  count BIGINT,
  percentage NUMERIC
) AS $$
DECLARE
  total_count BIGINT;
BEGIN
  SELECT COUNT(*) INTO total_count
  FROM public.chess_prediction_attempts
  WHERE created_at >= NOW() - (p_hours_back || ' hours')::INTERVAL;
  
  RETURN QUERY
  SELECT 
    COALESCE(c.data_quality_tier, 'NULL') as data_quality_tier,
    COUNT(*)::BIGINT as count,
    ROUND(COUNT(*)::NUMERIC * 100 / NULLIF(total_count, 0), 2) as percentage
  FROM public.chess_prediction_attempts c
  WHERE c.created_at >= NOW() - (p_hours_back || ' hours')::INTERVAL
  GROUP BY c.data_quality_tier
  ORDER BY count DESC;
END;
$$ LANGUAGE plpgsql;

-- 12. Add function to detect duplicate game_ids (for monitoring)
CREATE OR REPLACE FUNCTION public.find_duplicate_game_ids(
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  game_id TEXT,
  occurrence_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.game_id,
    COUNT(*)::BIGINT as occurrence_count
  FROM public.chess_prediction_attempts c
  GROUP BY c.game_id
  HAVING COUNT(*) > 1
  ORDER BY occurrence_count DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- 13. Create materialized view for quick stats
CREATE MATERIALIZED VIEW IF NOT EXISTS public.chess_benchmark_stats AS
SELECT 
  COUNT(*) as total_predictions,
  COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '24 hours') as predictions_24h,
  COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '1 hour') as predictions_1h,
  COUNT(DISTINCT data_source) as unique_sources,
  MIN(created_at) as first_prediction,
  MAX(created_at) as last_prediction
FROM public.chess_prediction_attempts;

-- Create index on materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_chess_benchmark_stats_singleton 
ON public.chess_benchmark_stats((total_predictions));

-- 14. Add function to refresh materialized view
CREATE OR REPLACE FUNCTION public.refresh_benchmark_stats()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.chess_benchmark_stats;
END;
$$ LANGUAGE plpgsql;

-- 15. Add RLS policy to prevent accidental deletes from web workers
ALTER TABLE public.chess_prediction_attempts ENABLE ROW LEVEL SECURITY;

-- Allow all reads
CREATE POLICY "Allow all reads" ON public.chess_prediction_attempts
  FOR SELECT USING (true);

-- Allow inserts from authenticated users (web system)
CREATE POLICY "Allow inserts" ON public.chess_prediction_attempts
  FOR INSERT WITH CHECK (true);

-- Prevent deletes except for admins
CREATE POLICY "Prevent deletes" ON public.chess_prediction_attempts
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE user_profiles.id = auth.uid() 
      AND user_profiles.role = 'admin'
    )
  );

-- 16. Create audit log table for data integrity events
CREATE TABLE IF NOT EXISTS public.data_integrity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'critical')),
  game_id TEXT,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Index for audit log queries
CREATE INDEX IF NOT EXISTS idx_data_integrity_log_created 
ON public.data_integrity_log(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_data_integrity_log_event_type 
ON public.data_integrity_log(event_type);

-- 17. Add function to log integrity events
CREATE OR REPLACE FUNCTION public.log_integrity_event(
  p_event_type TEXT,
  p_severity TEXT,
  p_game_id TEXT DEFAULT NULL,
  p_details JSONB DEFAULT '{}'
)
RETURNS void AS $$
BEGIN
  INSERT INTO public.data_integrity_log (event_type, severity, game_id, details)
  VALUES (p_event_type, p_severity, p_game_id, p_details);
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- END OF DATA INTEGRITY SAFEGUARDS
-- ============================================================
