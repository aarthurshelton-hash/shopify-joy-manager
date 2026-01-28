-- v7.98: Ensure unique constraint on game_id exists for upsert to work
-- First check if constraint exists, if not add it

-- Drop the old index if it exists (as it may not be a proper unique constraint)
DROP INDEX IF EXISTS idx_unique_game_id;

-- Create a proper unique constraint on game_id for upsert support
ALTER TABLE public.chess_prediction_attempts 
ADD CONSTRAINT chess_prediction_attempts_game_id_unique UNIQUE (game_id);