import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Share2, Copy, Check, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import type { CodeAnalysisResult } from '@/hooks/useCodeAnalysis';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface ShareReportButtonProps {
  result: CodeAnalysisResult;
}

export function ShareReportButton({ result }: ShareReportButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const generateShareableReport = async () => {
    setSaving(true);
    try {
      // Check if this repo already has a saved pattern
      const { data: existing } = await supabase
        .from('code_repository_patterns')
        .select('id')
        .eq('fingerprint', result.fingerprint)
        .single();

      let reportId: string;

      if (existing) {
        reportId = existing.id;
      } else {
        // Save the analysis
        const { data: pattern, error } = await supabase
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
            analyzed_by: user?.id || null,
          })
          .select('id')
          .single();

        if (error) throw error;
        reportId = pattern.id;
      }

      const url = `${window.location.origin}/analysis/${reportId}`;
      setShareUrl(url);
      
      toast({
        title: 'Report Ready to Share!',
        description: 'Copy the link below to share your analysis.',
      });
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to generate shareable link',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const copyLink = () => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast({ title: 'Copied!', description: 'Link copied to clipboard' });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const openInNewTab = () => {
    if (shareUrl) {
      window.open(shareUrl, '_blank');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Share2 className="h-4 w-4" />
          Share Report
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share Analysis Report</DialogTitle>
          <DialogDescription>
            Generate a permanent, shareable link to this analysis that anyone can view.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          {!shareUrl ? (
            <Button 
              onClick={generateShareableReport} 
              disabled={saving}
              className="w-full"
            >
              {saving ? 'Generating...' : 'Generate Shareable Link'}
            </Button>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                <input
                  type="text"
                  value={shareUrl}
                  readOnly
                  className="flex-1 bg-transparent text-sm outline-none"
                />
                <Button variant="ghost" size="sm" onClick={copyLink}>
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              
              <div className="flex gap-2">
                <Button onClick={copyLink} variant="outline" className="flex-1 gap-2">
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  Copy Link
                </Button>
                <Button onClick={openInNewTab} className="flex-1 gap-2">
                  <ExternalLink className="h-4 w-4" />
                  Open Report
                </Button>
              </div>

              <p className="text-xs text-muted-foreground text-center">
                This link is permanent and can be shared with investors, team members, or anyone interested in the analysis.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
