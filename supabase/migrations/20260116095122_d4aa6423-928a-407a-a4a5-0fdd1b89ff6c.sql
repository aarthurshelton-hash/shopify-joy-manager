-- Create table for storing code repository analysis patterns
CREATE TABLE public.code_repository_patterns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  repository_url TEXT NOT NULL,
  repository_name TEXT NOT NULL,
  owner TEXT NOT NULL,
  fingerprint TEXT NOT NULL,
  archetype TEXT NOT NULL,
  dominant_force TEXT NOT NULL,
  flow_direction TEXT NOT NULL,
  intensity NUMERIC NOT NULL,
  quadrant_profile JSONB NOT NULL,
  temporal_flow JSONB NOT NULL,
  critical_moments JSONB NOT NULL DEFAULT '[]'::jsonb,
  code_metrics JSONB NOT NULL,
  total_commits INTEGER NOT NULL DEFAULT 0,
  total_contributors INTEGER NOT NULL DEFAULT 0,
  analysis_period_start TIMESTAMP WITH TIME ZONE,
  analysis_period_end TIMESTAMP WITH TIME ZONE,
  predicted_outcome TEXT,
  outcome_confidence NUMERIC,
  recommendations JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  analyzed_by UUID REFERENCES auth.users(id),
  UNIQUE(repository_url, fingerprint)
);

-- Create table for storing individual commit analysis
CREATE TABLE public.code_commit_analysis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  repository_pattern_id UUID REFERENCES public.code_repository_patterns(id) ON DELETE CASCADE,
  commit_hash TEXT NOT NULL,
  commit_message TEXT,
  commit_type TEXT NOT NULL,
  author TEXT,
  author_email TEXT,
  committed_at TIMESTAMP WITH TIME ZONE NOT NULL,
  files_changed INTEGER NOT NULL DEFAULT 0,
  additions INTEGER NOT NULL DEFAULT 0,
  deletions INTEGER NOT NULL DEFAULT 0,
  file_categories JSONB DEFAULT '{}'::jsonb,
  impact_score NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(repository_pattern_id, commit_hash)
);

-- Create table for tracking archetype predictions vs actual outcomes
CREATE TABLE public.code_prediction_outcomes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  repository_pattern_id UUID REFERENCES public.code_repository_patterns(id) ON DELETE CASCADE,
  predicted_archetype TEXT NOT NULL,
  predicted_outcome TEXT NOT NULL,
  predicted_confidence NUMERIC NOT NULL,
  actual_outcome TEXT,
  outcome_recorded_at TIMESTAMP WITH TIME ZONE,
  prediction_accuracy NUMERIC,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_code_repo_patterns_archetype ON public.code_repository_patterns(archetype);
CREATE INDEX idx_code_repo_patterns_owner ON public.code_repository_patterns(owner);
CREATE INDEX idx_code_repo_patterns_analyzed_by ON public.code_repository_patterns(analyzed_by);
CREATE INDEX idx_code_commit_analysis_repo ON public.code_commit_analysis(repository_pattern_id);
CREATE INDEX idx_code_commit_analysis_type ON public.code_commit_analysis(commit_type);
CREATE INDEX idx_code_prediction_outcomes_repo ON public.code_prediction_outcomes(repository_pattern_id);

-- Enable RLS
ALTER TABLE public.code_repository_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.code_commit_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.code_prediction_outcomes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for code_repository_patterns
CREATE POLICY "Anyone can view public repository patterns"
  ON public.code_repository_patterns
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create patterns"
  ON public.code_repository_patterns
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = analyzed_by);

CREATE POLICY "Users can update their own patterns"
  ON public.code_repository_patterns
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = analyzed_by);

CREATE POLICY "Users can delete their own patterns"
  ON public.code_repository_patterns
  FOR DELETE
  TO authenticated
  USING (auth.uid() = analyzed_by);

-- RLS Policies for code_commit_analysis
CREATE POLICY "Anyone can view commit analysis"
  ON public.code_commit_analysis
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create commit analysis"
  ON public.code_commit_analysis
  FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.code_repository_patterns
    WHERE id = repository_pattern_id AND analyzed_by = auth.uid()
  ));

-- RLS Policies for code_prediction_outcomes
CREATE POLICY "Anyone can view prediction outcomes"
  ON public.code_prediction_outcomes
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create prediction outcomes"
  ON public.code_prediction_outcomes
  FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.code_repository_patterns
    WHERE id = repository_pattern_id AND analyzed_by = auth.uid()
  ));

CREATE POLICY "Users can update their prediction outcomes"
  ON public.code_prediction_outcomes
  FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.code_repository_patterns
    WHERE id = repository_pattern_id AND analyzed_by = auth.uid()
  ));

-- Create trigger for updated_at
CREATE TRIGGER update_code_repository_patterns_updated_at
  BEFORE UPDATE ON public.code_repository_patterns
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();