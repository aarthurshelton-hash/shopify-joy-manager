-- Create the update_updated_at_column function if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Drop the enum and table if they exist from partial migration
DROP TABLE IF EXISTS public.testimonials;
DROP TYPE IF EXISTS public.testimonial_status;

-- Create status enum for testimonial moderation
CREATE TYPE public.testimonial_status AS ENUM ('pending', 'approved', 'rejected');

-- Create testimonials table
CREATE TABLE public.testimonials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quote TEXT NOT NULL,
  display_name TEXT NOT NULL,
  role_title TEXT NOT NULL,
  rating INTEGER NOT NULL DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
  status testimonial_status NOT NULL DEFAULT 'pending',
  featured BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;

-- Users can view their own submissions
CREATE POLICY "Users can view their own testimonials"
ON public.testimonials
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own testimonials
CREATE POLICY "Authenticated users can submit testimonials"
ON public.testimonials
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own pending testimonials
CREATE POLICY "Users can update their own pending testimonials"
ON public.testimonials
FOR UPDATE
USING (auth.uid() = user_id AND status = 'pending');

-- Users can delete their own testimonials
CREATE POLICY "Users can delete their own testimonials"
ON public.testimonials
FOR DELETE
USING (auth.uid() = user_id);

-- Anyone can view approved testimonials (for public display)
CREATE POLICY "Anyone can view approved testimonials"
ON public.testimonials
FOR SELECT
USING (status = 'approved');

-- Create trigger for updated_at
CREATE TRIGGER update_testimonials_updated_at
BEFORE UPDATE ON public.testimonials
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();