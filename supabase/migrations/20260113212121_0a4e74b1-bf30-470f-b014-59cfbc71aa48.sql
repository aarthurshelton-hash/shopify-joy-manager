-- Create AI Art Bank table for storing generated AI art assets
CREATE TABLE public.ai_art_bank (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  image_path TEXT NOT NULL,
  prompt TEXT,
  category TEXT DEFAULT 'general',
  tags TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  usage_locations TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.ai_art_bank ENABLE ROW LEVEL SECURITY;

-- Admin-only read access
CREATE POLICY "Admins can view all AI art"
ON public.ai_art_bank
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admin-only insert access
CREATE POLICY "Admins can insert AI art"
ON public.ai_art_bank
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Admin-only update access
CREATE POLICY "Admins can update AI art"
ON public.ai_art_bank
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admin-only delete access
CREATE POLICY "Admins can delete AI art"
ON public.ai_art_bank
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Create trigger for updated_at
CREATE TRIGGER update_ai_art_bank_updated_at
BEFORE UPDATE ON public.ai_art_bank
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();