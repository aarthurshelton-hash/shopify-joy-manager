
-- Delete duplicates based on NORMALIZED FEN (position part only - first 4 segments)
DELETE FROM chess_prediction_attempts
WHERE id IN (
  SELECT id FROM (
    SELECT id,
           ROW_NUMBER() OVER (
             PARTITION BY (
               SPLIT_PART(fen, ' ', 1) || ' ' || 
               SPLIT_PART(fen, ' ', 2) || ' ' || 
               SPLIT_PART(fen, ' ', 3) || ' ' || 
               SPLIT_PART(fen, ' ', 4)
             )
             ORDER BY created_at ASC
           ) as rn
    FROM chess_prediction_attempts
    WHERE fen IS NOT NULL AND fen NOT LIKE 'moves:%'
  ) ranked
  WHERE rn > 1
);

-- Now create the unique index
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_fen_position 
ON chess_prediction_attempts (
  (SPLIT_PART(fen, ' ', 1) || ' ' || 
   SPLIT_PART(fen, ' ', 2) || ' ' || 
   SPLIT_PART(fen, ' ', 3) || ' ' || 
   SPLIT_PART(fen, ' ', 4))
)
WHERE fen IS NOT NULL AND fen NOT LIKE 'moves:%';

-- Update position_hash to be consistent SHA256-based
UPDATE chess_prediction_attempts
SET position_hash = SUBSTRING(
  encode(
    sha256(
      (SPLIT_PART(fen, ' ', 1) || ' ' || 
       SPLIT_PART(fen, ' ', 2) || ' ' || 
       SPLIT_PART(fen, ' ', 3) || ' ' || 
       SPLIT_PART(fen, ' ', 4))::bytea
    ), 'hex'
  ), 1, 16
)
WHERE fen IS NOT NULL AND fen NOT LIKE 'moves:%';
