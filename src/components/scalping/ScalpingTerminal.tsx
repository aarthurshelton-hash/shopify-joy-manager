/**
 * Scalping Terminal
 * Full trading dashboard with real-time predictions and cross-market analysis
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Play, Pause, RotateCcw, Settings, Zap, Activity,
  TrendingUp, TrendingDown, Radio, Clock, Globe, Sparkles, DollarSign, Target
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { useScalpingPredictor } from '@/hooks/useScalpingPredictor';
import { useMultiMarketStream } from '@/hooks/useMultiMarketStream';
import { useSimulatedPositions } from '@/hooks/useSimulatedPositions';
import { useTradingSessionStore } from '@/stores/tradingSessionStore';
import { PredictionHUD } from './PredictionHUD';
import { LearningStatePanel } from './LearningStatePanel';
import { PredictionStream } from './PredictionStream';
import { TickChart } from './TickChart';
import { MarketTicker } from './MarketTicker';
import { BigPicturePanel } from './BigPicturePanel';
import { PositionTracker } from './PositionTracker';
import { GlobalAccuracyPanel } from './GlobalAccuracyPanel';
import { SessionControl } from './SessionControl';
import { HeartbeatIndicator } from '@/components/pensent-code/HeartbeatIndicator';
import { MarketLearningDashboard } from './MarketLearningDashboard';

const SYMBOLS = ['SPY', 'QQQ', 'AAPL', 'NVDA', 'TSLA', 'MSFT', 'AMD', 'GOOGL'];

export const ScalpingTerminal: React.FC = () => {
  const [symbol, setSymbol] = useState('SPY');
  const [autoPredict, setAutoPredict] = useState(true);
  const [predictionInterval, setPredictionInterval] = useState(3000);
  const [showSettings, setShowSettings] = useState(false);
  const [activeView, setActiveView] = useState<'focus' | 'bigpicture' | 'positions' | 'evolution' | 'learning'>('bigpicture');
  
  // Multi-market stream for the bigger picture
  const multiMarket = useMultiMarketStream();
  
  // Simulated positions tracker
  const positionsTracker = useSimulatedPositions();
  
  // Global trading session store
  const { 
    currentSession,
    recordPrediction,
    updateLiveMetrics,
    globalAccuracy,
    evolutionState
  } = useTradingSessionStore();
  
  const predictor = useScalpingPredictor({
    symbol: symbol || 'SPY',
    mode: 'demo',
    predictionIntervalMs: predictionInterval,
    autoPredict,
    demoVolatility: 0.0012,
    demoInterval: 150
  });
  
  // Safe accessors for potentially undefined values
  const activeSignals = multiMarket?.bigPicture?.activeSignals ?? [];
  const predictionBoost = multiMarket?.bigPicture?.predictionBoost ?? 1.0;
  const recentPredictions = predictor?.recentPredictions ?? [];
  const predictorStats = predictor?.stats ?? { 
    totalPredictions: 0,
    accuracy: 0, 
    recentAccuracy: 0, 
    currentStreak: 0,
    bestStreak: 0,
    upPredictions: { total: 0, correct: 0, accuracy: 0 },
    downPredictions: { total: 0, correct: 0, accuracy: 0 },
    flatPredictions: { total: 0, correct: 0, accuracy: 0 }
  };
  // Use predictor.learningState directly since it's always defined by the hook
  const safeLearningState = predictor?.learningState;
  
  // Sync prediction outcomes to global store - with safe null checks
  useEffect(() => {
    if (!predictor || recentPredictions.length === 0) return;
    
    const latest = recentPredictions[0];
    if (!latest || latest.wasCorrect === undefined) return;
    
    // Record to global accuracy
    const directionCorrect = latest.wasCorrect ?? false;
    
    try {
      recordPrediction({
        predicted: latest.predictedDirection as 'up' | 'down' | 'neutral',
        actual: (latest.actualDirection || latest.predictedDirection) as 'up' | 'down' | 'neutral',
        confidence: latest.confidence,
        directionCorrect,
        magnitudeAccuracy: predictorStats.accuracy / 100,
        timingAccuracy: predictorStats.recentAccuracy / 100,
        marketConditions: {
          correlationStrength: predictionBoost,
          volatility: 0.5,
          momentum: predictorStats.currentStreak / 10,
          leadingSignals: activeSignals.length / 10
        }
      });
    } catch (error) {
      console.error('[ScalpingTerminal] Error recording prediction:', error);
    }
  }, [predictor, recentPredictions.length, recordPrediction, predictionBoost, activeSignals.length, predictorStats]);
  
  // Update live metrics - with safe null checks
  useEffect(() => {
    if (!predictor) return;
    
    try {
      updateLiveMetrics({
        ticksProcessed: predictor.tickCount ?? 0,
        currentSymbol: symbol,
        isStreaming: (predictor.connected ?? false) && autoPredict
      });
    } catch (error) {
      console.error('[ScalpingTerminal] Error updating live metrics:', error);
    }
  }, [predictor, predictor?.tickCount, symbol, predictor?.connected, autoPredict, updateLiveMetrics]);
  
  const handleSymbolChange = useCallback((newSymbol: string) => {
    if (!predictor) return;
    setSymbol(newSymbol);
    try {
      predictor.reset();
      predictor.reconnect();
    } catch (error) {
      console.error('[ScalpingTerminal] Error changing symbol:', error);
    }
  }, [predictor]);
  
  const toggleAutoPredict = useCallback(() => {
    if (!predictor) return;
    try {
      if (autoPredict) {
        predictor.stopHeartbeat();
      } else {
        predictor.startHeartbeat();
      }
      setAutoPredict(!autoPredict);
    } catch (error) {
      console.error('[ScalpingTerminal] Error toggling auto predict:', error);
    }
  }, [autoPredict, predictor]);
  
  // Build correlated prices map from multi-market snapshot
  const correlatedPrices = useMemo(() => {
    const map = new Map<string, number>();
    if (!multiMarket?.snapshot) return map;
    
    try {
      Object.entries(multiMarket.snapshot).forEach(([assetClass, data]) => {
        if (data?.symbol && data?.price) {
          map.set(data.symbol, data.price);
        }
      });
    } catch (error) {
      console.error('[ScalpingTerminal] Error building correlated prices:', error);
    }
    return map;
  }, [multiMarket?.snapshot]);
  
  // Boost indicator from cross-market analysis
  const boostColor = predictionBoost >= 1.2 ? 'text-green-400' : 
                     predictionBoost <= 0.8 ? 'text-red-400' : 'text-primary';
  
  // Show loading state if predictor is not ready
  if (!predictor || !multiMarket) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Loading trading engine...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Global Accuracy Bar - Always Visible */}
      <GlobalAccuracyPanel compact showStreak />
      
      {/* Session Control - Compact */}
      <SessionControl compact />
      
      {/* Live Market Ticker - All Asset Classes */}
      <Card className="bg-card/30 border-primary/20">
        <CardContent className="py-3">
          <div className="flex items-center gap-3 mb-2">
            <Globe className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">Cross-Market Feed</span>
            <Badge variant="outline" className="text-xs">
              {multiMarket.ticksPerSecond} tps
            </Badge>
            {activeSignals.length > 0 && (
              <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                <Zap className="w-3 h-3 mr-1" />
                {activeSignals.length} signals
              </Badge>
            )}
            <div className={cn("flex items-center gap-1 ml-auto", boostColor)}>
              <Sparkles className="w-3 h-3" />
              <span className="text-xs font-mono font-bold">{predictionBoost.toFixed(2)}x boost</span>
            </div>
          </div>
          <MarketTicker snapshot={multiMarket.snapshot} />
        </CardContent>
      </Card>

      {/* Header with controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
        <Tabs value={activeView} onValueChange={(v) => setActiveView(v as 'focus' | 'bigpicture' | 'positions' | 'evolution' | 'learning')}>
            <TabsList>
              <TabsTrigger value="focus">Focus</TabsTrigger>
              <TabsTrigger value="bigpicture">Big Picture</TabsTrigger>
              <TabsTrigger value="positions" className="flex items-center gap-1">
                <DollarSign className="w-3 h-3" />
                Session
              </TabsTrigger>
              <TabsTrigger value="evolution" className="flex items-center gap-1">
                <Target className="w-3 h-3" />
                Evolution
              </TabsTrigger>
              <TabsTrigger value="learning" className="flex items-center gap-1">
                <Activity className="w-3 h-3" />
                24/7 Learning
              </TabsTrigger>
            </TabsList>
          </Tabs>
          
          <Select value={symbol} onValueChange={handleSymbolChange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SYMBOLS.map(s => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <div className="flex items-center gap-2">
            <Radio className={cn(
              "w-4 h-4",
              predictor.connected ? "text-green-500" : "text-red-500"
            )} />
            <span className="text-sm text-muted-foreground">
              {predictor.connected ? 'Connected' : 'Disconnected'}
            </span>
            <Badge variant="outline" className="text-xs">
              {predictor.ticksPerSecond} tps
            </Badge>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <HeartbeatIndicator 
            isAlive={predictor.heartbeatAlive}
            isProcessing={predictor.isProcessing}
            lastPulse={predictor.lastPulse}
            pulseCount={predictor.pulseCount}
            nextPulseIn={predictor.nextPulseIn}
            showControls={false}
            compact
          />
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowSettings(!showSettings)}
          >
            <Settings className="w-4 h-4" />
          </Button>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={predictor.reset}
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
          
          <Button
            variant={autoPredict ? "default" : "outline"}
            size="sm"
            onClick={toggleAutoPredict}
          >
            {autoPredict ? <Pause className="w-4 h-4 mr-1" /> : <Play className="w-4 h-4 mr-1" />}
            {autoPredict ? 'Pause' : 'Start'}
          </Button>
        </div>
      </div>
      
      {/* Settings panel */}
      {showSettings && (
        <Card className="bg-muted/30">
          <CardContent className="pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Prediction Interval: {predictionInterval / 1000}s
                </label>
                <Slider
                  value={[predictionInterval]}
                  onValueChange={([v]) => setPredictionInterval(v)}
                  min={1000}
                  max={10000}
                  step={500}
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Auto Predict</label>
                <Switch checked={autoPredict} onCheckedChange={setAutoPredict} />
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Main dashboard - changes based on view */}
      {activeView === 'focus' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left column - Chart and HUD */}
          <div className="lg:col-span-2 space-y-4">
            {/* Price display */}
            <Card className="bg-card/50 backdrop-blur">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    {symbol}
                  </CardTitle>
                  <div className="text-right">
                    <div className="text-3xl font-mono font-bold">
                      ${predictor.latestPrice?.toFixed(2) || '---'}
                    </div>
                    <div className={cn(
                      "text-sm",
                      predictor.priceChangePercent >= 0 ? "text-green-500" : "text-red-500"
                    )}>
                      {predictor.priceChangePercent >= 0 ? '+' : ''}
                      {predictor.priceChangePercent.toFixed(3)}%
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <TickChart 
                  ticks={predictor.connected ? Array.from({ length: predictor.tickCount }).map((_, i) => ({
                    price: predictor.latestPrice || 100,
                    volume: 1000,
                    timestamp: Date.now() - (predictor.tickCount - i) * 100
                  })) : []}
                  currentPrediction={predictor.currentPrediction ? {
                    direction: predictor.currentPrediction.predictedDirection,
                    priceAtPrediction: predictor.currentPrediction.priceAtPrediction,
                    targetPrice: predictor.currentPrediction.targetPrice
                  } : null}
                  height={180}
                />
              </CardContent>
            </Card>
            
            {/* Current prediction */}
            <PredictionHUD 
              prediction={predictor.currentPrediction}
              latestPrice={predictor.latestPrice}
            />
            
            {/* Prediction stream */}
            <Card className="bg-card/50 backdrop-blur">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Clock className="w-5 h-5" />
                  Prediction Stream
                </CardTitle>
              </CardHeader>
              <CardContent>
                <PredictionStream 
                  pending={predictor.pendingPredictions}
                  resolved={predictor.recentPredictions}
                  maxHeight="300px"
                />
              </CardContent>
            </Card>
          </div>
          
          {/* Right column - Learning state */}
          <div className="space-y-4">
            {safeLearningState && (
              <LearningStatePanel 
                state={safeLearningState}
                stats={predictorStats}
              />
            )}
            
            {/* Quick stats */}
            <Card className="bg-card/50 backdrop-blur">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Session Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ticks Processed</span>
                  <span className="font-mono">{predictor.tickCount}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Predictions Made</span>
                  <span className="font-mono">{predictorStats.totalPredictions ?? 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Correct</span>
                  <span className="font-mono text-green-500">
                    {safeLearningState?.correctPredictions ?? 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Win Rate</span>
                  <span className={cn(
                    "font-mono font-bold",
                    (predictorStats.accuracy ?? 0) >= 55 ? "text-green-500" : 
                    (predictorStats.accuracy ?? 0) >= 45 ? "text-yellow-500" : "text-red-500"
                  )}>
                    {(predictorStats.accuracy ?? 0).toFixed(1)}%
                  </span>
                </div>
              </CardContent>
            </Card>
            
            {/* Manual prediction button */}
            <Button 
              className="w-full"
              onClick={() => predictor.generatePrediction()}
              disabled={!predictor.connected}
            >
              <Zap className="w-4 h-4 mr-2" />
              Generate Prediction Now
            </Button>
          </div>
        </div>
      ) : activeView === 'bigpicture' ? (
        /* Big Picture View - Cross-Market Analysis */
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Left - Main chart and prediction */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="bg-card/50 backdrop-blur">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    {symbol} with Cross-Market Boost
                  </CardTitle>
                  <div className="flex items-center gap-3">
                    <div className={cn("flex items-center gap-1 text-sm", boostColor)}>
                      <Sparkles className="w-4 h-4" />
                      <span className="font-mono font-bold">{predictionBoost.toFixed(2)}x</span>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-mono font-bold">
                        ${predictor.latestPrice?.toFixed(2) || '---'}
                      </div>
                      <div className={cn(
                        "text-sm",
                        predictor.priceChangePercent >= 0 ? "text-green-500" : "text-red-500"
                      )}>
                        {predictor.priceChangePercent >= 0 ? '+' : ''}
                        {predictor.priceChangePercent.toFixed(3)}%
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <TickChart 
                  ticks={predictor.connected ? Array.from({ length: predictor.tickCount }).map((_, i) => ({
                    price: predictor.latestPrice || 100,
                    volume: 1000,
                    timestamp: Date.now() - (predictor.tickCount - i) * 100
                  })) : []}
                  currentPrediction={predictor.currentPrediction ? {
                    direction: predictor.currentPrediction.predictedDirection,
                    priceAtPrediction: predictor.currentPrediction.priceAtPrediction,
                    targetPrice: predictor.currentPrediction.targetPrice
                  } : null}
                  height={200}
                />
              </CardContent>
            </Card>
            
            <PredictionHUD 
              prediction={predictor.currentPrediction}
              latestPrice={predictor.latestPrice}
            />
            
            {safeLearningState && (
              <LearningStatePanel 
                state={safeLearningState}
                stats={predictorStats}
              />
            )}
          </div>
          
          {/* Center - Big Picture Panel */}
          <Card className="bg-card/50 backdrop-blur lg:col-span-1">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Globe className="w-5 h-5 text-primary" />
                Big Picture
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 h-[500px]">
              <BigPicturePanel state={multiMarket.bigPicture} />
            </CardContent>
          </Card>
          
          {/* Right - Prediction Stream & Stats */}
          <div className="space-y-4">
            <Card className="bg-card/50 backdrop-blur">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Clock className="w-5 h-5" />
                  Predictions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <PredictionStream 
                  pending={predictor.pendingPredictions}
                  resolved={predictor.recentPredictions}
                  maxHeight="250px"
                />
              </CardContent>
            </Card>
            
            <Card className="bg-card/50 backdrop-blur">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Session Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Markets Active</span>
                  <span className="font-mono">6</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cross-Market TPS</span>
                  <span className="font-mono">{multiMarket.ticksPerSecond}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Predictions</span>
                  <span className="font-mono">{predictorStats.totalPredictions}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Win Rate</span>
                  <span className={cn(
                    "font-mono font-bold",
                    predictorStats.accuracy >= 55 ? "text-green-500" : 
                    predictorStats.accuracy >= 45 ? "text-yellow-500" : "text-red-500"
                  )}>
                    {predictorStats.accuracy.toFixed(1)}%
                  </span>
                </div>
              </CardContent>
            </Card>
            
            <Button 
              className="w-full"
              onClick={() => predictor.generatePrediction()}
              disabled={!predictor.connected}
            >
              <Zap className="w-4 h-4 mr-2" />
              Generate Prediction
            </Button>
          </div>
        </div>
      ) : activeView === 'positions' ? (
        /* Positions View - Simulated Trading with Correlative Data */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left - Main chart and price */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="bg-card/50 backdrop-blur">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    {symbol} - Live Price
                  </CardTitle>
                  <div className="text-right">
                    <div className="text-3xl font-mono font-bold">
                      ${predictor.latestPrice?.toFixed(2) || '---'}
                    </div>
                    <div className={cn(
                      "text-sm",
                      predictor.priceChangePercent >= 0 ? "text-green-500" : "text-red-500"
                    )}>
                      {predictor.priceChangePercent >= 0 ? '+' : ''}
                      {predictor.priceChangePercent.toFixed(3)}%
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <TickChart 
                  ticks={predictor.connected ? Array.from({ length: predictor.tickCount }).map((_, i) => ({
                    price: predictor.latestPrice || 100,
                    volume: 1000,
                    timestamp: Date.now() - (predictor.tickCount - i) * 100
                  })) : []}
                  currentPrediction={predictor.currentPrediction ? {
                    direction: predictor.currentPrediction.predictedDirection,
                    priceAtPrediction: predictor.currentPrediction.priceAtPrediction,
                    targetPrice: predictor.currentPrediction.targetPrice
                  } : null}
                  height={200}
                />
              </CardContent>
            </Card>
            
            <PredictionHUD 
              prediction={predictor.currentPrediction}
              latestPrice={predictor.latestPrice}
            />
            
            <Card className="bg-card/50 backdrop-blur">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Clock className="w-5 h-5" />
                  Live Prediction Stream
                </CardTitle>
              </CardHeader>
              <CardContent>
                <PredictionStream 
                  pending={predictor.pendingPredictions}
                  resolved={predictor.recentPredictions}
                  maxHeight="200px"
                />
              </CardContent>
            </Card>
          </div>
          
          {/* Right - Position Tracker */}
          <div className="space-y-4">
            <PositionTracker
              openPositions={positionsTracker.openPositions}
              closedPositions={positionsTracker.closedPositions}
              stats={positionsTracker.stats}
              currentSymbol={symbol}
              currentPrice={predictor.latestPrice || 100}
              correlatedPrices={correlatedPrices}
              onOpenPosition={positionsTracker.openPosition}
              onClosePosition={positionsTracker.closePosition}
              onUpdatePosition={positionsTracker.updatePosition}
            />
          </div>
        </div>
      ) : activeView === 'evolution' ? (
        /* Evolution View - Full Global Accuracy & Self-Learning */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <GlobalAccuracyPanel />
          <SessionControl />
        </div>
      ) : activeView === 'learning' ? (
        /* 24/7 Learning View - Background Market Analysis */
        <MarketLearningDashboard />
      ) : null}
    </div>
  );
};
