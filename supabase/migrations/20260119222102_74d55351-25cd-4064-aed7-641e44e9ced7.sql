-- Backfill missing position_hash values for existing records
-- This ensures deduplication works correctly for all 724 records without hashes

UPDATE chess_prediction_attempts
SET position_hash = encode(
  sha256(
    convert_to(
      split_part(fen, ' ', 1) || ' ' || 
      split_part(fen, ' ', 2) || ' ' || 
      split_part(fen, ' ', 3) || ' ' || 
      split_part(fen, ' ', 4),
      'UTF8'
    )
  ),
  'hex'
)
WHERE position_hash IS NULL AND fen IS NOT NULL;