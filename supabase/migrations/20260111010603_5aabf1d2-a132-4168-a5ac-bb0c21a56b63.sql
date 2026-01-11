-- Add public_share_id column to saved_visualizations for unique shareable links
ALTER TABLE public.saved_visualizations 
ADD COLUMN IF NOT EXISTS public_share_id TEXT UNIQUE;

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_saved_visualizations_share_id 
ON public.saved_visualizations(public_share_id);

-- Create a function to generate short unique IDs
CREATE OR REPLACE FUNCTION public.generate_share_id()
RETURNS TEXT
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..7 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$;

-- Create trigger to auto-generate share_id on insert
CREATE OR REPLACE FUNCTION public.set_share_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.public_share_id IS NULL THEN
    NEW.public_share_id := public.generate_share_id();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_visualization_share_id
BEFORE INSERT ON public.saved_visualizations
FOR EACH ROW
EXECUTE FUNCTION public.set_share_id();

-- Update existing rows with share IDs
UPDATE public.saved_visualizations 
SET public_share_id = public.generate_share_id() 
WHERE public_share_id IS NULL;

-- Add policy for public viewing of visualizations via share_id
CREATE POLICY "Anyone can view visualizations by share_id"
ON public.saved_visualizations
FOR SELECT
USING (public_share_id IS NOT NULL);