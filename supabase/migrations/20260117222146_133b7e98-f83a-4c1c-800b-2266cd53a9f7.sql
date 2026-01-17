-- Add enhanced evidence tracking columns to prediction_outcomes
ALTER TABLE public.prediction_outcomes 
ADD COLUMN IF NOT EXISTS engine_version TEXT DEFAULT '8.0-universal',
ADD COLUMN IF NOT EXISTS domain_contributions JSONB,
ADD COLUMN IF NOT EXISTS genes_hash TEXT,
ADD COLUMN IF NOT EXISTS session_id TEXT,
ADD COLUMN IF NOT EXISTS paper_mode BOOLEAN DEFAULT true;

-- Create evidence audit log for patent/investor proof
CREATE TABLE IF NOT EXISTS public.trading_evidence_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  evidence_type TEXT NOT NULL, -- 'prediction', 'trade_entry', 'trade_exit', 'evolution'
  evidence_id TEXT NOT NULL,
  symbol TEXT,
  
  -- Prediction details
  predicted_direction TEXT,
  confidence NUMERIC,
  magnitude NUMERIC,
  time_horizon_ms INTEGER,
  
  -- Domain synthesis proof (the 21-domain contributions)
  domain_contributions JSONB,
  
  -- Market context
  market_price NUMERIC,
  market_spread NUMERIC,
  data_source TEXT,
  
  -- Evolution context
  evolution_generation INTEGER,
  evolution_fitness NUMERIC,
  genes_hash TEXT,
  
  -- Trade details
  entry_price NUMERIC,
  exit_price NUMERIC,
  side TEXT,
  quantity NUMERIC,
  pnl NUMERIC,
  pnl_percent NUMERIC,
  
  -- Outcome
  actual_direction TEXT,
  was_correct BOOLEAN,
  resolved_at TIMESTAMPTZ,
  
  -- Metadata
  session_id TEXT,
  engine_version TEXT DEFAULT '8.0-universal',
  paper_mode BOOLEAN DEFAULT true,
  
  -- Immutability hash for audit trail
  record_hash TEXT
);

-- Enable RLS
ALTER TABLE public.trading_evidence_log ENABLE ROW LEVEL SECURITY;

-- Only CEO can read evidence (for now)
CREATE POLICY "CEO can view evidence log"
  ON public.trading_evidence_log
  FOR SELECT
  USING (
    auth.jwt() ->> 'email' = 'a.arthur.shelton@gmail.com'
  );

-- System can insert evidence (via service role)
CREATE POLICY "Service can insert evidence"
  ON public.trading_evidence_log
  FOR INSERT
  WITH CHECK (true);

-- Add index for fast queries
CREATE INDEX IF NOT EXISTS idx_evidence_log_type ON public.trading_evidence_log(evidence_type);
CREATE INDEX IF NOT EXISTS idx_evidence_log_symbol ON public.trading_evidence_log(symbol);
CREATE INDEX IF NOT EXISTS idx_evidence_log_created ON public.trading_evidence_log(created_at DESC);

-- Enable realtime for live monitoring
ALTER PUBLICATION supabase_realtime ADD TABLE public.trading_evidence_log;