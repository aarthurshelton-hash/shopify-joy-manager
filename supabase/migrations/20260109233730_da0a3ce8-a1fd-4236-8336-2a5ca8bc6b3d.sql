-- Add is_public column to saved_palettes
ALTER TABLE public.saved_palettes 
ADD COLUMN is_public boolean NOT NULL DEFAULT false;

-- Create policy to allow anyone to view public palettes
CREATE POLICY "Anyone can view public palettes"
ON public.saved_palettes
FOR SELECT
USING (is_public = true);

-- Create index for faster public palette queries
CREATE INDEX idx_saved_palettes_is_public ON public.saved_palettes(is_public) WHERE is_public = true;