-- Create scan achievements table
CREATE TABLE public.scan_achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  achievement_type TEXT NOT NULL,
  achieved_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, achievement_type)
);

-- Create view for scan leaderboard stats
CREATE OR REPLACE VIEW public.scan_leaderboard AS
SELECT 
  sh.user_id,
  p.display_name,
  p.avatar_url,
  COUNT(DISTINCT sh.visualization_id) FILTER (WHERE sh.matched = true) as unique_visions_scanned,
  COUNT(*) FILTER (WHERE sh.matched = true) as total_successful_scans,
  COUNT(*) as total_scans,
  MAX(sh.scanned_at) as last_scan_at
FROM public.scan_history sh
JOIN public.profiles p ON p.user_id = sh.user_id
WHERE sh.user_id IS NOT NULL
GROUP BY sh.user_id, p.display_name, p.avatar_url
ORDER BY unique_visions_scanned DESC, total_successful_scans DESC;

-- Enable RLS on achievements
ALTER TABLE public.scan_achievements ENABLE ROW LEVEL SECURITY;

-- Users can view all achievements (for leaderboard)
CREATE POLICY "Anyone can view achievements" 
ON public.scan_achievements 
FOR SELECT 
USING (true);

-- System can insert achievements (via functions)
CREATE POLICY "System can insert achievements" 
ON public.scan_achievements 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Function to check and award scan achievements
CREATE OR REPLACE FUNCTION public.check_scan_achievements(p_user_id uuid)
RETURNS TABLE(achievement_type TEXT, just_earned BOOLEAN)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_unique_count INTEGER;
  v_total_count INTEGER;
  v_achievement TEXT;
  v_earned BOOLEAN;
BEGIN
  -- Get current stats
  SELECT 
    COUNT(DISTINCT visualization_id) FILTER (WHERE matched = true),
    COUNT(*) FILTER (WHERE matched = true)
  INTO v_unique_count, v_total_count
  FROM scan_history
  WHERE user_id = p_user_id;
  
  -- Check each milestone
  FOREACH v_achievement IN ARRAY ARRAY[
    'first_scan',      -- 1 unique
    'explorer_5',      -- 5 unique
    'collector_10',    -- 10 unique
    'hunter_25',       -- 25 unique
    'master_50',       -- 50 unique
    'legend_100',      -- 100 unique
    'scan_streak_10',  -- 10 total scans
    'scan_streak_50',  -- 50 total scans
    'scan_streak_100'  -- 100 total scans
  ] LOOP
    v_earned := FALSE;
    
    -- Check if already earned
    IF EXISTS (SELECT 1 FROM scan_achievements WHERE user_id = p_user_id AND achievement_type = v_achievement) THEN
      achievement_type := v_achievement;
      just_earned := FALSE;
      RETURN NEXT;
      CONTINUE;
    END IF;
    
    -- Check if earned now
    CASE v_achievement
      WHEN 'first_scan' THEN v_earned := v_unique_count >= 1;
      WHEN 'explorer_5' THEN v_earned := v_unique_count >= 5;
      WHEN 'collector_10' THEN v_earned := v_unique_count >= 10;
      WHEN 'hunter_25' THEN v_earned := v_unique_count >= 25;
      WHEN 'master_50' THEN v_earned := v_unique_count >= 50;
      WHEN 'legend_100' THEN v_earned := v_unique_count >= 100;
      WHEN 'scan_streak_10' THEN v_earned := v_total_count >= 10;
      WHEN 'scan_streak_50' THEN v_earned := v_total_count >= 50;
      WHEN 'scan_streak_100' THEN v_earned := v_total_count >= 100;
    END CASE;
    
    IF v_earned THEN
      INSERT INTO scan_achievements (user_id, achievement_type)
      VALUES (p_user_id, v_achievement)
      ON CONFLICT (user_id, achievement_type) DO NOTHING;
    END IF;
    
    achievement_type := v_achievement;
    just_earned := v_earned;
    RETURN NEXT;
  END LOOP;
END;
$$;

-- Index for faster leaderboard queries
CREATE INDEX idx_scan_history_user_matched ON public.scan_history(user_id, matched);
CREATE INDEX idx_scan_achievements_user ON public.scan_achievements(user_id);