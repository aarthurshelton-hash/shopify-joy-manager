-- Create flagged content table for moderation queue
CREATE TABLE public.flagged_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content_type TEXT NOT NULL, -- 'display_name', 'vision_title', 'avatar', 'testimonial', 'palette_name', 'creative_design'
  content_id UUID, -- Reference to the content (nullable for pre-save flags)
  content_text TEXT, -- The flagged text content
  content_image_url TEXT, -- For flagged images
  user_id UUID NOT NULL,
  reason TEXT NOT NULL, -- Why it was flagged
  severity TEXT NOT NULL DEFAULT 'medium', -- 'low', 'medium', 'high'
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'banned'
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  review_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create banned users table
CREATE TABLE public.banned_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  reason TEXT NOT NULL,
  banned_by UUID NOT NULL,
  banned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE, -- NULL = permanent ban
  offense_count INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create offense history for tracking repeat offenders
CREATE TABLE public.user_offenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  flagged_content_id UUID REFERENCES public.flagged_content(id) ON DELETE SET NULL,
  offense_type TEXT NOT NULL, -- 'warning', 'temp_ban', 'permanent_ban'
  notes TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.flagged_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banned_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_offenses ENABLE ROW LEVEL SECURITY;

-- RLS Policies for flagged_content
CREATE POLICY "Admins can view all flagged content"
ON public.flagged_content
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update flagged content"
ON public.flagged_content
FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert flagged content"
ON public.flagged_content
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can view their own flagged content"
ON public.flagged_content
FOR SELECT
USING (auth.uid() = user_id);

-- RLS Policies for banned_users
CREATE POLICY "Admins can manage banned users"
ON public.banned_users
FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can check their own ban status"
ON public.banned_users
FOR SELECT
USING (auth.uid() = user_id);

-- RLS Policies for user_offenses
CREATE POLICY "Admins can manage offenses"
ON public.user_offenses
FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their own offenses"
ON public.user_offenses
FOR SELECT
USING (auth.uid() = user_id);

-- Function to check if user is banned
CREATE OR REPLACE FUNCTION public.is_user_banned(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.banned_users
    WHERE user_id = p_user_id
    AND (expires_at IS NULL OR expires_at > now())
  )
$$;

-- Function to get user offense count
CREATE OR REPLACE FUNCTION public.get_user_offense_count(p_user_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::INTEGER
  FROM public.user_offenses
  WHERE user_id = p_user_id
$$;

-- Triggers for updated_at
CREATE TRIGGER update_flagged_content_updated_at
BEFORE UPDATE ON public.flagged_content
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for efficient queries
CREATE INDEX idx_flagged_content_status ON public.flagged_content(status);
CREATE INDEX idx_flagged_content_user_id ON public.flagged_content(user_id);
CREATE INDEX idx_banned_users_user_id ON public.banned_users(user_id);
CREATE INDEX idx_user_offenses_user_id ON public.user_offenses(user_id);