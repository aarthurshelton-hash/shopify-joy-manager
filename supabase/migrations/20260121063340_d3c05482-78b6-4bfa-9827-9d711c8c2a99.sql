-- Add data_source column to track which platform games come from
ALTER TABLE public.chess_prediction_attempts 
ADD COLUMN IF NOT EXISTS data_source text DEFAULT 'lichess';

-- Add index for filtering by source
CREATE INDEX IF NOT EXISTS idx_chess_prediction_attempts_data_source 
ON public.chess_prediction_attempts(data_source);

-- Update existing records based on game_id patterns
-- Chess.com IDs are numeric, Lichess IDs are 8-char alphanumeric
UPDATE public.chess_prediction_attempts 
SET data_source = CASE 
  WHEN game_id ~ '^[0-9]+$' THEN 'chesscom'
  ELSE 'lichess'
END
WHERE data_source IS NULL OR data_source = 'lichess';

COMMENT ON COLUMN public.chess_prediction_attempts.data_source IS 'Source platform: lichess or chesscom';