-- Create table for saved visualizations
CREATE TABLE public.saved_visualizations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  pgn TEXT,
  game_data JSONB NOT NULL,
  image_path TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.saved_visualizations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies - only owners can access their visualizations
CREATE POLICY "Users can view their own visualizations"
ON public.saved_visualizations
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own visualizations"
ON public.saved_visualizations
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own visualizations"
ON public.saved_visualizations
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own visualizations"
ON public.saved_visualizations
FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_saved_visualizations_updated_at
BEFORE UPDATE ON public.saved_visualizations
FOR EACH ROW
EXECUTE FUNCTION public.update_saved_palettes_updated_at();

-- Create storage bucket for visualization images
INSERT INTO storage.buckets (id, name, public)
VALUES ('visualizations', 'visualizations', true);

-- Storage policies for visualizations bucket
CREATE POLICY "Users can view their own visualization images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'visualizations' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own visualization images"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'visualizations' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own visualization images"
ON storage.objects
FOR DELETE
USING (bucket_id = 'visualizations' AND auth.uid()::text = (storage.foldername(name))[1]);