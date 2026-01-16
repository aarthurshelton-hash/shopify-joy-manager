-- Create table for persisting color flow patterns
CREATE TABLE public.color_flow_patterns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  fingerprint TEXT NOT NULL,
  archetype TEXT NOT NULL,
  outcome TEXT NOT NULL CHECK (outcome IN ('white_wins', 'black_wins', 'draw')),
  total_moves INTEGER NOT NULL,
  characteristics JSONB NOT NULL,
  opening_eco TEXT,
  game_metadata JSONB,
  pgn_hash TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create index for fingerprint lookups
CREATE INDEX idx_color_flow_patterns_fingerprint ON public.color_flow_patterns(fingerprint);

-- Create index for archetype filtering
CREATE INDEX idx_color_flow_patterns_archetype ON public.color_flow_patterns(archetype);

-- Create index for similarity searches
CREATE INDEX idx_color_flow_patterns_characteristics ON public.color_flow_patterns USING GIN (characteristics);

-- Enable RLS
ALTER TABLE public.color_flow_patterns ENABLE ROW LEVEL SECURITY;

-- Everyone can read patterns (they're anonymized learning data)
CREATE POLICY "Anyone can read color flow patterns"
ON public.color_flow_patterns
FOR SELECT
USING (true);

-- Authenticated users can contribute patterns
CREATE POLICY "Authenticated users can add patterns"
ON public.color_flow_patterns
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Users can only delete their own patterns
CREATE POLICY "Users can delete their own patterns"
ON public.color_flow_patterns
FOR DELETE
USING (auth.uid() = created_by);

-- Add comment explaining the table
COMMENT ON TABLE public.color_flow_patterns IS 'Stores Color Flow Signatures learned from analyzed games for pattern matching and trajectory prediction';