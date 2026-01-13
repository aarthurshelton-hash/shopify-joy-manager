-- Create table for DMCA reports
CREATE TABLE public.dmca_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_name TEXT NOT NULL,
  reporter_email TEXT NOT NULL,
  reporter_address TEXT,
  reporter_phone TEXT,
  copyrighted_work_description TEXT NOT NULL,
  infringing_material_url TEXT NOT NULL,
  infringing_material_description TEXT NOT NULL,
  good_faith_statement BOOLEAN NOT NULL DEFAULT false,
  accuracy_statement BOOLEAN NOT NULL DEFAULT false,
  electronic_signature TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  status TEXT NOT NULL DEFAULT 'pending',
  admin_notes TEXT,
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.dmca_reports ENABLE ROW LEVEL SECURITY;

-- Users can insert reports
CREATE POLICY "Anyone can submit DMCA reports"
  ON public.dmca_reports
  FOR INSERT
  WITH CHECK (true);

-- Users can view their own reports
CREATE POLICY "Users can view their own reports"
  ON public.dmca_reports
  FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can view all reports
CREATE POLICY "Admins can view all DMCA reports"
  ON public.dmca_reports
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Admins can update reports
CREATE POLICY "Admins can update DMCA reports"
  ON public.dmca_reports
  FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- Add updated_at trigger
CREATE TRIGGER update_dmca_reports_updated_at
  BEFORE UPDATE ON public.dmca_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();