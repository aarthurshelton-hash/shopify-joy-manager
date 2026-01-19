-- Add time_control column to track game speed categories
ALTER TABLE chess_prediction_attempts 
ADD COLUMN IF NOT EXISTS time_control text;

-- Add player ELO columns for style profiling
ALTER TABLE chess_prediction_attempts
ADD COLUMN IF NOT EXISTS white_elo integer,
ADD COLUMN IF NOT EXISTS black_elo integer;

-- Create index for time control analysis
CREATE INDEX IF NOT EXISTS idx_prediction_attempts_time_control 
ON chess_prediction_attempts(time_control);

-- Enable realtime for chess tables so dashboard auto-updates
ALTER PUBLICATION supabase_realtime ADD TABLE chess_prediction_attempts;
ALTER PUBLICATION supabase_realtime ADD TABLE chess_benchmark_results;