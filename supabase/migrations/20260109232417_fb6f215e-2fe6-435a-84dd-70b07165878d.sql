-- Create table for user-saved color palettes
CREATE TABLE public.saved_palettes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  white_colors JSONB NOT NULL,
  black_colors JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add index for faster user lookups
CREATE INDEX idx_saved_palettes_user_id ON public.saved_palettes(user_id);

-- Enable Row Level Security
ALTER TABLE public.saved_palettes ENABLE ROW LEVEL SECURITY;

-- Users can view their own palettes
CREATE POLICY "Users can view their own palettes"
ON public.saved_palettes
FOR SELECT
USING (auth.uid() = user_id);

-- Users can create their own palettes
CREATE POLICY "Users can create their own palettes"
ON public.saved_palettes
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own palettes
CREATE POLICY "Users can update their own palettes"
ON public.saved_palettes
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own palettes
CREATE POLICY "Users can delete their own palettes"
ON public.saved_palettes
FOR DELETE
USING (auth.uid() = user_id);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_saved_palettes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_saved_palettes_updated_at
BEFORE UPDATE ON public.saved_palettes
FOR EACH ROW
EXECUTE FUNCTION public.update_saved_palettes_updated_at();