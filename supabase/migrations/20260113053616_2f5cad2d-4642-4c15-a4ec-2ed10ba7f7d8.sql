-- Create table for DMCA counter-notifications
CREATE TABLE public.dmca_counter_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  
  -- Counter-notifier info
  notifier_name TEXT NOT NULL,
  notifier_email TEXT NOT NULL,
  notifier_address TEXT NOT NULL,
  notifier_phone TEXT,
  
  -- Original takedown reference
  original_report_id UUID REFERENCES public.dmca_reports(id),
  original_takedown_description TEXT NOT NULL,
  
  -- Content identification
  removed_content_url TEXT,
  removed_content_description TEXT NOT NULL,
  
  -- Legal statements
  good_faith_statement BOOLEAN NOT NULL DEFAULT false,
  perjury_statement BOOLEAN NOT NULL DEFAULT false,
  jurisdiction_consent BOOLEAN NOT NULL DEFAULT false,
  
  -- Electronic signature
  electronic_signature TEXT NOT NULL,
  
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'accepted', 'rejected')),
  admin_notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.dmca_counter_notifications ENABLE ROW LEVEL SECURITY;

-- Users can submit counter-notifications
CREATE POLICY "Users can submit counter-notifications"
ON public.dmca_counter_notifications
FOR INSERT
WITH CHECK (true);

-- Users can view their own counter-notifications
CREATE POLICY "Users can view their own counter-notifications"
ON public.dmca_counter_notifications
FOR SELECT
USING (auth.uid() = user_id);

-- Admins can view all counter-notifications
CREATE POLICY "Admins can view all counter-notifications"
ON public.dmca_counter_notifications
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Admins can update counter-notifications
CREATE POLICY "Admins can update counter-notifications"
ON public.dmca_counter_notifications
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- Create updated_at trigger
CREATE TRIGGER update_dmca_counter_notifications_updated_at
BEFORE UPDATE ON public.dmca_counter_notifications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();