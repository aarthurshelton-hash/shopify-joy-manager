/**
 * Vision Benchmark Card
 * 
 * Shows linked benchmark predictions for the current Vision,
 * highlighting breakthrough cases where trajectory beat tactics.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { 
  Activity, 
  TrendingUp, 
  Target, 
  Sparkles,
  CheckCircle2,
  XCircle,
  ChevronRight,
} from 'lucide-react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BenchmarkPredictionLink } from './VisionExportState';

interface VisionBenchmarkCardProps {
  predictions: BenchmarkPredictionLink[];
  accuracy: { hybrid: number; stockfish: number } | null;
  hasBreakthroughCase: boolean;
  isLoading?: boolean;
  compact?: boolean;
}

export const VisionBenchmarkCard: React.FC<VisionBenchmarkCardProps> = ({
  predictions,
  accuracy,
  hasBreakthroughCase,
  isLoading = false,
  compact = false,
}) => {
  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardHeader className="pb-2">
          <div className="h-4 bg-muted rounded w-1/2" />
        </CardHeader>
        <CardContent>
          <div className="h-20 bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  if (predictions.length === 0) {
    return null;
  }

  // Filter breakthrough cases
  const breakthroughs = predictions.filter(p => p.hybridCorrect && !p.stockfishCorrect);

  if (compact) {
    return (
      <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
        <Activity className="w-4 h-4 text-primary" />
        <span className="text-xs">
          {predictions.length} predictions linked
          {hasBreakthroughCase && (
            <Badge variant="secondary" className="ml-2 text-[10px]">
              <Sparkles className="w-3 h-3 mr-1" />
              {breakthroughs.length} breakthroughs
            </Badge>
          )}
        </span>
      </div>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" />
          Benchmark Intelligence
        </CardTitle>
        <CardDescription className="text-xs">
          Linked predictions from En Pensent analysis
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Accuracy comparison */}
        {accuracy && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-primary" />
                En Pensent
              </span>
              <span className="font-mono">{accuracy.hybrid.toFixed(1)}%</span>
            </div>
            <Progress value={accuracy.hybrid} className="h-1.5" />
            
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Target className="w-3 h-3" />
                Stockfish
              </span>
              <span className="font-mono">{accuracy.stockfish.toFixed(1)}%</span>
            </div>
            <Progress value={accuracy.stockfish} className="h-1.5 opacity-50" />
          </div>
        )}

        {/* Breakthrough cases highlight */}
        {breakthroughs.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-3 rounded-lg bg-gradient-to-r from-primary/10 to-amber-500/10 border border-primary/20"
          >
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-xs font-semibold text-primary">
                {breakthroughs.length} Breakthrough Case{breakthroughs.length > 1 ? 's' : ''}
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground">
              Trajectory logic predicted correctly when tactical analysis failed
            </p>
          </motion.div>
        )}

        {/* Prediction list */}
        <ScrollArea className="h-32">
          <div className="space-y-1">
            {predictions.slice(0, 10).map((pred, idx) => (
              <div 
                key={idx}
                className={`flex items-center gap-2 p-1.5 rounded text-xs ${
                  pred.hybridCorrect && !pred.stockfishCorrect 
                    ? 'bg-primary/10 border border-primary/20' 
                    : 'bg-muted/30'
                }`}
              >
                {pred.hybridCorrect ? (
                  <CheckCircle2 className="w-3 h-3 text-green-500 shrink-0" />
                ) : (
                  <XCircle className="w-3 h-3 text-red-500 shrink-0" />
                )}
                <span className="truncate flex-1">Move {pred.moveNumber}</span>
                {pred.archetype && (
                  <Badge variant="outline" className="text-[10px]">
                    {pred.archetype}
                  </Badge>
                )}
                <ChevronRight className="w-3 h-3 text-muted-foreground" />
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default VisionBenchmarkCard;
