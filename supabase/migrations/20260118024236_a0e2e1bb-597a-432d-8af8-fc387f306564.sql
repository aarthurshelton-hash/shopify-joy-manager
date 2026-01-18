-- Benchmark Results Persistence for Learning & Enhancement
-- This stores every benchmark run to enable pattern learning and accuracy improvement

CREATE TABLE public.chess_benchmark_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Benchmark metadata
  run_id TEXT NOT NULL,
  data_source TEXT NOT NULL, -- 'lichess_real' or 'famous_games'
  total_games INTEGER NOT NULL,
  completed_games INTEGER NOT NULL,
  prediction_move_number INTEGER NOT NULL DEFAULT 20,
  
  -- Accuracy scores
  stockfish_accuracy NUMERIC NOT NULL,
  hybrid_accuracy NUMERIC NOT NULL,
  
  -- Head-to-head comparison
  stockfish_wins INTEGER NOT NULL DEFAULT 0,
  hybrid_wins INTEGER NOT NULL DEFAULT 0,
  both_correct INTEGER NOT NULL DEFAULT 0,
  both_wrong INTEGER NOT NULL DEFAULT 0,
  
  -- Statistical significance
  p_value NUMERIC,
  confidence NUMERIC,
  
  -- Archetype performance (JSON)
  archetype_performance JSONB,
  
  -- Games analyzed (for deduplication)
  games_analyzed TEXT[] NOT NULL DEFAULT '{}',
  
  -- Timing
  duration_ms INTEGER,
  
  -- Engine versions
  stockfish_version TEXT DEFAULT 'SF16+ NNUE via Lichess Cloud',
  hybrid_version TEXT DEFAULT 'En Pensent Hybrid v1.0'
);

-- Individual prediction attempts for deep learning
CREATE TABLE public.chess_prediction_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  benchmark_id UUID REFERENCES public.chess_benchmark_results(id) ON DELETE CASCADE,
  
  -- Game identification
  game_id TEXT NOT NULL,
  game_name TEXT NOT NULL,
  move_number INTEGER NOT NULL,
  
  -- Position data
  fen TEXT NOT NULL,
  pgn TEXT,
  
  -- Stockfish prediction
  stockfish_eval INTEGER,
  stockfish_depth INTEGER,
  stockfish_prediction TEXT NOT NULL,
  stockfish_confidence NUMERIC,
  
  -- Hybrid prediction  
  hybrid_prediction TEXT NOT NULL,
  hybrid_confidence NUMERIC,
  hybrid_archetype TEXT,
  
  -- Actual outcome
  actual_result TEXT NOT NULL,
  
  -- Accuracy
  stockfish_correct BOOLEAN NOT NULL,
  hybrid_correct BOOLEAN NOT NULL,
  
  -- Learning signals
  position_hash TEXT, -- For deduplication
  lesson_learned JSONB -- What we can learn from this position
);

-- Indexes for fast learning queries
CREATE INDEX idx_benchmark_accuracy ON public.chess_benchmark_results(hybrid_accuracy DESC);
CREATE INDEX idx_prediction_archetype ON public.chess_prediction_attempts(hybrid_archetype);
CREATE INDEX idx_prediction_correct ON public.chess_prediction_attempts(hybrid_correct);
CREATE INDEX idx_prediction_position ON public.chess_prediction_attempts(position_hash);

-- Enable RLS
ALTER TABLE public.chess_benchmark_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chess_prediction_attempts ENABLE ROW LEVEL SECURITY;

-- Public read for transparency (proving our results)
CREATE POLICY "Anyone can view benchmark results" 
ON public.chess_benchmark_results FOR SELECT USING (true);

CREATE POLICY "Anyone can view prediction attempts" 
ON public.chess_prediction_attempts FOR SELECT USING (true);

-- Only system can insert (via edge function)
CREATE POLICY "System can insert benchmark results" 
ON public.chess_benchmark_results FOR INSERT WITH CHECK (true);

CREATE POLICY "System can insert prediction attempts" 
ON public.chess_prediction_attempts FOR INSERT WITH CHECK (true);