-- Table to track detected code issues
CREATE TABLE public.code_issues (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  file_path TEXT NOT NULL,
  issue_type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'medium',
  description TEXT NOT NULL,
  confidence NUMERIC NOT NULL DEFAULT 0.5,
  line_start INTEGER,
  line_end INTEGER,
  detected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  auto_fixable BOOLEAN DEFAULT false,
  fix_applied BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Table to store pending/applied fixes
CREATE TABLE public.pending_fixes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  issue_id UUID REFERENCES public.code_issues(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  original_code TEXT,
  fixed_code TEXT,
  fix_prompt TEXT NOT NULL,
  confidence NUMERIC NOT NULL DEFAULT 0.5,
  status TEXT NOT NULL DEFAULT 'pending',
  generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  applied_at TIMESTAMP WITH TIME ZONE,
  approved_by TEXT,
  ai_model TEXT DEFAULT 'lovable-ai',
  generation_metadata JSONB DEFAULT '{}'::jsonb
);

-- Table to track auto-healing runs
CREATE TABLE public.auto_heal_runs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  issues_detected INTEGER DEFAULT 0,
  fixes_generated INTEGER DEFAULT 0,
  fixes_applied INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'running',
  error_message TEXT,
  run_metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS
ALTER TABLE public.code_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pending_fixes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auto_heal_runs ENABLE ROW LEVEL SECURITY;

-- Public read policies (system tables)
CREATE POLICY "Anyone can view code issues" ON public.code_issues FOR SELECT USING (true);
CREATE POLICY "Anyone can view pending fixes" ON public.pending_fixes FOR SELECT USING (true);
CREATE POLICY "Anyone can view auto heal runs" ON public.auto_heal_runs FOR SELECT USING (true);

-- System can insert/update (via service role in edge functions)
CREATE POLICY "Service can manage code issues" ON public.code_issues FOR ALL USING (true);
CREATE POLICY "Service can manage pending fixes" ON public.pending_fixes FOR ALL USING (true);
CREATE POLICY "Service can manage auto heal runs" ON public.auto_heal_runs FOR ALL USING (true);

-- Index for performance
CREATE INDEX idx_code_issues_unresolved ON public.code_issues(detected_at) WHERE resolved_at IS NULL;
CREATE INDEX idx_pending_fixes_status ON public.pending_fixes(status);
CREATE INDEX idx_auto_heal_runs_status ON public.auto_heal_runs(status);