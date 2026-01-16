/**
 * Predictive Analysis Panel
 * 
 * Displays deep position analysis with 30-move lookahead,
 * best move recommendations, and future position predictions.
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Brain,
  TrendingUp,
  Eye,
  Zap,
  Target,
  ChevronRight,
  Loader2,
  Sparkles,
  AlertTriangle,
  Shield,
  Crown,
  Crosshair,
} from 'lucide-react';
import { usePredictiveAnalysis } from '@/hooks/usePredictiveAnalysis';
import { PositionPotential, MoveRecommendation, TacticalTheme, Vulnerability } from '@/lib/chess/predictiveAnalysis';

interface PredictiveAnalysisPanelProps {
  fen: string;
  onMoveClick?: (move: string) => void;
  compact?: boolean;
  autoAnalyze?: boolean;
}

export const PredictiveAnalysisPanel: React.FC<PredictiveAnalysisPanelProps> = ({
  fen,
  onMoveClick,
  compact = false,
  autoAnalyze = false,
}) => {
  const {
    isAnalyzing,
    progress,
    error,
    positionPotential,
    moveRecommendation,
    analyzePosition,
    getBestMove,
    clearResults,
  } = usePredictiveAnalysis();

  const [showFuturePositions, setShowFuturePositions] = useState(false);

  useEffect(() => {
    if (autoAnalyze && fen) {
      analyzePosition(fen, { depth: 18, lookahead: 10 });
    }
  }, [fen, autoAnalyze, analyzePosition]);

  const handleAnalyze = async () => {
    clearResults();
    await analyzePosition(fen, { depth: 20, lookahead: 15 });
  };

  const handleGetBestMove = async () => {
    await getBestMove(fen, 20);
  };

  if (compact) {
    return (
      <div className="p-3 rounded-lg border border-border/50 bg-card/50 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Predictive Engine</span>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={handleGetBestMove}
            disabled={isAnalyzing || !fen}
            className="h-7 text-xs"
          >
            {isAnalyzing ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Best Move'}
          </Button>
        </div>
        
        {moveRecommendation && (
          <div className="flex items-center gap-2">
            <Badge className="bg-primary/10 text-primary">
              {moveRecommendation.move}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {moveRecommendation.confidence}% confidence
            </span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          <h3 className="font-display text-sm uppercase tracking-wider">
            Predictive Analysis
          </h3>
          <Badge variant="outline" className="text-[10px]">
            30-Move Lookahead
          </Badge>
        </div>
        
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleGetBestMove}
            disabled={isAnalyzing || !fen}
          >
            {isAnalyzing ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Target className="h-3 w-3 mr-1" />}
            Best Move
          </Button>
          <Button
            size="sm"
            onClick={handleAnalyze}
            disabled={isAnalyzing || !fen}
            className="bg-primary/90 hover:bg-primary"
          >
            {isAnalyzing ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Sparkles className="h-3 w-3 mr-1" />}
            Deep Analysis
          </Button>
        </div>
      </div>

      {/* Progress */}
      <AnimatePresence>
        {isAnalyzing && progress && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2 p-3 rounded-lg bg-primary/5 border border-primary/20"
          >
            <div className="flex items-center justify-between text-xs">
              <span className="text-primary">{progress.stage}</span>
              <span className="text-muted-foreground">{progress.percent}%</span>
            </div>
            <Progress value={progress.percent} className="h-1" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error */}
      {error && (
        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          <span className="text-sm text-destructive">{error}</span>
        </div>
      )}

      {/* Best Move Recommendation */}
      {moveRecommendation && (
        <MoveRecommendationCard 
          recommendation={moveRecommendation} 
          onMoveClick={onMoveClick}
        />
      )}

      {/* Position Potential Analysis */}
      {positionPotential && (
        <PositionPotentialCard 
          potential={positionPotential}
          showFuturePositions={showFuturePositions}
          onToggleFuture={() => setShowFuturePositions(!showFuturePositions)}
        />
      )}

      {/* Empty state */}
      {!isAnalyzing && !positionPotential && !moveRecommendation && !error && (
        <div className="p-6 rounded-lg border border-dashed border-border/50 text-center">
          <Brain className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
          <p className="text-sm text-muted-foreground">
            Analyze this position to see 30-move predictions
          </p>
        </div>
      )}
    </div>
  );
};

// Sub-components

const MoveRecommendationCard: React.FC<{
  recommendation: MoveRecommendation;
  onMoveClick?: (move: string) => void;
}> = ({ recommendation, onMoveClick }) => (
  <div className="p-4 rounded-lg bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/30">
    <div className="flex items-start justify-between mb-3">
      <div>
        <Badge className="bg-green-500/20 text-green-600 border-green-500/30 mb-2">
          <Target className="h-3 w-3 mr-1" />
          Best Move
        </Badge>
        <button
          onClick={() => onMoveClick?.(recommendation.move)}
          className="text-2xl font-display font-bold text-green-500 hover:text-green-400 transition-colors"
        >
          {recommendation.move}
        </button>
      </div>
      <div className="text-right">
        <div className="text-2xl font-bold text-green-500">
          {recommendation.confidence}%
        </div>
        <div className="text-xs text-muted-foreground">Confidence</div>
      </div>
    </div>
    
    {/* Evaluation */}
    <div className="grid grid-cols-2 gap-3 mb-3">
      <div className="p-2 rounded bg-background/50">
        <div className="text-xs text-muted-foreground">Evaluation</div>
        <div className={`font-mono font-bold ${
          recommendation.evaluation > 0 ? 'text-green-500' :
          recommendation.evaluation < 0 ? 'text-red-500' : 'text-muted-foreground'
        }`}>
          {recommendation.evaluation > 0 ? '+' : ''}{(recommendation.evaluation / 100).toFixed(2)}
        </div>
      </div>
      <div className="p-2 rounded bg-background/50">
        <div className="text-xs text-muted-foreground">Improvement</div>
        <div className={`font-mono font-bold ${
          recommendation.improvement > 0 ? 'text-green-500' : 'text-muted-foreground'
        }`}>
          +{(recommendation.improvement / 100).toFixed(2)}
        </div>
      </div>
    </div>
    
    {/* Reasoning */}
    <div className="space-y-1">
      <div className="text-xs text-muted-foreground">Why this move:</div>
      <ul className="text-xs space-y-1">
        {recommendation.reasoning.map((reason, i) => (
          <li key={i} className="flex items-center gap-1 text-green-600">
            <ChevronRight className="h-3 w-3" />
            {reason}
          </li>
        ))}
      </ul>
    </div>
    
    {/* Visual Impact */}
    <div className="mt-3 pt-3 border-t border-green-500/20">
      <div className="flex items-center gap-2 text-xs">
        <Eye className="h-3 w-3 text-green-500" />
        <span className="text-muted-foreground">Visual impact:</span>
        <span className="text-green-600">{recommendation.visualImpact}</span>
      </div>
    </div>
  </div>
);

const PositionPotentialCard: React.FC<{
  potential: PositionPotential;
  showFuturePositions: boolean;
  onToggleFuture: () => void;
}> = ({ potential, showFuturePositions, onToggleFuture }) => (
  <div className="space-y-3">
    {/* Position Type & Dynamism */}
    <div className="p-3 rounded-lg border border-border/50 bg-card/50">
      <div className="flex items-center justify-between mb-2">
        <Badge variant="outline" className="capitalize">
          {potential.positionType.replace('_', ' ')}
        </Badge>
        <div className="flex items-center gap-2">
          <Zap className="h-3 w-3 text-amber-500" />
          <span className="text-xs">Dynamism: {potential.dynamism}%</span>
        </div>
      </div>
      
      <Progress value={potential.dynamism} className="h-1.5" />
    </div>

    {/* Tactical Themes */}
    {potential.tacticalThemes.length > 0 && (
      <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
        <div className="flex items-center gap-2 mb-2">
          <Crosshair className="h-4 w-4 text-purple-500" />
          <span className="text-sm font-medium text-purple-600">Tactical Themes</span>
        </div>
        <div className="flex flex-wrap gap-1">
          {potential.tacticalThemes.map((theme, i) => (
            <TacticalThemeBadge key={i} theme={theme} />
          ))}
        </div>
      </div>
    )}

    {/* Vulnerabilities */}
    {potential.vulnerabilities.length > 0 && (
      <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle className="h-4 w-4 text-red-500" />
          <span className="text-sm font-medium text-red-600">Vulnerabilities</span>
        </div>
        <div className="space-y-1">
          {potential.vulnerabilities.map((v, i) => (
            <VulnerabilityItem key={i} vulnerability={v} />
          ))}
        </div>
      </div>
    )}

    {/* Critical Squares */}
    <div className="p-3 rounded-lg border border-border/50 bg-card/50">
      <div className="flex items-center gap-2 mb-2">
        <Target className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium">Critical Squares</span>
      </div>
      <div className="flex flex-wrap gap-1">
        {potential.criticalSquares.map((sq, i) => (
          <Badge key={i} variant="outline" className="font-mono text-xs">
            {sq}
          </Badge>
        ))}
      </div>
    </div>

    {/* Principal Variation */}
    <div className="p-3 rounded-lg border border-primary/30 bg-primary/5">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-primary">Best Line</span>
        </div>
        <Badge className={`${
          potential.principalVariation.winProbability > 60 ? 'bg-green-500/20 text-green-600' :
          potential.principalVariation.winProbability < 40 ? 'bg-red-500/20 text-red-600' :
          'bg-muted text-muted-foreground'
        }`}>
          {potential.principalVariation.winProbability.toFixed(0)}% win
        </Badge>
      </div>
      
      <div className="flex flex-wrap gap-1 text-xs font-mono">
        {potential.principalVariation.moves.slice(0, 10).map((move, i) => (
          <span key={i} className="px-1.5 py-0.5 rounded bg-background/50">
            {i % 2 === 0 ? `${Math.floor(i/2) + 1}. ` : ''}{move}
          </span>
        ))}
        {potential.principalVariation.moves.length > 10 && (
          <span className="text-muted-foreground">
            ...+{potential.principalVariation.moves.length - 10} more
          </span>
        )}
      </div>
      
      {potential.principalVariation.isMate && (
        <Badge className="mt-2 bg-red-500/20 text-red-600">
          <Crown className="h-3 w-3 mr-1" />
          Mate in {potential.principalVariation.mateIn}
        </Badge>
      )}
    </div>

    {/* Future Positions Toggle */}
    {potential.futurePositions.length > 0 && (
      <Button
        variant="outline"
        size="sm"
        onClick={onToggleFuture}
        className="w-full"
      >
        <Eye className="h-3 w-3 mr-2" />
        {showFuturePositions ? 'Hide' : 'Show'} Future Positions ({potential.futurePositions.length})
      </Button>
    )}

    {/* Future Positions */}
    <AnimatePresence>
      {showFuturePositions && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
        >
          <ScrollArea className="h-48">
            <div className="space-y-2 pr-4">
              {potential.futurePositions.map((pos, i) => (
                <div 
                  key={i}
                  className="p-2 rounded border border-border/30 bg-card/30"
                >
                  <div className="flex items-center justify-between mb-1">
                    <Badge variant="outline" className="text-[10px]">
                      Move {pos.moveNumber}
                    </Badge>
                    <span className={`text-xs font-mono ${
                      pos.evaluation > 0 ? 'text-green-500' :
                      pos.evaluation < 0 ? 'text-red-500' : ''
                    }`}>
                      {pos.evaluation > 0 ? '+' : ''}{(pos.evaluation / 100).toFixed(1)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">{pos.description}</p>
                  <div className="flex items-center gap-2 mt-1 text-[10px]">
                    <span>Territory: {pos.visualPattern.controlledTerritory}</span>
                    <span>•</span>
                    <span className="capitalize">{pos.visualPattern.dominantColor}</span>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

const TacticalThemeBadge: React.FC<{ theme: TacticalTheme }> = ({ theme }) => {
  const icons: Record<string, string> = {
    fork: '⑂',
    pin: '📌',
    skewer: '🗡️',
    discovered_attack: '💡',
    double_attack: '⚔️',
    back_rank: '♛',
    sacrifice: '💎',
    promotion: '👑',
    mating_pattern: '♚#',
    zugzwang: '🔒',
    tactical: '⚡',
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <Badge 
            variant="secondary" 
            className="text-xs cursor-help"
            style={{ opacity: theme.likelihood / 100 }}
          >
            {icons[theme.type] || '?'} {theme.type.replace('_', ' ')}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p className="max-w-xs text-xs">{theme.description}</p>
          <p className="text-muted-foreground text-[10px]">
            {theme.likelihood}% likelihood
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

const VulnerabilityItem: React.FC<{ vulnerability: Vulnerability }> = ({ vulnerability }) => {
  const severityColors = {
    low: 'text-yellow-500',
    medium: 'text-orange-500',
    high: 'text-red-500',
    critical: 'text-red-600 font-bold',
  };

  return (
    <div className="flex items-start gap-2 text-xs">
      <Shield className={`h-3 w-3 mt-0.5 ${severityColors[vulnerability.severity]}`} />
      <div>
        <span className={severityColors[vulnerability.severity]}>
          {vulnerability.side === 'white' ? '♔' : '♚'} {vulnerability.type.replace('_', ' ')}
        </span>
        <p className="text-muted-foreground">{vulnerability.description}</p>
      </div>
    </div>
  );
};

export default PredictiveAnalysisPanel;
