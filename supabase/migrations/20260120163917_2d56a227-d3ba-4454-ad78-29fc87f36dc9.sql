-- Drop the FEN-based unique constraint that's blocking valid inserts
-- Same position can appear in different games - that's valuable data, not a duplicate
DROP INDEX IF EXISTS idx_unique_fen_position;

-- Add a unique constraint on game_id instead (prevent analyzing same game twice)
-- This is what we actually want for deduplication
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_game_id 
ON chess_prediction_attempts (game_id);

-- Add comment explaining the deduplication strategy
COMMENT ON INDEX idx_unique_game_id IS 'Deduplication is game-based: same position in different games is valuable learning data';