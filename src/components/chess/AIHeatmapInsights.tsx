import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Brain, Target, BarChart3, Trophy, Loader2, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { TemporalSignature, QuadrantProfile, TemporalFlow } from '@/lib/pensent-core/types';
import { classifyUniversalArchetype } from '@/lib/pensent-core/archetype';

interface PieceActivity {
  pieceType: string;
  color: string;
  count: number;
  percentage: number;
}

interface GameContext {
  whiteName?: string;
  blackName?: string;
  event?: string;
  result?: string;
  opening?: string;
  totalMoves: number;
}

interface AIInsights {
  commentary: string;
  strategic: string;
  recommendation: string;
  comparison: string;
  mvpInsight: string;
}

interface AIHeatmapInsightsProps {
  pieceActivity: PieceActivity[];
  gameContext: GameContext;
  territoryData?: {
    whiteControl: number;
    blackControl: number;
  };
  compact?: boolean;
}

// Extract temporal signature from piece activity for En Pensent pattern integration
function extractTemporalSignature(
  pieceActivity: PieceActivity[],
  gameContext: GameContext,
  territoryData?: { whiteControl: number; blackControl: number }
): TemporalSignature {
  // Calculate quadrant profile from piece activity distribution
  const whitePieces = pieceActivity.filter(p => p.color === 'white');
  const blackPieces = pieceActivity.filter(p => p.color === 'black');
  
  const whiteActivity = whitePieces.reduce((sum, p) => sum + p.count, 0);
  const blackActivity = blackPieces.reduce((sum, p) => sum + p.count, 0);
  const totalActivity = whiteActivity + blackActivity || 1;
  
  // Map piece activity to quadrant profile (q1-q4 representing board quadrants)
  const q1 = Math.min(1, whiteActivity / 50);
  const q2 = territoryData ? Math.min(1, territoryData.whiteControl / 32) : 0.5;
  const q3 = Math.min(1, blackActivity / 50);
  const q4 = territoryData ? Math.min(1, territoryData.blackControl / 32) : 0.5;
  
  const quadrantProfile: QuadrantProfile = { q1, q2, q3, q4 };
  
  // Build temporal flow from game progression
  const gameProgress = gameContext.totalMoves / 80; // Normalize to typical game length
  const temporalFlow: TemporalFlow = {
    opening: gameProgress < 0.2 ? 0.8 : 0.3,
    middle: gameProgress >= 0.2 && gameProgress < 0.6 ? 0.8 : 0.4,
    ending: gameProgress >= 0.6 ? 0.8 : 0.2,
    trend: whiteActivity > blackActivity * 1.2 ? 'accelerating' : 
           blackActivity > whiteActivity * 1.2 ? 'declining' : 'stable',
    momentum: (whiteActivity - blackActivity) / totalActivity
  };
  
  // Calculate intensity from activity levels
  const intensity = Math.min(1, totalActivity / 100);
  
  // Generate fingerprint from game context
  const fingerprint = `heatmap_${gameContext.totalMoves}_${Math.round(intensity * 100)}`;
  
  // Determine dominant force
  const dominantForce: 'primary' | 'secondary' | 'balanced' = 
    whiteActivity > blackActivity * 1.1 ? 'primary' :
    blackActivity > whiteActivity * 1.1 ? 'secondary' : 'balanced';
  
  // Build complete signature
  const signature: TemporalSignature = {
    quadrantProfile,
    temporalFlow,
    intensity,
    fingerprint,
    archetype: 'unknown', // Will be classified below
    dominantForce,
    flowDirection: temporalFlow.momentum > 0.2 ? 'forward' : 
                   temporalFlow.momentum < -0.2 ? 'backward' : 'lateral',
    criticalMoments: []
  };
  
  // Classify archetype using En Pensent universal classifier
  signature.archetype = classifyUniversalArchetype(signature);
  
  return signature;
}

const INSIGHT_ICONS = {
  commentary: Sparkles,
  strategic: Brain,
  recommendation: Target,
  comparison: BarChart3,
  mvpInsight: Trophy,
};

const INSIGHT_LABELS = {
  commentary: 'Key Observation',
  strategic: 'Strategic Analysis',
  recommendation: 'Explore This',
  comparison: 'Pattern Comparison',
  mvpInsight: 'MVP Insight',
};

export const AIHeatmapInsights: React.FC<AIHeatmapInsightsProps> = ({
  pieceActivity,
  gameContext,
  territoryData,
  compact = false,
}) => {
  const [insights, setInsights] = useState<AIInsights | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeInsight, setActiveInsight] = useState<keyof AIInsights>('commentary');

  // Extract En Pensent temporal signature for pattern analysis
  const temporalSignature = useMemo(() => {
    if (pieceActivity.length === 0) return null;
    return extractTemporalSignature(pieceActivity, gameContext, territoryData);
  }, [pieceActivity, gameContext, territoryData]);

  // Derive game archetype from temporal signature
  const gameArchetype = temporalSignature?.archetype ?? 'unknown';

  const fetchInsights = async () => {
    if (pieceActivity.length === 0) return;
    
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('chess-heatmap-analysis', {
        body: { pieceActivity, gameContext, territoryData },
      });

      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);
      
      setInsights(data.insights);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate insights';
      setError(message);
      if (message.includes('Rate limit')) {
        toast.error('AI rate limit reached. Try again in a moment.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Auto-fetch when piece activity is available
    if (pieceActivity.length > 0 && !insights && !isLoading) {
      fetchInsights();
    }
  }, [pieceActivity]);

  if (compact) {
    return (
      <div className="p-2 bg-background/50 rounded-lg border border-border/50">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-3 h-3 text-amber-400" />
          <span className="text-xs font-medium text-muted-foreground">AI Insights</span>
          {isLoading && <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />}
        </div>
        {insights ? (
          <p className="text-xs text-foreground/80 line-clamp-2">{insights.commentary}</p>
        ) : error ? (
          <p className="text-xs text-destructive">{error}</p>
        ) : (
          <p className="text-xs text-muted-foreground">Analyzing patterns...</p>
        )}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-3 bg-gradient-to-br from-amber-500/10 to-purple-500/10 rounded-lg border border-amber-500/20"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-amber-500/20 rounded-md">
            <Sparkles className="w-4 h-4 text-amber-400" />
          </div>
          <span className="text-sm font-semibold text-foreground">AI Chess Analysis</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={fetchInsights}
          disabled={isLoading}
          className="h-7 px-2"
        >
          {isLoading ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <RefreshCw className="w-3 h-3" />
          )}
        </Button>
      </div>

      {/* Insight Type Tabs */}
      <div className="flex gap-1 mb-3 overflow-x-auto pb-1">
        {(Object.keys(INSIGHT_ICONS) as Array<keyof AIInsights>).map((key) => {
          const Icon = INSIGHT_ICONS[key];
          return (
            <button
              key={key}
              onClick={() => setActiveInsight(key)}
              className={`flex items-center gap-1 px-2 py-1 rounded text-xs whitespace-nowrap transition-colors ${
                activeInsight === key
                  ? 'bg-amber-500/20 text-amber-300'
                  : 'bg-background/30 text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="w-3 h-3" />
              <span className="hidden sm:inline">{INSIGHT_LABELS[key]}</span>
            </button>
          );
        })}
      </div>

      {/* Insight Content */}
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2 py-4 justify-center"
          >
            <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
            <span className="text-sm text-muted-foreground">Analyzing piece patterns...</span>
          </motion.div>
        ) : error ? (
          <motion.div
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-sm text-destructive py-2"
          >
            {error}
          </motion.div>
        ) : insights ? (
          <motion.div
            key={activeInsight}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
            className="min-h-[60px]"
          >
            <div className="flex items-start gap-2">
              {React.createElement(INSIGHT_ICONS[activeInsight], {
                className: 'w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0',
              })}
              <div>
                <p className="text-xs font-medium text-amber-300 mb-1">
                  {INSIGHT_LABELS[activeInsight]}
                </p>
                <p className="text-sm text-foreground/90 leading-relaxed">
                  {insights[activeInsight]}
                </p>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sm text-muted-foreground py-2 text-center"
          >
            Click refresh to generate AI insights
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
