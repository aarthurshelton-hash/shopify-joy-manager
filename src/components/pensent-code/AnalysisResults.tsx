import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Save, 
  Download, 
  GitCommit, 
  Users, 
  Calendar, 
  Hash,
  ExternalLink,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { ArchetypeDisplay } from './ArchetypeDisplay';
import { CodeMetricsChart } from './CodeMetricsChart';
import { RecommendationsPanel } from './RecommendationsPanel';
import { ShareReportButton } from './ShareReportButton';
import { SignatureVisualization } from './SignatureVisualization';
import { CodeAnalysisResult, useCodeAnalysis } from '@/hooks/useCodeAnalysis';
import { format } from 'date-fns';

interface AnalysisResultsProps {
  result: CodeAnalysisResult;
  onSave?: () => void;
}

export function AnalysisResults({ result, onSave }: AnalysisResultsProps) {
  const [showCommits, setShowCommits] = useState(false);
  const { saveAnalysis } = useCodeAnalysis();
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    // Note: This would need the actual user ID in a real implementation
    // For now, we'll show a message that login is required
    setIsSaving(false);
    onSave?.();
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(result, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${result.repository_name}-analysis.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header with repo info */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-xl">
                {result.repository_name}
                <a 
                  href={result.repository_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </CardTitle>
              <CardDescription className="mt-1">
                by {result.owner}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <ShareReportButton result={result} />
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button size="sm" onClick={handleSave} disabled={isSaving}>
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <GitCommit className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-sm text-muted-foreground">Total Commits</div>
                <div className="font-semibold">{result.total_commits}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-sm text-muted-foreground">Contributors</div>
                <div className="font-semibold">{result.total_contributors}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-sm text-muted-foreground">Analysis Period</div>
                <div className="font-semibold text-sm">
                  {result.analysis_period_start && format(new Date(result.analysis_period_start), 'MMM d')} - {result.analysis_period_end && format(new Date(result.analysis_period_end), 'MMM d, yyyy')}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Hash className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-sm text-muted-foreground">Fingerprint</div>
                <div className="font-mono text-sm truncate max-w-[120px]" title={result.fingerprint}>
                  {result.fingerprint.slice(0, 12)}...
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* En Pensent Temporal Signature Visualization */}
      <SignatureVisualization result={result} animated />

      {/* Archetype Display */}
      <ArchetypeDisplay
        archetype={result.archetype}
        predictedOutcome={result.predicted_outcome}
        outcomeConfidence={result.outcome_confidence}
        intensity={result.intensity}
        dominantForce={result.dominant_force}
        flowDirection={result.flow_direction}
      />

      {/* Metrics Charts */}
      <CodeMetricsChart
        metrics={result.code_metrics}
        quadrantProfile={result.quadrant_profile}
        temporalFlow={result.temporal_flow}
      />

      {/* Recommendations & Critical Moments */}
      <RecommendationsPanel
        recommendations={result.recommendations}
        criticalMoments={result.critical_moments}
      />

      {/* Commit History (Collapsible) */}
      <Card>
        <CardHeader 
          className="cursor-pointer"
          onClick={() => setShowCommits(!showCommits)}
        >
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Commit History</CardTitle>
              <CardDescription>
                {result.commits.length} commits analyzed
              </CardDescription>
            </div>
            {showCommits ? (
              <ChevronUp className="h-5 w-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
        </CardHeader>
        {showCommits && (
          <CardContent>
            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                {result.commits.map((commit, index) => (
                  <div key={commit.commit_hash} className="border rounded-lg p-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{commit.commit_message}</p>
                        <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                          <span>{commit.author}</span>
                          <span>•</span>
                          <span>{format(new Date(commit.committed_at), 'MMM d, yyyy')}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Badge variant="outline" className="capitalize">
                          {commit.commit_type}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          +{commit.additions} -{commit.deletions}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
