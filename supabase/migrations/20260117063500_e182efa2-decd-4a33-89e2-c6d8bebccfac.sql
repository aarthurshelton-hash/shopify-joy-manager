-- Enable realtime for critical trading tables
DO $$
BEGIN
  -- evolution_state
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'evolution_state'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.evolution_state;
  END IF;
  
  -- portfolio_balance
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'portfolio_balance'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.portfolio_balance;
  END IF;
  
  -- prediction_outcomes
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'prediction_outcomes'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.prediction_outcomes;
  END IF;
  
  -- autonomous_trades
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'autonomous_trades'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.autonomous_trades;
  END IF;
END $$;