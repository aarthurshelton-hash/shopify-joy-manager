/**
 * En Pensent™ Prediction History
 * 
 * Shows all predictions with their outcomes and accuracy.
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Clock, 
  CheckCircle2, 
  XCircle,
  AlertCircle
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { MARKET_ARCHETYPES } from '@/lib/pensent-core/domains/finance/types';

interface Prediction {
  id: string;
  symbol: string;
  archetype: string;
  predicted_direction: string;
  predicted_confidence: number;
  predicted_target_move: number;
  price_at_prediction: number;
  time_horizon: string;
  created_at: string;
  expires_at: string;
  resolved_at: string | null;
  outcome_price: number | null;
  actual_direction: string | null;
  actual_move: number | null;
  was_correct: boolean | null;
  accuracy_score: number | null;
  baseline_direction: string | null;
  baseline_was_correct: boolean | null;
}

interface PredictionHistoryProps {
  predictions: Prediction[];
  onRefresh?: () => void;
}

export const PredictionHistory: React.FC<PredictionHistoryProps> = ({
  predictions,
  onRefresh
}) => {
  const DirectionIcon = ({ direction }: { direction: string }) => {
    if (direction === 'bullish') return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (direction === 'bearish') return <TrendingDown className="w-4 h-4 text-red-500" />;
    return <Minus className="w-4 h-4 text-muted-foreground" />;
  };

  const getStatusIcon = (prediction: Prediction) => {
    if (!prediction.resolved_at) {
      return <Clock className="w-4 h-4 text-yellow-500" />;
    }
    if (prediction.was_correct) {
      return <CheckCircle2 className="w-4 h-4 text-green-500" />;
    }
    return <XCircle className="w-4 h-4 text-red-500" />;
  };

  const getStatusText = (prediction: Prediction) => {
    if (!prediction.resolved_at) {
      return 'Pending';
    }
    return prediction.was_correct ? 'Correct' : 'Incorrect';
  };

  const getStatusColor = (prediction: Prediction) => {
    if (!prediction.resolved_at) {
      return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    }
    return prediction.was_correct 
      ? 'bg-green-500/20 text-green-400 border-green-500/30'
      : 'bg-red-500/20 text-red-400 border-red-500/30';
  };

  const pendingCount = predictions.filter(p => !p.resolved_at).length;
  const resolvedCount = predictions.filter(p => p.resolved_at).length;
  const correctCount = predictions.filter(p => p.was_correct).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            Prediction History
          </span>
          <div className="flex items-center gap-2 text-sm font-normal">
            <Badge variant="outline" className="bg-yellow-500/10 text-yellow-400">
              {pendingCount} pending
            </Badge>
            <Badge variant="outline" className="bg-green-500/10 text-green-400">
              {correctCount}/{resolvedCount} correct
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px] pr-4">
          <div className="space-y-3">
            {predictions.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No predictions yet. Analyze a stock and save your prediction!
              </p>
            ) : (
              predictions.map(pred => {
                const archetypeDef = MARKET_ARCHETYPES[pred.archetype as keyof typeof MARKET_ARCHETYPES];
                
                return (
                  <div 
                    key={pred.id}
                    className="p-4 rounded-lg bg-muted/30 border border-border/50 hover:border-border transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-lg">{pred.symbol}</span>
                        <Badge variant="outline" className={getStatusColor(pred)}>
                          {getStatusIcon(pred)}
                          <span className="ml-1">{getStatusText(pred)}</span>
                        </Badge>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(pred.created_at), { addSuffix: true })}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div>
                        <p className="text-muted-foreground">Predicted</p>
                        <div className="flex items-center gap-1">
                          <DirectionIcon direction={pred.predicted_direction} />
                          <span className="capitalize font-medium">{pred.predicted_direction}</span>
                          <span className="text-muted-foreground">({pred.predicted_confidence}%)</span>
                        </div>
                      </div>

                      <div>
                        <p className="text-muted-foreground">Target Move</p>
                        <p className="font-medium">±{pred.predicted_target_move}%</p>
                      </div>

                      {pred.resolved_at ? (
                        <>
                          <div>
                            <p className="text-muted-foreground">Actual</p>
                            <div className="flex items-center gap-1">
                              <DirectionIcon direction={pred.actual_direction || 'neutral'} />
                              <span className="capitalize font-medium">{pred.actual_direction}</span>
                              <span className="text-muted-foreground">({pred.actual_move}%)</span>
                            </div>
                          </div>

                          <div>
                            <p className="text-muted-foreground">Accuracy Score</p>
                            <p className={`font-bold ${pred.accuracy_score && pred.accuracy_score >= 50 ? 'text-green-400' : 'text-red-400'}`}>
                              {pred.accuracy_score}/100
                            </p>
                          </div>
                        </>
                      ) : (
                        <>
                          <div>
                            <p className="text-muted-foreground">Entry Price</p>
                            <p className="font-medium">${pred.price_at_prediction.toFixed(2)}</p>
                          </div>

                          <div>
                            <p className="text-muted-foreground">Expires</p>
                            <p className="font-medium">
                              {formatDistanceToNow(new Date(pred.expires_at), { addSuffix: true })}
                            </p>
                          </div>
                        </>
                      )}
                    </div>

                    <div className="mt-3 pt-3 border-t border-border/50 flex items-center justify-between text-xs">
                      <Badge variant="outline">
                        {archetypeDef?.name || pred.archetype}
                      </Badge>
                      
                      {pred.baseline_direction && (
                        <span className="text-muted-foreground">
                          Baseline: {pred.baseline_direction}
                          {pred.baseline_was_correct !== null && (
                            pred.baseline_was_correct 
                              ? <span className="text-green-400 ml-1">✓</span>
                              : <span className="text-red-400 ml-1">✗</span>
                          )}
                        </span>
                      )}

                      <span className="text-muted-foreground">
                        Horizon: {pred.time_horizon}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default PredictionHistory;
