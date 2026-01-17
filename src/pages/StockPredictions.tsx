/**
 * Stock Market Prediction Dashboard
 * En Pensent™ Finance Module - Proving Predictive Power
 * All accuracy data auto-updates in realtime
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, TrendingDown, Minus, RefreshCw, Target, BarChart3, Save, Layers, Trophy, History, Zap, Wifi } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  generateMultiTimeframePrediction,
  generateBaselinePrediction,
  MARKET_ARCHETYPES 
} from '@/lib/pensent-core/domains/finance';
import type { CandleStick } from '@/lib/pensent-core/domains/finance/types';
import { AccuracyLeaderboard } from '@/components/finance/AccuracyLeaderboard';
import { CrossDomainAnalysis } from '@/components/finance/CrossDomainAnalysis';
import { PredictionHistory } from '@/components/finance/PredictionHistory';
import MultiMarketScalpingTerminal from '@/components/scalping/MultiMarketScalpingTerminal';
import { useRealtimeAccuracy, subscribeToAccuracyUpdates } from '@/hooks/useRealtimeAccuracy';
import { ErrorBoundary } from '@/components/ErrorBoundary';

interface StockData {
  symbol: string;
  name: string;
  candles: CandleStick[];
  latestPrice: number;
  change: number;
  changePercent: number;
}

const StockPredictionDashboard: React.FC = () => {
  const [stocks, setStocks] = useState<StockData[]>([]);
  const [selectedStock, setSelectedStock] = useState<StockData | null>(null);
  const [prediction, setPrediction] = useState<ReturnType<typeof generateMultiTimeframePrediction> | null>(null);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState('analyze');
  const [predictions, setPredictions] = useState<any[]>([]);
  const [accuracyStats, setAccuracyStats] = useState<any>({ archetypePerformance: {} });
  
  // Realtime accuracy hook for auto-updates
  const { isConnected, updateCount, syncAccuracyData } = useRealtimeAccuracy(true);

  // Auto-refresh on realtime updates
  useEffect(() => {
    const unsubscribe = subscribeToAccuracyUpdates((update) => {
      if (update.type === 'prediction') {
        loadPredictions();
        loadAccuracyStats();
      }
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    loadStocks();
    loadPredictions();
    loadAccuracyStats();
  }, []);

  const loadPredictions = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('resolve-predictions', {
        body: { action: 'get_recent_predictions' }
      });
      if (!error && data?.predictions) {
        setPredictions(data.predictions);
      }
    } catch (err) {
      console.error('Failed to load predictions:', err);
    }
  };

  const loadAccuracyStats = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('resolve-predictions', {
        body: { action: 'get_accuracy_stats' }
      });
      if (!error && data) {
        setAccuracyStats(data);
      }
    } catch (err) {
      console.error('Failed to load accuracy stats:', err);
    }
  };

  const savePrediction = async () => {
    if (!prediction || !selectedStock) return;
    
    const baseline = generateBaselinePrediction(selectedStock.candles);
    
    try {
      const { error } = await supabase.functions.invoke('resolve-predictions', {
        body: { 
          action: 'save_prediction',
          prediction: prediction.longTerm,
          baseline
        }
      });
      
      if (error) throw error;
      toast.success('Prediction saved! It will be resolved after expiry.');
      loadPredictions();
    } catch (err) {
      toast.error('Failed to save prediction');
    }
  };

  const loadStocks = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('stock-data', {
        body: { action: 'batch', symbols: ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'NVDA', 'SPY'] }
      });
      
      if (error) throw error;
      setStocks(data.stocks || []);
    } catch (err) {
      console.error('Failed to load stocks:', err);
      toast.error('Failed to load stock data');
    } finally {
      setLoading(false);
    }
  };

  const analyzeStock = (stock: StockData) => {
    setSelectedStock(stock);
    setAnalyzing(true);
    
    // Small delay for UI feedback
    setTimeout(() => {
      const result = generateMultiTimeframePrediction(stock.symbol, stock.candles);
      setPrediction(result);
      setAnalyzing(false);
    }, 500);
  };

  const DirectionIcon = ({ direction }: { direction: string }) => {
    if (direction === 'bullish') return <TrendingUp className="w-5 h-5 text-green-500" />;
    if (direction === 'bearish') return <TrendingDown className="w-5 h-5 text-red-500" />;
    return <Minus className="w-5 h-5 text-muted-foreground" />;
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 70) return 'bg-green-500';
    if (confidence >= 55) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-2 mb-2">
          <h1 className="text-4xl font-bold">
            <span className="text-primary">En Pensent™</span> Market Predictions
          </h1>
          {isConnected && (
            <Badge variant="outline" className="text-xs border-green-500/30 text-green-400">
              <Wifi className="w-3 h-3 mr-1" />
              LIVE
            </Badge>
          )}
        </div>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Testing our temporal signature extraction on real market data. 
          Track predictions vs. outcomes to measure accuracy.
          <span className="text-primary ml-1">Updates: {updateCount}</span>
        </p>
      </div>

      {/* Main Navigation Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="grid grid-cols-5 w-full max-w-2xl mx-auto">
          <TabsTrigger value="scalping" className="flex items-center gap-1">
            <Zap className="w-4 h-4" /> Scalping
          </TabsTrigger>
          <TabsTrigger value="analyze" className="flex items-center gap-1">
            <Target className="w-4 h-4" /> Analyze
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-1">
            <History className="w-4 h-4" /> History
          </TabsTrigger>
          <TabsTrigger value="leaderboard" className="flex items-center gap-1">
            <Trophy className="w-4 h-4" /> Accuracy
          </TabsTrigger>
          <TabsTrigger value="correlation" className="flex items-center gap-1">
            <Layers className="w-4 h-4" /> Cross-Domain
          </TabsTrigger>
        </TabsList>

        <TabsContent value="scalping">
          <ErrorBoundary componentName="ScalpingTerminal">
            <MultiMarketScalpingTerminal />
          </ErrorBoundary>
        </TabsContent>

        <TabsContent value="analyze">
      {/* Stock Selection */}
      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Select a Stock to Analyze
          </CardTitle>
          <Button variant="outline" size="sm" onClick={loadStocks} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {stocks.map(stock => (
              <Button
                key={stock.symbol}
                variant={selectedStock?.symbol === stock.symbol ? 'default' : 'outline'}
                className="flex flex-col h-auto py-3"
                onClick={() => analyzeStock(stock)}
              >
                <span className="font-bold">{stock.symbol}</span>
                <span className="text-xs opacity-70">${stock.latestPrice.toFixed(2)}</span>
                <span className={`text-xs ${stock.changePercent >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {stock.changePercent >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
                </span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Prediction Results */}
      {selectedStock && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              {selectedStock.name} ({selectedStock.symbol}) Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analyzing ? (
              <div className="text-center py-8">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" />
                <p>Extracting temporal signature...</p>
              </div>
            ) : prediction ? (
              <>
                <Tabs defaultValue="consensus">
                  <TabsList className="grid grid-cols-4 w-full max-w-md mb-6">
                    <TabsTrigger value="consensus">Consensus</TabsTrigger>
                    <TabsTrigger value="short">1H</TabsTrigger>
                    <TabsTrigger value="medium">4H</TabsTrigger>
                    <TabsTrigger value="long">1D</TabsTrigger>
                  </TabsList>

                  <TabsContent value="consensus">
                    <div className="text-center py-6">
                      <div className="flex items-center justify-center gap-3 mb-4">
                        <DirectionIcon direction={prediction.consensus === 'mixed' ? 'neutral' : prediction.consensus} />
                        <span className="text-3xl font-bold capitalize">{prediction.consensus}</span>
                      </div>
                      <div className="mb-4">
                        <p className="text-sm text-muted-foreground mb-2">Overall Confidence</p>
                        <div className="flex items-center justify-center gap-3">
                          <Progress value={prediction.overallConfidence} className="w-48" />
                          <span className="font-bold">{prediction.overallConfidence}%</span>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-lg px-4 py-1">
                        Archetype: {MARKET_ARCHETYPES[prediction.longTerm.archetype]?.name || prediction.longTerm.archetype}
                      </Badge>
                    </div>
                  </TabsContent>

                  {['short', 'medium', 'long'].map((term) => {
                    const pred = term === 'short' ? prediction.shortTerm : 
                                 term === 'medium' ? prediction.mediumTerm : prediction.longTerm;
                    return (
                      <TabsContent key={term} value={term}>
                        <div className="grid md:grid-cols-2 gap-6">
                          <div>
                            <h4 className="font-semibold mb-3">Prediction</h4>
                            <div className="space-y-3">
                              <div className="flex justify-between">
                                <span>Direction:</span>
                                <span className="flex items-center gap-2">
                                  <DirectionIcon direction={pred.prediction.direction} />
                                  <span className="capitalize font-medium">{pred.prediction.direction}</span>
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>Confidence:</span>
                                <span className="font-medium">{pred.prediction.confidence}%</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Target Move:</span>
                                <span className="font-medium">±{pred.prediction.targetMove}%</span>
                              </div>
                            </div>
                          </div>
                          <div>
                            <h4 className="font-semibold mb-3">Signature</h4>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span>Archetype:</span>
                                <Badge variant="secondary">{pred.archetype}</Badge>
                              </div>
                              <div className="flex justify-between">
                                <span>Fingerprint:</span>
                                <code className="text-xs bg-muted px-2 py-1 rounded">
                                  {pred.signature.slice(0, 20)}...
                                </code>
                              </div>
                            </div>
                          </div>
                        </div>
                      </TabsContent>
                    );
                  })}
                </Tabs>

                <Button onClick={savePrediction} className="w-full mt-4">
                  <Save className="w-4 h-4 mr-2" />
                  Save Prediction for Tracking
                </Button>
              </>
            ) : null}
          </CardContent>
        </Card>
      )}
        </TabsContent>

        <TabsContent value="history">
          <PredictionHistory predictions={predictions} onRefresh={loadPredictions} />
        </TabsContent>

        <TabsContent value="leaderboard">
          <AccuracyLeaderboard 
            archetypePerformance={accuracyStats.archetypePerformance || {}}
            overview={accuracyStats.overview}
          />
        </TabsContent>

        <TabsContent value="correlation">
          <CrossDomainAnalysis demoMode={true} />
        </TabsContent>
      </Tabs>

      {/* Disclaimer */}
      <p className="text-center text-xs text-muted-foreground mt-8">
        ⚠️ This is experimental pattern recognition research, not financial advice.
        Predictions are for validating En Pensent™ accuracy only.
      </p>
    </div>
  );
};

export default StockPredictionDashboard;
