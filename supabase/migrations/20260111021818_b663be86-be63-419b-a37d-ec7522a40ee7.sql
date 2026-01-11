-- Create enum for game status
CREATE TYPE public.chess_game_status AS ENUM ('waiting', 'active', 'completed', 'abandoned');

-- Create enum for game result
CREATE TYPE public.chess_game_result AS ENUM ('white_wins', 'black_wins', 'draw', 'abandoned');

-- Create enum for time control
CREATE TYPE public.time_control AS ENUM ('bullet_1', 'blitz_5', 'rapid_15', 'untimed');

-- Create table for online chess games
CREATE TABLE public.chess_games (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Players
  white_player_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  black_player_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Game state
  status chess_game_status NOT NULL DEFAULT 'waiting',
  result chess_game_result,
  pgn TEXT DEFAULT '',
  current_fen TEXT DEFAULT 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
  move_count INTEGER DEFAULT 0,
  
  -- Time control
  time_control time_control NOT NULL DEFAULT 'blitz_5',
  white_time_remaining INTEGER, -- in seconds
  black_time_remaining INTEGER,
  last_move_at TIMESTAMP WITH TIME ZONE,
  
  -- Palette selection (blended - each player picks their side's palette)
  white_palette JSONB,
  black_palette JSONB,
  
  -- Challenge system
  challenge_code TEXT UNIQUE,
  is_public BOOLEAN DEFAULT true, -- for quick match queue
  
  -- Metadata
  winner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.chess_games ENABLE ROW LEVEL SECURITY;

-- RLS Policies for chess_games
CREATE POLICY "Anyone can view public waiting games"
ON public.chess_games
FOR SELECT
USING (status = 'waiting' AND is_public = true);

CREATE POLICY "Players can view their own games"
ON public.chess_games
FOR SELECT
USING (auth.uid() = white_player_id OR auth.uid() = black_player_id);

CREATE POLICY "Anyone can view games by challenge code"
ON public.chess_games
FOR SELECT
USING (challenge_code IS NOT NULL);

CREATE POLICY "Authenticated users can create games"
ON public.chess_games
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = white_player_id);

CREATE POLICY "Players can update their games"
ON public.chess_games
FOR UPDATE
USING (auth.uid() = white_player_id OR auth.uid() = black_player_id);

-- Create table for game moves (for real-time sync)
CREATE TABLE public.chess_moves (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id UUID NOT NULL REFERENCES public.chess_games(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  move_number INTEGER NOT NULL,
  move_san TEXT NOT NULL, -- Standard Algebraic Notation
  move_uci TEXT NOT NULL, -- Universal Chess Interface notation
  fen_after TEXT NOT NULL,
  time_spent INTEGER, -- seconds spent on this move
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for moves
ALTER TABLE public.chess_moves ENABLE ROW LEVEL SECURITY;

-- RLS Policies for chess_moves
CREATE POLICY "Anyone can view moves of their games"
ON public.chess_moves
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.chess_games 
    WHERE id = game_id 
    AND (white_player_id = auth.uid() OR black_player_id = auth.uid())
  )
);

CREATE POLICY "Players can insert moves for their games"
ON public.chess_moves
FOR INSERT
WITH CHECK (
  auth.uid() = player_id AND
  EXISTS (
    SELECT 1 FROM public.chess_games 
    WHERE id = game_id 
    AND status = 'active'
    AND (white_player_id = auth.uid() OR black_player_id = auth.uid())
  )
);

-- Create table for creative mode designs
CREATE TABLE public.creative_designs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Untitled Design',
  description TEXT,
  fen TEXT NOT NULL, -- Position in FEN notation
  palette JSONB NOT NULL, -- Full palette with all piece colors
  image_path TEXT, -- Generated visualization
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for creative designs
ALTER TABLE public.creative_designs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for creative_designs
CREATE POLICY "Users can view their own designs"
ON public.creative_designs
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view public designs"
ON public.creative_designs
FOR SELECT
USING (is_public = true);

CREATE POLICY "Users can create their own designs"
ON public.creative_designs
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own designs"
ON public.creative_designs
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own designs"
ON public.creative_designs
FOR DELETE
USING (auth.uid() = user_id);

-- Add triggers for updated_at
CREATE TRIGGER update_chess_games_updated_at
  BEFORE UPDATE ON public.chess_games
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_creative_designs_updated_at
  BEFORE UPDATE ON public.creative_designs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to generate unique challenge codes
CREATE OR REPLACE FUNCTION public.generate_challenge_code()
RETURNS TEXT
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$;

-- Enable realtime for games and moves
ALTER PUBLICATION supabase_realtime ADD TABLE public.chess_games;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chess_moves;

-- Create indexes for performance
CREATE INDEX idx_chess_games_status ON public.chess_games(status);
CREATE INDEX idx_chess_games_white_player ON public.chess_games(white_player_id);
CREATE INDEX idx_chess_games_black_player ON public.chess_games(black_player_id);
CREATE INDEX idx_chess_games_challenge_code ON public.chess_games(challenge_code);
CREATE INDEX idx_chess_moves_game_id ON public.chess_moves(game_id);
CREATE INDEX idx_creative_designs_user_id ON public.creative_designs(user_id);