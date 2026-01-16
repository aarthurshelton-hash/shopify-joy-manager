import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Brain, GitBranch, Share2, Download, ExternalLink, Copy, Check, Calendar, Users, FileCode } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AnalysisReport {
  id: string;
  repository_url: string;
  repository_name: string;
  owner: string;
  fingerprint: string;
  archetype: string;
  dominant_force: string;
  flow_direction: string;
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
  code_metrics: {
    featureRatio: number;
    bugfixRatio: number;
    refactorRatio: number;
    totalCommits: number;
  };
  total_commits: number;
  total_contributors: number;
  analysis_period_start: string;
  analysis_period_end: string;
  predicted_outcome: string;
  outcome_confidence: number;
  recommendations: string[];
  created_at: string;
}

export default function SharedAnalysisReport() {
  const { id } = useParams<{ id: string }>();
  const [report, setReport] = useState<AnalysisReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchReport = async () => {
      if (!id) {
        setError('Invalid report ID');
        setLoading(false);
        return;
      }

      try {
        const { data, error: fetchError } = await supabase
          .from('code_repository_patterns')
          .select('*')
          .eq('id', id)
          .single();

        if (fetchError) throw fetchError;
        if (!data) throw new Error('Report not found');

        setReport(data as unknown as AnalysisReport);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load report');
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [id]);

  const copyShareLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast({ title: 'Link Copied!', description: 'Share this URL to show your analysis' });
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <Brain className="h-12 w-12 text-primary animate-pulse mx-auto mb-4" />
          <p className="text-muted-foreground">Loading analysis report...</p>
        </motion.div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <p className="text-destructive mb-4">{error || 'Report not found'}</p>
            <Link to="/code-analysis">
              <Button>Go to Code Analysis</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const archetypeColors: Record<string, string> = {
    'Methodical Architect': 'text-blue-500',
    'Rapid Innovator': 'text-orange-500',
    'Quality Guardian': 'text-green-500',
    'Fire Fighter': 'text-red-500',
    'Balanced Builder': 'text-purple-500',
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/code-analysis">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Analyze Another
                </Button>
              </Link>
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Brain className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h1 className="font-bold text-lg">En Pensent Code™ Report</h1>
                  <p className="text-xs text-muted-foreground">Shareable Analysis</p>
                </div>
              </div>
            </div>
            <Button onClick={copyShareLink} variant="outline" className="gap-2">
              {copied ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
              Share Report
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Repository Info */}
          <Card className="mb-8">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <GitBranch className="h-5 w-5 text-muted-foreground" />
                    <h2 className="text-2xl font-bold">{report.owner}/{report.repository_name}</h2>
                  </div>
                  <a 
                    href={report.repository_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline flex items-center gap-1"
                  >
                    View on GitHub <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <FileCode className="h-4 w-4" />
                    {report.total_commits} commits
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {report.total_contributors} contributors
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {new Date(report.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Archetype & Prediction */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Development Archetype</CardTitle>
              </CardHeader>
              <CardContent>
                <p className={`text-3xl font-bold mb-2 ${archetypeColors[report.archetype] || 'text-primary'}`}>
                  {report.archetype}
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  Fingerprint: <code className="text-xs bg-muted px-1 py-0.5 rounded">{report.fingerprint.slice(0, 16)}...</code>
                </p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Dominant Force:</span>
                    <p className="font-medium capitalize">{report.dominant_force}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Flow Direction:</span>
                    <p className="font-medium capitalize">{report.flow_direction}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Predicted Outcome</CardTitle>
              </CardHeader>
              <CardContent>
                <p className={`text-3xl font-bold mb-2 capitalize ${
                  report.predicted_outcome === 'success' ? 'text-green-500' : 
                  report.predicted_outcome === 'failure' ? 'text-red-500' : 'text-yellow-500'
                }`}>
                  {report.predicted_outcome}
                </p>
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Confidence</span>
                    <span className="font-medium">{Math.round(report.outcome_confidence * 100)}%</span>
                  </div>
                  <Progress value={report.outcome_confidence * 100} />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Intensity</span>
                    <span className="font-medium">{Math.round(report.intensity * 100)}%</span>
                  </div>
                  <Progress value={report.intensity * 100} />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quadrant Profile */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-lg">Quadrant Profile (Spatial Distribution)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(report.quadrant_profile).map(([key, value]) => (
                  <div key={key} className="p-4 bg-muted rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium uppercase">{key}</span>
                      <span className="text-sm text-muted-foreground">{Math.round(value * 100)}%</span>
                    </div>
                    <Progress value={value * 100} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Temporal Flow */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-lg">Temporal Flow (Activity Over Time)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                {Object.entries(report.temporal_flow).map(([phase, value]) => (
                  <div key={phase} className="text-center p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground capitalize mb-1">{phase}</p>
                    <p className="text-2xl font-bold">{Math.round(value * 100)}%</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recommendations */}
          {report.recommendations && report.recommendations.length > 0 && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="text-lg">Strategic Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {report.recommendations.map((rec, index) => (
                    <li key={index} className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-sm font-medium flex items-center justify-center">
                        {index + 1}
                      </span>
                      <span className="text-sm">{rec}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Footer */}
          <div className="text-center py-8 border-t">
            <p className="text-sm text-muted-foreground mb-4">
              Analyzed with En Pensent™ Universal Pattern Recognition Engine
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link to="/academic-paper">
                <Button variant="outline" size="sm" className="gap-2">
                  <ExternalLink className="h-4 w-4" />
                  Read the Paper
                </Button>
              </Link>
              <Link to="/sdk-docs">
                <Button variant="outline" size="sm" className="gap-2">
                  <ExternalLink className="h-4 w-4" />
                  SDK Documentation
                </Button>
              </Link>
              <Link to="/code-analysis">
                <Button size="sm" className="gap-2">
                  <Brain className="h-4 w-4" />
                  Analyze Your Repo
                </Button>
              </Link>
            </div>
            <p className="text-xs text-muted-foreground mt-6">
              © 2024 En Pensent Technologies. Patent Pending. All rights reserved.
            </p>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
