-- Enable realtime for investor-relevant tables
DO $$
BEGIN
  -- Add saved_visualizations to realtime if not already added
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'saved_visualizations'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.saved_visualizations;
  END IF;

  -- Add color_flow_patterns to realtime if not already added
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'color_flow_patterns'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.color_flow_patterns;
  END IF;

  -- Add code_repository_patterns to realtime if not already added
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'code_repository_patterns'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.code_repository_patterns;
  END IF;

  -- Add scan_history to realtime if not already added
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'scan_history'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.scan_history;
  END IF;

  -- Add vision_scores to realtime if not already added
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'vision_scores'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.vision_scores;
  END IF;

  -- Add visualization_listings to realtime if not already added
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'visualization_listings'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.visualization_listings;
  END IF;

  -- Add user_wallets to realtime if not already added
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'user_wallets'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.user_wallets;
  END IF;

  -- Add profiles to realtime if not already added
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'profiles'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
  END IF;
END $$;