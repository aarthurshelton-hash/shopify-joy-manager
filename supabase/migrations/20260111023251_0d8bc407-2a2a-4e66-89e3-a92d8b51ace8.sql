-- Add ELO rating column to profiles table with default 1200 (standard starting rating)
ALTER TABLE public.profiles 
ADD COLUMN elo_rating integer NOT NULL DEFAULT 1200;

-- Add index for efficient leaderboard queries
CREATE INDEX idx_profiles_elo_rating ON public.profiles(elo_rating DESC);