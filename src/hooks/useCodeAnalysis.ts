import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface CodeAnalysisResult {
  repository_url: string;
  repository_name: string;
  owner: string;
  fingerprint: string;
  archetype: string;
  dominant_force: 'primary' | 'secondary' | 'balanced';
  flow_direction: 'forward' | 'lateral' | 'backward' | 'chaotic';
  intensity: number;
  quadrant_profile: {
    q1: number;
    q2: number;
    q3: number;
    q4: number;
  };
  temporal_flow: {
    opening: number;
    midgame: number;
    endgame: number;
  };
  critical_moments: Array<{
    index: number;
    type: string;
    description: string;
  }>;
  code_metrics: {
    featureRatio: number;
    bugfixRatio: number;
    refactorRatio: number;
    docRatio: number;
    testRatio: number;
    choreRatio: number;
    totalCommits: number;
    analyzedCommits: number;
    typeCounts: Record<string, number>;
  };
  total_commits: number;
  total_contributors: number;
  analysis_period_start: string;
  analysis_period_end: string;
  predicted_outcome: 'success' | 'failure' | 'uncertain';
  outcome_confidence: number;
  recommendations: string[];
  commits: Array<{
    commit_hash: string;
    commit_message: string;
    commit_type: string;
    author: string;
    author_email: string;
    committed_at: string;
    files_changed: number;
    additions: number;
    deletions: number;
    file_categories: Record<string, number>;
    impact_score: number;
  }>;
}

export function useCodeAnalysis() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<CodeAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const analyzeRepository = async (repositoryUrl: string, githubToken?: string) => {
    setIsAnalyzing(true);
    setError(null);
    setResult(null);

    try {
      const { data, error: functionError } = await supabase.functions.invoke('analyze-repository', {
        body: { repositoryUrl, githubToken },
      });

      if (functionError) {
        throw new Error(functionError.message);
      }

      if (data.error) {
        throw new Error(data.error);
      }

      setResult(data);
      toast({
        title: 'Analysis Complete',
        description: `Repository "${data.repository_name}" analyzed successfully. Archetype: ${data.archetype}`,
      });

      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to analyze repository';
      setError(message);
      toast({
        title: 'Analysis Failed',
        description: message,
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  };

  const saveAnalysis = async (userId: string) => {
    if (!result) return null;

    try {
      const { data: pattern, error: patternError } = await supabase
        .from('code_repository_patterns')
        .insert({
          repository_url: result.repository_url,
          repository_name: result.repository_name,
          owner: result.owner,
          fingerprint: result.fingerprint,
          archetype: result.archetype,
          dominant_force: result.dominant_force,
          flow_direction: result.flow_direction,
          intensity: result.intensity,
          quadrant_profile: result.quadrant_profile,
          temporal_flow: result.temporal_flow,
          critical_moments: result.critical_moments,
          code_metrics: result.code_metrics,
          total_commits: result.total_commits,
          total_contributors: result.total_contributors,
          analysis_period_start: result.analysis_period_start,
          analysis_period_end: result.analysis_period_end,
          predicted_outcome: result.predicted_outcome,
          outcome_confidence: result.outcome_confidence,
          recommendations: result.recommendations,
          analyzed_by: userId,
        })
        .select()
        .single();

      if (patternError) throw patternError;

      // Save commit analysis
      if (pattern && result.commits.length > 0) {
        const commitRecords = result.commits.map(commit => ({
          repository_pattern_id: pattern.id,
          ...commit,
        }));

        const { error: commitsError } = await supabase
          .from('code_commit_analysis')
          .insert(commitRecords);

        if (commitsError) {
          console.error('Error saving commits:', commitsError);
        }
      }

      toast({
        title: 'Analysis Saved',
        description: 'Repository pattern saved to database for future reference.',
      });

      return pattern;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save analysis';
      toast({
        title: 'Save Failed',
        description: message,
        variant: 'destructive',
      });
      return null;
    }
  };

  const clearResult = () => {
    setResult(null);
    setError(null);
  };

  return {
    analyzeRepository,
    saveAnalysis,
    clearResult,
    isAnalyzing,
    result,
    error,
  };
}
