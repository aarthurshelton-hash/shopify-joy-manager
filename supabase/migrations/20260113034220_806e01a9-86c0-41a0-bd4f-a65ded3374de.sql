-- Create scan history table to track user scans
CREATE TABLE public.scan_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  visualization_id UUID REFERENCES public.saved_visualizations(id) ON DELETE SET NULL,
  image_preview TEXT,
  matched BOOLEAN NOT NULL DEFAULT false,
  confidence INTEGER,
  scanned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.scan_history ENABLE ROW LEVEL SECURITY;

-- Users can view their own scan history
CREATE POLICY "Users can view own scan history" 
ON public.scan_history 
FOR SELECT 
USING (auth.uid() = user_id);

-- Users can insert their own scans
CREATE POLICY "Users can insert own scans" 
ON public.scan_history 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own scan history
CREATE POLICY "Users can delete own scans" 
ON public.scan_history 
FOR DELETE 
USING (auth.uid() = user_id);

-- Index for faster queries
CREATE INDEX idx_scan_history_user_id ON public.scan_history(user_id);
CREATE INDEX idx_scan_history_scanned_at ON public.scan_history(scanned_at DESC);