import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Brain, Sparkles, CheckCircle, AlertTriangle, Loader2, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ValidationResult {
  content: string;
  isComplete: boolean;
}

export function AIConceptValidator() {
  const [isValidating, setIsValidating] = useState(false);
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const validateConcept = async () => {
    setIsValidating(true);
    setError(null);
    setResult({ content: '', isComplete: false });

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/validate-concept`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ validationType: 'full' }),
        }
      );

      if (!response.ok) {
        throw new Error(`Validation failed: ${response.status}`);
      }

      if (!response.body) {
        throw new Error('No response body');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = '';
      let fullContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              fullContent += content;
              setResult({ content: fullContent, isComplete: false });
            }
          } catch {
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }

      setResult({ content: fullContent, isComplete: true });
    } catch (err) {
      console.error('Validation error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsValidating(false);
    }
  };

  const parseScores = (content: string) => {
    const innovationMatch = content.match(/innovation\s*(?:score)?[:\s]*(\d+)/i);
    const marketMatch = content.match(/market\s*(?:potential)?\s*(?:score)?[:\s]*(\d+)/i);
    const technicalMatch = content.match(/technical\s*(?:feasibility)?\s*(?:score)?[:\s]*(\d+)/i);
    const verdictMatch = content.match(/(?:overall\s*)?verdict[:\s]*(strong|promising|needs work|weak)/i);

    return {
      innovation: innovationMatch ? parseInt(innovationMatch[1]) : null,
      market: marketMatch ? parseInt(marketMatch[1]) : null,
      technical: technicalMatch ? parseInt(technicalMatch[1]) : null,
      verdict: verdictMatch ? verdictMatch[1].toLowerCase() : null,
    };
  };

  const scores = result ? parseScores(result.content) : null;

  const getVerdictColor = (verdict: string | null) => {
    switch (verdict) {
      case 'strong': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'promising': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'needs work': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'weak': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getScoreColor = (score: number | null) => {
    if (score === null) return 'text-muted-foreground';
    if (score >= 8) return 'text-green-400';
    if (score >= 6) return 'text-blue-400';
    if (score >= 4) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <Card className="border-primary/20 bg-card/50 backdrop-blur">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Brain className="h-5 w-5 text-primary" />
          AI Concept Validator
          <Badge variant="outline" className="ml-2 text-xs">
            Live Demo
          </Badge>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Send En Pensent to AI for real-time validation. See if an AI understands and vouches for the concept.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {!result && !isValidating && (
          <div className="text-center py-6">
            <Sparkles className="h-12 w-12 mx-auto text-primary/50 mb-4" />
            <p className="text-muted-foreground mb-4">
              Click below to have an AI evaluate the En Pensent concept as if they were an investor.
            </p>
            <Button onClick={validateConcept} size="lg" className="gap-2">
              <Brain className="h-4 w-4" />
              Validate Concept with AI
            </Button>
          </div>
        )}

        {isValidating && !result?.content && (
          <div className="text-center py-8">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-4" />
            <p className="text-muted-foreground">Sending concept to AI for evaluation...</p>
          </div>
        )}

        {result && (
          <div className="space-y-4">
            {/* Score Cards */}
            {scores && (scores.innovation || scores.market || scores.technical || scores.verdict) && (
              <div className="grid grid-cols-4 gap-2">
                {scores.verdict && (
                  <div className={`rounded-lg border p-3 text-center ${getVerdictColor(scores.verdict)}`}>
                    <div className="text-xs uppercase opacity-70 mb-1">Verdict</div>
                    <div className="font-bold capitalize">{scores.verdict}</div>
                  </div>
                )}
                {scores.innovation && (
                  <div className="rounded-lg border border-border/50 bg-muted/30 p-3 text-center">
                    <div className="text-xs text-muted-foreground mb-1">Innovation</div>
                    <div className={`text-xl font-bold ${getScoreColor(scores.innovation)}`}>
                      {scores.innovation}/10
                    </div>
                  </div>
                )}
                {scores.market && (
                  <div className="rounded-lg border border-border/50 bg-muted/30 p-3 text-center">
                    <div className="text-xs text-muted-foreground mb-1">Market</div>
                    <div className={`text-xl font-bold ${getScoreColor(scores.market)}`}>
                      {scores.market}/10
                    </div>
                  </div>
                )}
                {scores.technical && (
                  <div className="rounded-lg border border-border/50 bg-muted/30 p-3 text-center">
                    <div className="text-xs text-muted-foreground mb-1">Technical</div>
                    <div className={`text-xl font-bold ${getScoreColor(scores.technical)}`}>
                      {scores.technical}/10
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* AI Response */}
            <div className="rounded-lg border border-border/50 bg-muted/20 p-4 max-h-[500px] overflow-y-auto">
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border/30">
                <Brain className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">AI Assessment</span>
                {result.isComplete ? (
                  <CheckCircle className="h-4 w-4 text-green-500 ml-auto" />
                ) : (
                  <Loader2 className="h-4 w-4 animate-spin text-primary ml-auto" />
                )}
              </div>
              <div className="prose prose-sm prose-invert max-w-none">
                <pre className="whitespace-pre-wrap font-sans text-sm text-foreground/90 leading-relaxed">
                  {result.content || 'Waiting for response...'}
                </pre>
              </div>
            </div>

            {result.isComplete && (
              <div className="flex justify-center">
                <Button variant="outline" onClick={validateConcept} className="gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Run Again
                </Button>
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-center">
            <AlertTriangle className="h-6 w-6 text-destructive mx-auto mb-2" />
            <p className="text-sm text-destructive">{error}</p>
            <Button variant="outline" onClick={validateConcept} className="mt-3 gap-2">
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
