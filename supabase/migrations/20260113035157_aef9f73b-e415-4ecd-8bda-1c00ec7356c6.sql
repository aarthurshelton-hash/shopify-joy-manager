-- Create streak rewards table with date column
CREATE TABLE public.streak_rewards (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  streak_day integer NOT NULL,
  reward_type text NOT NULL,
  reward_value integer NOT NULL DEFAULT 0,
  claimed_date date NOT NULL DEFAULT CURRENT_DATE,
  claimed_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, claimed_date)
);

-- Enable RLS
ALTER TABLE public.streak_rewards ENABLE ROW LEVEL SECURITY;

-- RLS policies for streak_rewards
CREATE POLICY "Users can view their own rewards"
ON public.streak_rewards
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "System can insert rewards"
ON public.streak_rewards
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Function to update scan streak
CREATE OR REPLACE FUNCTION public.update_scan_streak(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_last_scan_date date;
  v_current_streak integer;
  v_longest_streak integer;
  v_today date := CURRENT_DATE;
  v_streak_broken boolean := false;
  v_new_day boolean := false;
  v_reward_type text;
  v_reward_value integer := 0;
BEGIN
  -- Get current streak data
  SELECT last_scan_date, current_streak, longest_streak
  INTO v_last_scan_date, v_current_streak, v_longest_streak
  FROM profiles
  WHERE user_id = p_user_id;
  
  -- If no profile exists, create one
  IF NOT FOUND THEN
    INSERT INTO profiles (user_id, current_streak, longest_streak, last_scan_date, total_scan_days)
    VALUES (p_user_id, 1, 1, v_today, 1);
    
    RETURN jsonb_build_object(
      'current_streak', 1,
      'longest_streak', 1,
      'new_day', true,
      'streak_broken', false,
      'reward_type', 'first_scan',
      'reward_value', 10
    );
  END IF;
  
  -- Check if already scanned today
  IF v_last_scan_date = v_today THEN
    RETURN jsonb_build_object(
      'current_streak', v_current_streak,
      'longest_streak', v_longest_streak,
      'new_day', false,
      'streak_broken', false,
      'reward_type', null,
      'reward_value', 0
    );
  END IF;
  
  v_new_day := true;
  
  -- Check if streak continues (scanned yesterday)
  IF v_last_scan_date = v_today - 1 THEN
    v_current_streak := v_current_streak + 1;
  ELSIF v_last_scan_date IS NOT NULL AND v_last_scan_date < v_today - 1 THEN
    v_current_streak := 1;
    v_streak_broken := true;
  ELSE
    v_current_streak := 1;
  END IF;
  
  -- Update longest streak if needed
  IF v_current_streak > v_longest_streak THEN
    v_longest_streak := v_current_streak;
  END IF;
  
  -- Determine reward based on streak
  CASE
    WHEN v_current_streak >= 30 THEN
      v_reward_type := 'legendary';
      v_reward_value := 100;
    WHEN v_current_streak >= 14 THEN
      v_reward_type := 'epic';
      v_reward_value := 50;
    WHEN v_current_streak >= 7 THEN
      v_reward_type := 'rare';
      v_reward_value := 25;
    WHEN v_current_streak >= 3 THEN
      v_reward_type := 'common';
      v_reward_value := 10;
    ELSE
      v_reward_type := 'daily';
      v_reward_value := 5;
  END CASE;
  
  -- Update profile
  UPDATE profiles
  SET 
    current_streak = v_current_streak,
    longest_streak = v_longest_streak,
    last_scan_date = v_today,
    total_scan_days = total_scan_days + 1,
    updated_at = now()
  WHERE user_id = p_user_id;
  
  -- Record reward (ignore if already claimed today)
  INSERT INTO streak_rewards (user_id, streak_day, reward_type, reward_value, claimed_date)
  VALUES (p_user_id, v_current_streak, v_reward_type, v_reward_value, v_today)
  ON CONFLICT (user_id, claimed_date) DO NOTHING;
  
  RETURN jsonb_build_object(
    'current_streak', v_current_streak,
    'longest_streak', v_longest_streak,
    'new_day', v_new_day,
    'streak_broken', v_streak_broken,
    'reward_type', v_reward_type,
    'reward_value', v_reward_value
  );
END;
$$;

-- Function to get user streak info
CREATE OR REPLACE FUNCTION public.get_user_streak(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'current_streak', COALESCE(current_streak, 0),
    'longest_streak', COALESCE(longest_streak, 0),
    'last_scan_date', last_scan_date,
    'total_scan_days', COALESCE(total_scan_days, 0),
    'scanned_today', last_scan_date = CURRENT_DATE
  )
  INTO v_result
  FROM profiles
  WHERE user_id = p_user_id;
  
  IF v_result IS NULL THEN
    RETURN jsonb_build_object(
      'current_streak', 0,
      'longest_streak', 0,
      'last_scan_date', null,
      'total_scan_days', 0,
      'scanned_today', false
    );
  END IF;
  
  RETURN v_result;
END;
$$;