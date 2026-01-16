-- Create table for stock market predictions
CREATE TABLE public.stock_predictions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  symbol TEXT NOT NULL,
  signature_fingerprint TEXT NOT NULL,
  archetype TEXT NOT NULL,
  predicted_direction TEXT NOT NULL CHECK (predicted_direction IN ('bullish', 'bearish', 'neutral')),
  predicted_confidence INTEGER NOT NULL CHECK (predicted_confidence >= 0 AND predicted_confidence <= 100),
  predicted_target_move DECIMAL(10, 2) NOT NULL,
  time_horizon TEXT NOT NULL CHECK (time_horizon IN ('1h', '4h', '1d', '1w')),
  price_at_prediction DECIMAL(20, 4) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  
  -- Outcome fields (populated when prediction is resolved)
  actual_direction TEXT CHECK (actual_direction IN ('bullish', 'bearish', 'neutral')),
  actual_move DECIMAL(10, 2),
  outcome_price DECIMAL(20, 4),
  was_correct BOOLEAN,
  accuracy_score INTEGER,
  resolved_at TIMESTAMP WITH TIME ZONE,
  
  -- Baseline comparison
  baseline_direction TEXT CHECK (baseline_direction IN ('bullish', 'bearish', 'neutral')),
  baseline_was_correct BOOLEAN
);

-- Create index for performance
CREATE INDEX idx_stock_predictions_symbol ON public.stock_predictions(symbol);
CREATE INDEX idx_stock_predictions_user ON public.stock_predictions(user_id);
CREATE INDEX idx_stock_predictions_created ON public.stock_predictions(created_at DESC);
CREATE INDEX idx_stock_predictions_unresolved ON public.stock_predictions(expires_at) WHERE resolved_at IS NULL;

-- Enable RLS
ALTER TABLE public.stock_predictions ENABLE ROW LEVEL SECURITY;

-- Allow anyone to view predictions (public leaderboard)
CREATE POLICY "Anyone can view predictions"
  ON public.stock_predictions
  FOR SELECT
  USING (true);

-- Only authenticated users can create predictions
CREATE POLICY "Authenticated users can create predictions"
  ON public.stock_predictions
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- System can update predictions for resolution
CREATE POLICY "System can update predictions"
  ON public.stock_predictions
  FOR UPDATE
  USING (true);

-- Create aggregate stats view
CREATE VIEW public.prediction_accuracy_stats AS
SELECT 
  archetype,
  time_horizon,
  COUNT(*) as total_predictions,
  COUNT(*) FILTER (WHERE resolved_at IS NOT NULL) as resolved_predictions,
  COUNT(*) FILTER (WHERE was_correct = true) as correct_predictions,
  ROUND(
    (COUNT(*) FILTER (WHERE was_correct = true)::DECIMAL / 
     NULLIF(COUNT(*) FILTER (WHERE resolved_at IS NOT NULL), 0)) * 100, 2
  ) as accuracy_percent,
  ROUND(AVG(accuracy_score) FILTER (WHERE resolved_at IS NOT NULL), 2) as avg_accuracy_score,
  COUNT(*) FILTER (WHERE baseline_was_correct = true) as baseline_correct,
  ROUND(
    (COUNT(*) FILTER (WHERE baseline_was_correct = true)::DECIMAL / 
     NULLIF(COUNT(*) FILTER (WHERE resolved_at IS NOT NULL), 0)) * 100, 2
  ) as baseline_accuracy_percent
FROM public.stock_predictions
GROUP BY archetype, time_horizon;

-- Create user performance view
CREATE VIEW public.user_prediction_performance AS
SELECT 
  user_id,
  COUNT(*) as total_predictions,
  COUNT(*) FILTER (WHERE resolved_at IS NOT NULL) as resolved_predictions,
  COUNT(*) FILTER (WHERE was_correct = true) as correct_predictions,
  ROUND(
    (COUNT(*) FILTER (WHERE was_correct = true)::DECIMAL / 
     NULLIF(COUNT(*) FILTER (WHERE resolved_at IS NOT NULL), 0)) * 100, 2
  ) as accuracy_percent,
  ROUND(AVG(accuracy_score) FILTER (WHERE resolved_at IS NOT NULL), 2) as avg_accuracy_score,
  MAX(created_at) as last_prediction_at
FROM public.stock_predictions
WHERE user_id IS NOT NULL
GROUP BY user_id;