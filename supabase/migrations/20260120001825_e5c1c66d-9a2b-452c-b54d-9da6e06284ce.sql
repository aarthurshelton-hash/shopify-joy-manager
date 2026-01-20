-- AUDIT: Data Integrity Update
-- Mark records with synthetic IDs as legacy data
-- These were created before the Lichess ID validation fix

-- Add a data_source_verified column to track verification status
ALTER TABLE public.chess_prediction_attempts 
ADD COLUMN IF NOT EXISTS lichess_id_verified BOOLEAN DEFAULT FALSE;

-- Mark records with REAL 8-character Lichess IDs as verified
UPDATE public.chess_prediction_attempts 
SET lichess_id_verified = TRUE 
WHERE LENGTH(game_id) = 8 
AND game_id ~ '^[a-zA-Z0-9]+$';

-- Mark the synthetic IDs as unverified (legacy data)
UPDATE public.chess_prediction_attempts 
SET lichess_id_verified = FALSE 
WHERE game_id LIKE 'lichess-%' 
OR game_id LIKE 'game-%' 
OR game_id LIKE 'famous-%' 
OR game_id LIKE 'unknown-%';

-- Add comment for documentation
COMMENT ON COLUMN public.chess_prediction_attempts.lichess_id_verified IS 'TRUE = game_id is a real 8-char Lichess game ID, FALSE = synthetic/legacy ID';