/**
 * Hybrid Prediction Panel
 * 
 * En Pensent™ Patent-Pending Technology
 * 
 * Side-by-side display of:
 * - Stockfish tactical analysis
 * - Color Flow strategic trajectories
 * - Pattern matching predictions (80-move lookahead)
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Brain,
  Cpu,
  Palette,
  TrendingUp,
  Zap,
  Target,
  Loader2,
  Sparkles,
  AlertTriangle,
  ChevronRight,
  Layers,
  Compass,
  Activity,
  Eye,
  Clock,
  CheckCircle2,
  XCircle,
  Minus,
} from 'lucide-react';
import { useHybridPrediction } from '@/hooks/useHybridPrediction';
import { HybridPrediction, TrajectoryMilestone } from '@/lib/chess/hybridPrediction';
import { PatternPrediction, PatternMatch } from '@/lib/chess/patternLearning';
import { ColorFlowSignature, StrategicArchetype, ARCHETYPE_DEFINITIONS } from '@/lib/chess/colorFlowAnalysis';

interface HybridPredictionPanelProps {
  pgn: string;
  compact?: boolean;
}

export const HybridPredictionPanel: React.FC<HybridPredictionPanelProps> = ({
  pgn,
  compact = false,
}) => {
  const { 
    isAnalyzing, 
    progress, 
    error, 
    result, 
    analyzeGame, 
    clearResults 
  } = useHybridPrediction();

  const [activeTab, setActiveTab] = useState<'fusion' | 'tactical' | 'strategic' | 'patterns'>('fusion');

  const handleAnalyze = () => {
    clearResults();
    analyzeGame(pgn, { depth: 20 });
  };

  if (compact) {
    return <CompactView 
      pgn={pgn}
      isAnalyzing={isAnalyzing}
      result={result}
      onAnalyze={handleAnalyze}
    />;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Brain className="h-6 w-6 text-primary" />
            <Sparkles className="h-3 w-3 text-amber-500 absolute -top-1 -right-1" />
          </div>
          <div>
            <h3 className="font-display text-sm uppercase tracking-wider">
              Hybrid Prediction Engine
            </h3>
            <p className="text-xs text-muted-foreground">
              Stockfish + Color Flow Fusion
            </p>
          </div>
        </div>
        
        <Button
          onClick={handleAnalyze}
          disabled={isAnalyzing || !pgn}
          className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Analyzing...
            </>
          ) : (
            <>
              <Zap className="h-4 w-4 mr-2" />
              Generate Prediction
            </>
          )}
        </Button>
      </div>

      {/* Progress */}
      <AnimatePresence>
        {isAnalyzing && progress && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="p-4 rounded-lg bg-gradient-to-br from-primary/10 to-purple-500/10 border border-primary/30"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span className="text-sm font-medium">{progress.stage}</span>
              </div>
              <span className="text-sm font-mono text-primary">{progress.percent.toFixed(0)}%</span>
            </div>
            <Progress value={progress.percent} className="h-2" />
            {progress.details && (
              <p className="text-xs text-muted-foreground mt-2">{progress.details}</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error */}
      {error && (
        <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/30 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          <span className="text-sm text-destructive">{error}</span>
        </div>
      )}

      {/* Results */}
      {result.hybridPrediction && (
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
          <TabsList className="grid w-full grid-cols-4 mb-4">
            <TabsTrigger value="fusion" className="flex items-center gap-1">
              <Layers className="h-3 w-3" />
              <span className="hidden sm:inline">Fusion</span>
            </TabsTrigger>
            <TabsTrigger value="tactical" className="flex items-center gap-1">
              <Cpu className="h-3 w-3" />
              <span className="hidden sm:inline">Tactical</span>
            </TabsTrigger>
            <TabsTrigger value="strategic" className="flex items-center gap-1">
              <Palette className="h-3 w-3" />
              <span className="hidden sm:inline">Strategic</span>
            </TabsTrigger>
            <TabsTrigger value="patterns" className="flex items-center gap-1">
              <Compass className="h-3 w-3" />
              <span className="hidden sm:inline">80-Move</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="fusion">
            <FusionView 
              prediction={result.hybridPrediction} 
              colorSignature={result.colorFlowSignature}
            />
          </TabsContent>

          <TabsContent value="tactical">
            <TacticalView prediction={result.hybridPrediction} />
          </TabsContent>

          <TabsContent value="strategic">
            <StrategicView 
              prediction={result.hybridPrediction}
              colorSignature={result.colorFlowSignature}
            />
          </TabsContent>

          <TabsContent value="patterns">
            <PatternView patternPrediction={result.patternPrediction} />
          </TabsContent>
        </Tabs>
      )}

      {/* Empty State */}
      {!isAnalyzing && !result.hybridPrediction && !error && (
        <div className="p-8 rounded-lg border border-dashed border-border/50 text-center bg-card/30">
          <div className="relative inline-block mb-4">
            <Brain className="h-12 w-12 text-muted-foreground/30" />
            <div className="absolute -right-2 -top-2 flex">
              <Cpu className="h-5 w-5 text-blue-500/50" />
              <Palette className="h-5 w-5 text-purple-500/50 -ml-1" />
            </div>
          </div>
          <h4 className="font-medium mb-2">Hybrid Prediction Engine</h4>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Combines Stockfish's 30-move tactical depth with Color Flow's 
            80-move strategic trajectory prediction for unprecedented game insight.
          </p>
        </div>
      )}
    </div>
  );
};

// ==================== SUB-COMPONENTS ====================

const CompactView: React.FC<{
  pgn: string;
  isAnalyzing: boolean;
  result: ReturnType<typeof useHybridPrediction>['result'];
  onAnalyze: () => void;
}> = ({ pgn, isAnalyzing, result, onAnalyze }) => (
  <div className="p-3 rounded-lg border border-border/50 bg-card/50 space-y-2">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Brain className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium">Hybrid Engine</span>
        <Badge variant="outline" className="text-[10px]">
          Stockfish + Color Flow
        </Badge>
      </div>
      <Button
        size="sm"
        variant="outline"
        onClick={onAnalyze}
        disabled={isAnalyzing || !pgn}
        className="h-7 text-xs"
      >
        {isAnalyzing ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Analyze'}
      </Button>
    </div>
    
    {result.hybridPrediction && (
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="p-2 rounded bg-blue-500/10 border border-blue-500/20">
          <span className="text-muted-foreground">Tactical:</span>
          <span className="ml-1 font-mono font-bold text-blue-500">
            {result.hybridPrediction.fusedRecommendation.move}
          </span>
        </div>
        <div className="p-2 rounded bg-purple-500/10 border border-purple-500/20">
          <span className="text-muted-foreground">Strategic:</span>
          <span className="ml-1 font-medium text-purple-500 capitalize">
            {result.hybridPrediction.strategicAnalysis.archetype.replace('_', ' ')}
          </span>
        </div>
      </div>
    )}
  </div>
);

const FusionView: React.FC<{
  prediction: HybridPrediction;
  colorSignature: ColorFlowSignature | null;
}> = ({ prediction, colorSignature }) => (
  <div className="space-y-4">
    {/* Combined Score */}
    <div className="p-4 rounded-lg bg-gradient-to-br from-primary/10 via-purple-500/10 to-amber-500/10 border border-primary/30">
      <div className="flex items-center justify-between mb-3">
        <Badge className="bg-gradient-to-r from-primary to-purple-600 text-white">
          <Layers className="h-3 w-3 mr-1" />
          Fused Recommendation
        </Badge>
        <div className="text-right">
          <div className="text-2xl font-bold text-primary">
            {prediction.fusedRecommendation.moveConfidence.toFixed(0)}%
          </div>
          <div className="text-xs text-muted-foreground">Confidence</div>
        </div>
      </div>

      <div className="text-3xl font-display font-bold text-primary mb-3">
        {prediction.fusedRecommendation.move}
      </div>

      <div className="space-y-2 mb-4">
        {prediction.fusedRecommendation.reasoning.map((reason, i) => (
          <div key={i} className="flex items-start gap-2 text-sm">
            <ChevronRight className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <span>{reason}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border/30">
        <div className="p-2 rounded bg-background/50">
          <div className="text-xs text-muted-foreground mb-1">Trajectory Alignment</div>
          <p className="text-sm">{prediction.fusedRecommendation.trajectoryAlignment}</p>
        </div>
        <div className="p-2 rounded bg-background/50">
          <div className="text-xs text-muted-foreground mb-1">Trade-off</div>
          <p className="text-sm">{prediction.fusedRecommendation.tradeoffAnalysis}</p>
        </div>
      </div>
    </div>

    {/* Confidence Breakdown */}
    <div className="grid grid-cols-4 gap-2">
      <ConfidenceMetric 
        label="Overall" 
        value={prediction.confidence.overall} 
        icon={<Brain className="h-3 w-3" />}
      />
      <ConfidenceMetric 
        label="Tactical" 
        value={prediction.confidence.tactical} 
        icon={<Cpu className="h-3 w-3" />}
        color="blue"
      />
      <ConfidenceMetric 
        label="Strategic" 
        value={prediction.confidence.strategic} 
        icon={<Palette className="h-3 w-3" />}
        color="purple"
      />
      <ConfidenceMetric 
        label="Alignment" 
        value={prediction.confidence.alignment} 
        icon={<Activity className="h-3 w-3" />}
        color="amber"
      />
    </div>

    {/* Trajectory Prediction */}
    <TrajectorySection trajectory={prediction.trajectoryPrediction} />
  </div>
);

const TacticalView: React.FC<{ prediction: HybridPrediction }> = ({ prediction }) => (
  <div className="space-y-4">
    {/* Stockfish Analysis Header */}
    <div className="flex items-center gap-2 mb-2">
      <Cpu className="h-5 w-5 text-blue-500" />
      <h4 className="font-medium">Stockfish 17 Analysis</h4>
      <Badge variant="outline" className="text-[10px]">~3200 ELO</Badge>
    </div>

    {/* Best Move */}
    <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
      <div className="flex items-center justify-between mb-2">
        <Badge className="bg-blue-500/20 text-blue-600">
          <Target className="h-3 w-3 mr-1" />
          Best Move
        </Badge>
        <div className="font-mono text-lg font-bold text-blue-500">
          {prediction.tacticalAnalysis.evaluation > 0 ? '+' : ''}
          {(prediction.tacticalAnalysis.evaluation / 100).toFixed(2)}
        </div>
      </div>

      <div className="text-3xl font-display font-bold text-blue-500 mb-3">
        {prediction.tacticalAnalysis.bestMove}
      </div>

      {prediction.tacticalAnalysis.mateIn && (
        <Badge className="bg-red-500/20 text-red-600 mb-3">
          Mate in {prediction.tacticalAnalysis.mateIn}
        </Badge>
      )}

      {/* Principal Variation */}
      <div className="p-3 rounded bg-background/50 mb-3">
        <div className="text-xs text-muted-foreground mb-2">Principal Variation:</div>
        <div className="flex flex-wrap gap-1 font-mono text-sm">
          {prediction.tacticalAnalysis.principalVariation.slice(0, 8).map((move, i) => (
            <span key={i} className="px-1.5 py-0.5 rounded bg-blue-500/10">
              {move}
            </span>
          ))}
          {prediction.tacticalAnalysis.principalVariation.length > 8 && (
            <span className="text-muted-foreground">
              +{prediction.tacticalAnalysis.principalVariation.length - 8}
            </span>
          )}
        </div>
      </div>
    </div>

    {/* Tactical Themes */}
    {prediction.tacticalAnalysis.tacticalThemes.length > 0 && (
      <div className="p-3 rounded-lg border border-border/50">
        <div className="text-xs text-muted-foreground mb-2">Detected Themes:</div>
        <div className="flex flex-wrap gap-1">
          {prediction.tacticalAnalysis.tacticalThemes.map((theme, i) => (
            <Badge key={i} variant="secondary" className="text-xs capitalize">
              {theme.replace('_', ' ')}
            </Badge>
          ))}
        </div>
      </div>
    )}

    {/* Immediate Threats */}
    {prediction.tacticalAnalysis.immediateThreats.length > 0 && (
      <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          <span className="text-sm font-medium text-amber-600">Immediate Threats</span>
        </div>
        <ul className="space-y-1">
          {prediction.tacticalAnalysis.immediateThreats.map((threat, i) => (
            <li key={i} className="text-sm flex items-start gap-2">
              <ChevronRight className="h-4 w-4 text-amber-500 shrink-0" />
              {threat}
            </li>
          ))}
        </ul>
      </div>
    )}
  </div>
);

const StrategicView: React.FC<{
  prediction: HybridPrediction;
  colorSignature: ColorFlowSignature | null;
}> = ({ prediction, colorSignature }) => {
  const archetype = prediction.strategicAnalysis.archetype as StrategicArchetype;
  const archetypeDef = ARCHETYPE_DEFINITIONS[archetype];

  return (
    <div className="space-y-4">
      {/* Color Flow Header */}
      <div className="flex items-center gap-2 mb-2">
        <Palette className="h-5 w-5 text-purple-500" />
        <h4 className="font-medium">Color Flow Analysis</h4>
        <Badge variant="outline" className="text-[10px]">
          {colorSignature?.intensity || 0}% Intensity
        </Badge>
      </div>

      {/* Strategic Archetype */}
      <div className="p-4 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/30">
        <div className="flex items-center justify-between mb-3">
          <Badge className="bg-purple-500/20 text-purple-600">
            <Compass className="h-3 w-3 mr-1" />
            Strategic Archetype
          </Badge>
          <Badge variant="outline" className="text-xs">
            {archetypeDef?.lookaheadConfidence || 40}+ moves ahead
          </Badge>
        </div>

        <h3 className="text-xl font-display font-bold text-purple-500 mb-2 capitalize">
          {prediction.strategicAnalysis.archetypeName}
        </h3>

        <p className="text-sm text-muted-foreground mb-4">
          {archetypeDef?.description || 'Game pattern detected from color flow analysis.'}
        </p>

        <div className="grid grid-cols-2 gap-3">
          <div className="p-2 rounded bg-background/50">
            <div className="text-xs text-muted-foreground">Flow Direction</div>
            <div className="font-medium capitalize">
              {prediction.strategicAnalysis.flowDirection}
            </div>
          </div>
          <div className="p-2 rounded bg-background/50">
            <div className="text-xs text-muted-foreground">Dominant Side</div>
            <div className="font-medium capitalize">
              {prediction.strategicAnalysis.dominantSide}
            </div>
          </div>
        </div>
      </div>

      {/* Quadrant Profile */}
      {colorSignature && (
        <div className="p-3 rounded-lg border border-border/50">
          <div className="text-xs text-muted-foreground mb-3">Territory Control by Quadrant:</div>
          <div className="grid grid-cols-2 gap-2">
            <QuadrantBar label="Kingside ♔" value={colorSignature.quadrantProfile.kingsideWhite} />
            <QuadrantBar label="Kingside ♚" value={colorSignature.quadrantProfile.kingsideBlack} />
            <QuadrantBar label="Queenside ♔" value={colorSignature.quadrantProfile.queensideWhite} />
            <QuadrantBar label="Queenside ♚" value={colorSignature.quadrantProfile.queensideBlack} />
          </div>
          <div className="mt-2 pt-2 border-t border-border/30">
            <QuadrantBar label="Center Control" value={colorSignature.quadrantProfile.center} />
          </div>
        </div>
      )}

      {/* Strategic Guidance */}
      <div className="p-3 rounded-lg bg-purple-500/5 border border-purple-500/20">
        <div className="text-xs text-muted-foreground mb-2">Strategic Guidance:</div>
        <ul className="space-y-2">
          {prediction.strategicAnalysis.strategicGuidance.map((guide, i) => (
            <li key={i} className="flex items-start gap-2 text-sm">
              <Sparkles className="h-4 w-4 text-purple-500 shrink-0 mt-0.5" />
              {guide}
            </li>
          ))}
        </ul>
      </div>

      {/* Critical Squares */}
      <div className="p-3 rounded-lg border border-border/50">
        <div className="text-xs text-muted-foreground mb-2">Critical Squares:</div>
        <div className="flex flex-wrap gap-1">
          {prediction.strategicAnalysis.criticalSquares.map((sq, i) => (
            <Badge key={i} variant="outline" className="font-mono text-xs">
              {sq}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
};

const PatternView: React.FC<{ patternPrediction: PatternPrediction | null }> = ({ patternPrediction }) => {
  if (!patternPrediction) {
    return (
      <div className="p-6 rounded-lg border border-dashed border-border/50 text-center">
        <Compass className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
        <p className="text-sm text-muted-foreground">
          Pattern prediction not available
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 80-Move Lookahead Header */}
      <div className="flex items-center gap-2 mb-2">
        <Clock className="h-5 w-5 text-amber-500" />
        <h4 className="font-medium">Pattern-Based Trajectory</h4>
        <Badge className="bg-amber-500/20 text-amber-600">
          {patternPrediction.lookaheadMoves}+ Moves Ahead
        </Badge>
      </div>

      {/* Aggregate Prediction */}
      <div className="p-4 rounded-lg bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/30">
        <div className="flex items-center justify-between mb-4">
          <Badge className="bg-amber-500/20 text-amber-600">
            <Eye className="h-3 w-3 mr-1" />
            Predicted Outcome
          </Badge>
          <span className="text-sm font-mono">{patternPrediction.confidence}% confidence</span>
        </div>

        <div className="flex items-center justify-center gap-4 mb-4">
          <OutcomeIndicator 
            label="White Wins" 
            probability={patternPrediction.aggregatePrediction.whiteWinProbability}
            isActive={patternPrediction.mostLikelyOutcome === 'white_wins'}
            icon={<CheckCircle2 className="h-4 w-4" />}
          />
          <OutcomeIndicator 
            label="Draw" 
            probability={patternPrediction.aggregatePrediction.drawProbability}
            isActive={patternPrediction.mostLikelyOutcome === 'draw'}
            icon={<Minus className="h-4 w-4" />}
          />
          <OutcomeIndicator 
            label="Black Wins" 
            probability={patternPrediction.aggregatePrediction.blackWinProbability}
            isActive={patternPrediction.mostLikelyOutcome === 'black_wins'}
            icon={<XCircle className="h-4 w-4" />}
          />
        </div>

        {/* Probability Bars */}
        <div className="space-y-2">
          <ProbabilityBar 
            label="♔ White" 
            value={patternPrediction.aggregatePrediction.whiteWinProbability} 
            color="text-white bg-slate-200"
          />
          <ProbabilityBar 
            label="½ Draw" 
            value={patternPrediction.aggregatePrediction.drawProbability} 
            color="text-gray-600 bg-gray-400"
          />
          <ProbabilityBar 
            label="♚ Black" 
            value={patternPrediction.aggregatePrediction.blackWinProbability} 
            color="text-black bg-slate-800"
          />
        </div>
      </div>

      {/* Pattern Insights */}
      {patternPrediction.insights.length > 0 && (
        <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
          <div className="text-xs text-muted-foreground mb-2">Pattern Insights:</div>
          <ul className="space-y-2">
            {patternPrediction.insights.map((insight, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <TrendingUp className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                {insight}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Top Pattern Matches */}
      {patternPrediction.topMatches.length > 0 && (
        <div className="p-3 rounded-lg border border-border/50">
          <div className="text-xs text-muted-foreground mb-2">
            Similar Historical Patterns ({patternPrediction.topMatches.length}):
          </div>
          <ScrollArea className="h-40">
            <div className="space-y-2 pr-4">
              {patternPrediction.topMatches.slice(0, 5).map((match, i) => (
                <PatternMatchCard key={i} match={match} rank={i + 1} />
              ))}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
};

// ==================== UTILITY COMPONENTS ====================

const ConfidenceMetric: React.FC<{
  label: string;
  value: number;
  icon: React.ReactNode;
  color?: 'blue' | 'purple' | 'amber' | 'primary';
}> = ({ label, value, icon, color = 'primary' }) => {
  const colorClasses = {
    primary: 'text-primary border-primary/30 bg-primary/5',
    blue: 'text-blue-500 border-blue-500/30 bg-blue-500/5',
    purple: 'text-purple-500 border-purple-500/30 bg-purple-500/5',
    amber: 'text-amber-500 border-amber-500/30 bg-amber-500/5',
  };

  return (
    <div className={`p-2 rounded-lg border ${colorClasses[color]} text-center`}>
      <div className="flex items-center justify-center gap-1 mb-1">
        {icon}
        <span className="text-[10px] uppercase tracking-wide">{label}</span>
      </div>
      <div className="text-lg font-bold">{value.toFixed(0)}%</div>
    </div>
  );
};

const TrajectorySection: React.FC<{ 
  trajectory: HybridPrediction['trajectoryPrediction'] 
}> = ({ trajectory }) => (
  <div className="p-4 rounded-lg border border-border/50 bg-card/50">
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        <TrendingUp className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium">Game Trajectory</span>
      </div>
      <Badge variant="outline" className="text-xs">
        {trajectory.horizonMoves} moves ahead
      </Badge>
    </div>

    {/* Outcome Probabilities */}
    <div className="grid grid-cols-3 gap-2 mb-4">
      <div className="p-2 rounded bg-green-500/10 text-center">
        <div className="text-xs text-muted-foreground">♔ White</div>
        <div className="font-bold text-green-600">
          {(trajectory.outcomeProbabilities.whiteWin * 100).toFixed(0)}%
        </div>
      </div>
      <div className="p-2 rounded bg-gray-500/10 text-center">
        <div className="text-xs text-muted-foreground">Draw</div>
        <div className="font-bold text-gray-600">
          {(trajectory.outcomeProbabilities.draw * 100).toFixed(0)}%
        </div>
      </div>
      <div className="p-2 rounded bg-slate-500/10 text-center">
        <div className="text-xs text-muted-foreground">♚ Black</div>
        <div className="font-bold text-slate-600">
          {(trajectory.outcomeProbabilities.blackWin * 100).toFixed(0)}%
        </div>
      </div>
    </div>

    {/* Expected Milestones */}
    {trajectory.expectedMilestones.length > 0 && (
      <div className="space-y-2">
        <div className="text-xs text-muted-foreground">Expected Milestones:</div>
        {trajectory.expectedMilestones.slice(0, 3).map((milestone, i) => (
          <MilestoneItem key={i} milestone={milestone} />
        ))}
      </div>
    )}

    {/* Trajectory Breakers */}
    {trajectory.trajectoryBreakers.length > 0 && (
      <div className="mt-3 pt-3 border-t border-border/30">
        <div className="text-xs text-muted-foreground mb-2">What could change this:</div>
        <div className="flex flex-wrap gap-1">
          {trajectory.trajectoryBreakers.map((breaker, i) => (
            <Badge key={i} variant="secondary" className="text-xs">
              {breaker}
            </Badge>
          ))}
        </div>
      </div>
    )}
  </div>
);

const MilestoneItem: React.FC<{ milestone: TrajectoryMilestone }> = ({ milestone }) => (
  <div className="flex items-start gap-2 p-2 rounded bg-background/50 text-sm">
    <Badge variant="outline" className="text-[10px] shrink-0">
      ~Move {milestone.approximateMoveNumber}
    </Badge>
    <div>
      <p>{milestone.description}</p>
      <p className="text-xs text-muted-foreground mt-1">
        {milestone.expectedColorFlow}
      </p>
    </div>
  </div>
);

const QuadrantBar: React.FC<{ label: string; value: number }> = ({ label, value }) => (
  <div>
    <div className="flex items-center justify-between text-xs mb-1">
      <span>{label}</span>
      <span className="font-mono">{value.toFixed(0)}</span>
    </div>
    <div className="h-1.5 rounded-full bg-border overflow-hidden">
      <div 
        className={`h-full rounded-full transition-all ${
          value > 0 ? 'bg-purple-500' : 'bg-pink-500'
        }`}
        style={{ width: `${Math.abs(value)}%` }}
      />
    </div>
  </div>
);

const OutcomeIndicator: React.FC<{
  label: string;
  probability: number;
  isActive: boolean;
  icon: React.ReactNode;
}> = ({ label, probability, isActive, icon }) => (
  <div className={`text-center p-2 rounded-lg transition-all ${
    isActive 
      ? 'bg-amber-500/20 border border-amber-500/50 scale-105' 
      : 'bg-background/50 opacity-60'
  }`}>
    <div className={`mb-1 ${isActive ? 'text-amber-500' : 'text-muted-foreground'}`}>
      {icon}
    </div>
    <div className="text-xs text-muted-foreground">{label}</div>
    <div className={`font-bold ${isActive ? 'text-amber-500' : ''}`}>
      {probability.toFixed(0)}%
    </div>
  </div>
);

const ProbabilityBar: React.FC<{
  label: string;
  value: number;
  color: string;
}> = ({ label, value, color }) => (
  <div className="flex items-center gap-2">
    <span className="text-xs w-16 shrink-0">{label}</span>
    <div className="flex-1 h-3 rounded-full bg-border overflow-hidden">
      <div 
        className={`h-full rounded-full ${color}`}
        style={{ width: `${value}%` }}
      />
    </div>
    <span className="text-xs font-mono w-10 text-right">{value.toFixed(0)}%</span>
  </div>
);

const PatternMatchCard: React.FC<{ match: PatternMatch; rank: number }> = ({ match, rank }) => (
  <div className="p-2 rounded border border-border/30 bg-card/30">
    <div className="flex items-center justify-between mb-1">
      <Badge variant="outline" className="text-[10px]">
        #{rank} • {match.similarity.toFixed(0)}% similar
      </Badge>
      <Badge className={`text-[10px] ${
        match.predictedOutcome === 'white_wins' ? 'bg-green-500/20 text-green-600' :
        match.predictedOutcome === 'black_wins' ? 'bg-red-500/20 text-red-600' :
        'bg-gray-500/20 text-gray-600'
      }`}>
        {match.predictedOutcome.replace('_', ' ')}
      </Badge>
    </div>
    <div className="flex flex-wrap gap-1">
      {match.matchingFactors.slice(0, 3).map((factor, i) => (
        <span key={i} className="text-[10px] text-muted-foreground">
          {factor}{i < Math.min(match.matchingFactors.length, 3) - 1 && ' • '}
        </span>
      ))}
    </div>
  </div>
);

export default HybridPredictionPanel;
