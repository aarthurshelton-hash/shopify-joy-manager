import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Brain, Target, BarChart3, Trophy, Loader2, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

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
