-- Create table to store book generation progress
CREATE TABLE public.book_generation_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  game_index INTEGER NOT NULL,
  game_title TEXT NOT NULL,
  haiku TEXT,
  visualization_data TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, game_index)
);

-- Enable RLS
ALTER TABLE public.book_generation_progress ENABLE ROW LEVEL SECURITY;

-- CEO-only access policies
CREATE POLICY "CEO can view own progress"
  ON public.book_generation_progress
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "CEO can insert own progress"
  ON public.book_generation_progress
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "CEO can update own progress"
  ON public.book_generation_progress
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "CEO can delete own progress"
  ON public.book_generation_progress
  FOR DELETE
  USING (auth.uid() = user_id);

-- Add updated_at trigger
CREATE TRIGGER update_book_generation_progress_updated_at
  BEFORE UPDATE ON public.book_generation_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();