-- Create autonomous trading simulation table to track $1K → $10K progress
CREATE TABLE IF NOT EXISTS public.autonomous_trades (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  symbol TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('long', 'short')),
  entry_price NUMERIC NOT NULL,
  exit_price NUMERIC,
  entry_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  exit_time TIMESTAMP WITH TIME ZONE,
  shares NUMERIC NOT NULL,
  predicted_direction TEXT NOT NULL,
  predicted_confidence NUMERIC NOT NULL,
  actual_direction TEXT,
  pnl NUMERIC,
  pnl_percent NUMERIC,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  prediction_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create portfolio balance tracker
CREATE TABLE IF NOT EXISTS public.portfolio_balance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  balance NUMERIC NOT NULL DEFAULT 1000,
  peak_balance NUMERIC NOT NULL DEFAULT 1000,
  trough_balance NUMERIC NOT NULL DEFAULT 1000,
  total_trades INTEGER NOT NULL DEFAULT 0,
  winning_trades INTEGER NOT NULL DEFAULT 0,
  target_balance NUMERIC NOT NULL DEFAULT 10000,
  last_trade_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert initial portfolio state
INSERT INTO public.portfolio_balance (balance, peak_balance, trough_balance, target_balance)
VALUES (1000, 1000, 1000, 10000)
ON CONFLICT DO NOTHING;

-- Enable RLS
ALTER TABLE public.autonomous_trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_balance ENABLE ROW LEVEL SECURITY;

-- Allow service role full access for autonomous operations
CREATE POLICY "Service role full access to autonomous_trades" 
ON public.autonomous_trades 
FOR ALL 
USING (true);

CREATE POLICY "Service role full access to portfolio_balance" 
ON public.portfolio_balance 
FOR ALL 
USING (true);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_autonomous_trades_status ON public.autonomous_trades(status);
CREATE INDEX IF NOT EXISTS idx_autonomous_trades_symbol ON public.autonomous_trades(symbol);