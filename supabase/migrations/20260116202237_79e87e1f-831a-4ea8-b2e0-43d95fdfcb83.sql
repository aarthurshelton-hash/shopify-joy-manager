-- Market Learning System: Persistent 24/7 data collection and analysis

-- Table to store market tick data for all securities
CREATE TABLE public.market_tick_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  symbol VARCHAR(20) NOT NULL,
  price DECIMAL(18, 8) NOT NULL,
  volume DECIMAL(18, 8),
  bid DECIMAL(18, 8),
  ask DECIMAL(18, 8),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  source VARCHAR(50) DEFAULT 'system',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for efficient querying by symbol and time
CREATE INDEX idx_market_tick_symbol_time ON public.market_tick_history(symbol, timestamp DESC);
CREATE INDEX idx_market_tick_timestamp ON public.market_tick_history(timestamp DESC);

-- Table to store prediction outcomes for learning
CREATE TABLE public.prediction_outcomes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  symbol VARCHAR(20) NOT NULL,
  predicted_direction VARCHAR(10) NOT NULL,
  predicted_confidence DECIMAL(5, 4) NOT NULL,
  predicted_magnitude DECIMAL(10, 6),
  actual_direction VARCHAR(10),
  actual_magnitude DECIMAL(10, 6),
  direction_correct BOOLEAN,
  magnitude_accuracy DECIMAL(5, 4),
  timing_accuracy DECIMAL(5, 4),
  calibration_accuracy DECIMAL(5, 4),
  composite_score DECIMAL(5, 4),
  prediction_horizon_ms INTEGER NOT NULL,
  entry_price DECIMAL(18, 8) NOT NULL,
  exit_price DECIMAL(18, 8),
  market_conditions JSONB,
  correlated_assets JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

CREATE INDEX idx_prediction_symbol ON public.prediction_outcomes(symbol);
CREATE INDEX idx_prediction_created ON public.prediction_outcomes(created_at DESC);
CREATE INDEX idx_prediction_resolved ON public.prediction_outcomes(resolved_at DESC);

-- Table for security-specific accuracy metrics
CREATE TABLE public.security_accuracy_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  symbol VARCHAR(20) NOT NULL UNIQUE,
  total_predictions INTEGER DEFAULT 0,
  correct_predictions INTEGER DEFAULT 0,
  direction_accuracy DECIMAL(5, 4) DEFAULT 0,
  magnitude_accuracy DECIMAL(5, 4) DEFAULT 0,
  timing_accuracy DECIMAL(5, 4) DEFAULT 0,
  calibration_accuracy DECIMAL(5, 4) DEFAULT 0,
  composite_accuracy DECIMAL(5, 4) DEFAULT 0,
  best_timeframe_ms INTEGER,
  optimal_confidence_threshold DECIMAL(5, 4),
  volatility_profile JSONB,
  correlation_strengths JSONB,
  last_prediction_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_security_accuracy_symbol ON public.security_accuracy_metrics(symbol);

-- Table for cross-correlation analysis
CREATE TABLE public.market_correlations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  symbol_a VARCHAR(20) NOT NULL,
  symbol_b VARCHAR(20) NOT NULL,
  correlation_coefficient DECIMAL(6, 5) NOT NULL,
  lag_ms INTEGER DEFAULT 0,
  sample_size INTEGER NOT NULL,
  confidence_interval DECIMAL(5, 4),
  timeframe VARCHAR(20) NOT NULL,
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(symbol_a, symbol_b, timeframe)
);

CREATE INDEX idx_correlation_symbols ON public.market_correlations(symbol_a, symbol_b);

-- Table for evolution/learning state persistence
CREATE TABLE public.evolution_state (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  state_type VARCHAR(50) NOT NULL DEFAULT 'global',
  generation INTEGER DEFAULT 1,
  fitness_score DECIMAL(5, 4) DEFAULT 0.5,
  genes JSONB NOT NULL,
  learned_patterns JSONB,
  adaptation_history JSONB,
  total_predictions INTEGER DEFAULT 0,
  last_mutation_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table for session reports
CREATE TABLE public.trading_session_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id VARCHAR(100) NOT NULL,
  user_id UUID,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  starting_balance_cents INTEGER NOT NULL DEFAULT 100000,
  ending_balance_cents INTEGER,
  total_trades INTEGER DEFAULT 0,
  winning_trades INTEGER DEFAULT 0,
  losing_trades INTEGER DEFAULT 0,
  total_pnl_cents INTEGER DEFAULT 0,
  best_trade_cents INTEGER,
  worst_trade_cents INTEGER,
  securities_traded JSONB,
  accuracy_metrics JSONB,
  market_conditions JSONB,
  lessons_learned JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_session_reports_time ON public.trading_session_reports(start_time DESC);
CREATE INDEX idx_session_reports_user ON public.trading_session_reports(user_id);

-- Table for market hours and collection status
CREATE TABLE public.market_collection_status (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  market_name VARCHAR(50) NOT NULL UNIQUE,
  is_collecting BOOLEAN DEFAULT false,
  last_tick_at TIMESTAMPTZ,
  ticks_collected_today INTEGER DEFAULT 0,
  errors_today INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'idle',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.market_tick_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prediction_outcomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_accuracy_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_correlations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evolution_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trading_session_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_collection_status ENABLE ROW LEVEL SECURITY;

-- Public read access for market data (system writes)
CREATE POLICY "Public read access for market ticks" ON public.market_tick_history FOR SELECT USING (true);
CREATE POLICY "Public read access for predictions" ON public.prediction_outcomes FOR SELECT USING (true);
CREATE POLICY "Public read access for accuracy metrics" ON public.security_accuracy_metrics FOR SELECT USING (true);
CREATE POLICY "Public read access for correlations" ON public.market_correlations FOR SELECT USING (true);
CREATE POLICY "Public read access for evolution state" ON public.evolution_state FOR SELECT USING (true);
CREATE POLICY "Public read access for collection status" ON public.market_collection_status FOR SELECT USING (true);

-- Session reports - users can see their own
CREATE POLICY "Users can view their own session reports" ON public.trading_session_reports FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Users can insert their own session reports" ON public.trading_session_reports FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Service role policies for edge functions to write
CREATE POLICY "Service can insert market ticks" ON public.market_tick_history FOR INSERT WITH CHECK (true);
CREATE POLICY "Service can insert predictions" ON public.prediction_outcomes FOR INSERT WITH CHECK (true);
CREATE POLICY "Service can update predictions" ON public.prediction_outcomes FOR UPDATE USING (true);
CREATE POLICY "Service can manage accuracy metrics" ON public.security_accuracy_metrics FOR ALL USING (true);
CREATE POLICY "Service can manage correlations" ON public.market_correlations FOR ALL USING (true);
CREATE POLICY "Service can manage evolution state" ON public.evolution_state FOR ALL USING (true);
CREATE POLICY "Service can manage collection status" ON public.market_collection_status FOR ALL USING (true);

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_market_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers for updated_at
CREATE TRIGGER update_security_accuracy_updated_at
  BEFORE UPDATE ON public.security_accuracy_metrics
  FOR EACH ROW EXECUTE FUNCTION public.update_market_updated_at();

CREATE TRIGGER update_evolution_state_updated_at
  BEFORE UPDATE ON public.evolution_state
  FOR EACH ROW EXECUTE FUNCTION public.update_market_updated_at();

CREATE TRIGGER update_collection_status_updated_at
  BEFORE UPDATE ON public.market_collection_status
  FOR EACH ROW EXECUTE FUNCTION public.update_market_updated_at();

-- Enable realtime for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.market_tick_history;
ALTER PUBLICATION supabase_realtime ADD TABLE public.prediction_outcomes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.security_accuracy_metrics;
ALTER PUBLICATION supabase_realtime ADD TABLE public.evolution_state;