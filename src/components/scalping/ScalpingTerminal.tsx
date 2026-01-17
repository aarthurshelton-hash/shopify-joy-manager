/**
 * Scalping Terminal
 * Full trading dashboard with real-time predictions and cross-market analysis
 * Integrated with Universal Heartbeat - CEO Alec Arthur Shelton exclusive
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Play, Pause, RotateCcw, Settings, Zap, Activity,
  TrendingUp, TrendingDown, Radio, Clock, Globe, Sparkles, DollarSign, Target, AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
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

// Safe loading component
const LoadingTerminal = ({ status }: { status: string }) => (
  <div className="flex flex-col items-center justify-center p-8 gap-4 min-h-[400px]">
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
    >
      <Activity className="w-8 h-8 text-primary" />
    </motion.div>
    <div className="text-muted-foreground">Initializing Trading Engine...</div>
    <div className="text-xs text-muted-foreground">{status}</div>
    <div className="text-xs text-muted-foreground/60">Demo mode activating automatically</div>
  </div>
);

const ScalpingTerminal: React.FC = () => {
  // State declarations - all at top level, unconditionally
  const [symbol, setSymbol] = useState('SPY');
  const [autoPredict, setAutoPredict] = useState(true);
  const [predictionInterval, setPredictionInterval] = useState(3000);
  const [showSettings, setShowSettings] = useState(false);
  const [activeView, setActiveView] = useState<'focus' | 'bigpicture' | 'positions' | 'evolution' | 'learning'>('bigpicture');
  const [isReady, setIsReady] = useState(false);
  const [initStatus, setInitStatus] = useState('Initializing...');
  const mountedRef = React.useRef(true);
  
  // All hooks called unconditionally at top level
  const multiMarket = useMultiMarketStream();
  const positionsTracker = useSimulatedPositions();
  const tradingStore = useTradingSessionStore();
  
  // Stable config that only changes when needed
  const predictorConfig = useMemo(() => ({
    symbol: symbol || 'SPY',
    mode: 'demo' as const,
    predictionIntervalMs: predictionInterval,
    autoPredict,
    demoVolatility: 0.0012,
    demoInterval: 150
  }), [symbol, predictionInterval, autoPredict]);
  
  const predictor = useScalpingPredictor(predictorConfig);
  
  // Safe destructuring with defaults
  const { 
    recordPrediction = () => {},
    updateLiveMetrics = () => {},
    evolutionState = { 
      metrics: { 
        generationNumber: 1, 
        learningVelocity: 0, 
        currentFitness: 0.5, 
        peakFitness: 0.5,
        totalPredictions: 0,
        successfulEvolutions: 0,
        startedAt: Date.now(),
        adaptationRate: 0.1
      }, 
      patternLibrary: [],
      genes: [],
      correlationMemory: [],
      adaptiveThresholds: { confidenceBoost: 0, horizonAdjust: 0, volatilityScale: 1 },
      recentMutations: []
    }
  } = tradingStore || {};
  
  // Safe accessors with null checks - using useMemo for stability
  const activeSignals = useMemo(() => 
    multiMarket?.bigPicture?.activeSignals ?? [], 
    [multiMarket?.bigPicture?.activeSignals]
  );
  
  const predictionBoost = useMemo(() => 
    multiMarket?.bigPicture?.predictionBoost ?? 1.0, 
    [multiMarket?.bigPicture?.predictionBoost]
  );
  
  const recentPredictions = useMemo(() => 
    predictor?.recentPredictions ?? [], 
    [predictor?.recentPredictions]
  );
  
  const predictorStats = useMemo(() => 
    predictor?.stats ?? { 
      totalPredictions: 0,
      accuracy: 0, 
      recentAccuracy: 0, 
      currentStreak: 0,
      bestStreak: 0,
      upPredictions: { total: 0, correct: 0, accuracy: 0 },
      downPredictions: { total: 0, correct: 0, accuracy: 0 },
      flatPredictions: { total: 0, correct: 0, accuracy: 0 }
    }, 
    [predictor?.stats]
  );
  
  const safeLearningState = useMemo(() => 
    predictor?.learningState ?? null, 
    [predictor?.learningState]
  );

  // Build correlated prices map from multi-market snapshot
  const correlatedPrices = useMemo(() => {
    const map = new Map<string, number>();
    if (!multiMarket?.snapshot) return map;
    
    try {
      Object.entries(multiMarket.snapshot).forEach(([, data]) => {
        if (data?.symbol && data?.price) {
          map.set(data.symbol, data.price);
        }
      });
    } catch (error) {
      console.error('[ScalpingTerminal] Error building correlated prices:', error);
    }
    return map;
  }, [multiMarket?.snapshot]);

  // Track mount state
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Mark as ready with robust detection and fallback
  useEffect(() => {
    const predictorConnected = predictor?.connected ?? false;
    const multiMarketConnected = multiMarket?.connected ?? false;
    
    // Update status messages
    if (!predictorConnected && !multiMarketConnected) {
      setInitStatus('Starting market streams...');
    } else if (predictorConnected && !multiMarketConnected) {
      setInitStatus('Predictor ready, connecting markets...');
    } else if (!predictorConnected && multiMarketConnected) {
      setInitStatus('Markets connected, starting predictor...');
    } else {
      setInitStatus('All systems ready');
    }
    
    // Set ready when both are connected
    if (predictorConnected && multiMarketConnected && !isReady) {
      const timer = setTimeout(() => {
        if (mountedRef.current) {
          console.log('[ScalpingTerminal] All systems connected - activating');
          setIsReady(true);
        }
      }, 300);
      return () => clearTimeout(timer);
    }
    
    // Fallback: Force ready after 2 seconds - demo mode should always work
    const fallbackTimer = setTimeout(() => {
      if (mountedRef.current && !isReady) {
        console.log('[ScalpingTerminal] Fallback activation - forcing ready state');
        setInitStatus('Activating (demo mode)...');
        setIsReady(true);
      }
    }, 2000);
    
    return () => clearTimeout(fallbackTimer);
  }, [predictor?.connected, multiMarket?.connected, isReady]);

  // Sync prediction outcomes to global store
  useEffect(() => {
    if (!predictor || recentPredictions.length === 0) return;
    
    try {
      const latest = recentPredictions[0];
      if (!latest || latest.wasCorrect === undefined) return;
      
      const directionCorrect = latest.wasCorrect ?? false;
      
      recordPrediction({
        predicted: latest.predictedDirection as 'up' | 'down' | 'neutral',
        actual: (latest.actualDirection || latest.predictedDirection) as 'up' | 'down' | 'neutral',
        confidence: latest.confidence ?? 0.5,
        directionCorrect,
        magnitudeAccuracy: (predictorStats.accuracy ?? 0) / 100,
        timingAccuracy: (predictorStats.recentAccuracy ?? 0) / 100,
        marketConditions: {
          correlationStrength: predictionBoost ?? 1,
          volatility: 0.5,
          momentum: (predictorStats.currentStreak ?? 0) / 10,
          leadingSignals: (activeSignals?.length ?? 0) / 10
        }
      });
    } catch (error) {
      console.error('[ScalpingTerminal] Error recording prediction:', error);
    }
  }, [recentPredictions, recordPrediction, predictionBoost, activeSignals, predictorStats, predictor]);
  
  // Update live metrics
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
  
  // Handlers with safe checks
  const handleSymbolChange = useCallback((newSymbol: string) => {
    setSymbol(newSymbol);
    if (predictor) {
      try {
        predictor.reset();
        predictor.reconnect();
      } catch (error) {
        console.error('[ScalpingTerminal] Error changing symbol:', error);
      }
    }
  }, [predictor]);
  
  const toggleAutoPredict = useCallback(() => {
    try {
      if (predictor) {
        if (autoPredict) {
          predictor.stopHeartbeat();
        } else {
          predictor.startHeartbeat();
        }
      }
      setAutoPredict(!autoPredict);
    } catch (error) {
      console.error('[ScalpingTerminal] Error toggling auto predict:', error);
    }
  }, [autoPredict, predictor]);
  
  // Boost indicator from cross-market analysis
  const boostColor = predictionBoost >= 1.2 ? 'text-green-400' : 
                     predictionBoost <= 0.8 ? 'text-red-400' : 'text-primary';
  
  // Show loading state if systems aren't ready
  if (!predictor || !multiMarket || !isReady) {
    return <LoadingTerminal status={initStatus} />;
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
              {multiMarket.ticksPerSecond ?? 0} tps
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
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-4 flex-wrap">
          <Tabs value={activeView} onValueChange={(v) => setActiveView(v as typeof activeView)}>
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
              {predictor.ticksPerSecond ?? 0} tps
            </Badge>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <HeartbeatIndicator 
            isAlive={predictor.heartbeatAlive ?? false}
            isProcessing={predictor.isProcessing ?? false}
            lastPulse={predictor.lastPulse ?? null}
            pulseCount={predictor.pulseCount ?? 0}
            nextPulseIn={predictor.nextPulseIn ?? 0}
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
            onClick={() => predictor.reset()}
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
                      (predictor.priceChangePercent ?? 0) >= 0 ? "text-green-500" : "text-red-500"
                    )}>
                      {(predictor.priceChangePercent ?? 0) >= 0 ? '+' : ''}
                      {(predictor.priceChangePercent ?? 0).toFixed(3)}%
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <TickChart 
                  ticks={predictor.connected ? Array.from({ length: Math.min(predictor.tickCount ?? 0, 100) }).map((_, i) => ({
                    price: predictor.latestPrice || 100,
                    volume: 1000,
                    timestamp: Date.now() - ((predictor.tickCount ?? 0) - i) * 100
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
              prediction={predictor.currentPrediction ?? null}
              latestPrice={predictor.latestPrice ?? null}
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
                  pending={predictor.pendingPredictions ?? []}
                  resolved={predictor.recentPredictions ?? []}
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
                  <span className="font-mono">{predictor.tickCount ?? 0}</span>
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
        <BigPicturePanel state={multiMarket?.bigPicture ?? null} />
      ) : activeView === 'positions' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <SessionControl />
          <PositionTracker
            openPositions={positionsTracker.openPositions}
            closedPositions={positionsTracker.closedPositions}
            stats={positionsTracker.stats}
            currentSymbol={symbol}
            currentPrice={predictor.latestPrice ?? 100}
            correlatedPrices={correlatedPrices}
            onOpenPosition={(sym, dir, price, corrPrices) => {
              positionsTracker.openPosition(sym, dir, price, corrPrices);
            }}
            onClosePosition={(posId, closePrice) => {
              positionsTracker.closePosition(posId, closePrice);
            }}
            onUpdatePosition={(posId, price, corrPrices) => {
              positionsTracker.updatePosition(posId, price, corrPrices);
            }}
          />
        </div>
      ) : activeView === 'evolution' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <GlobalAccuracyPanel showStreak />
          <Card className="bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Evolution Engine
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="p-3 bg-muted/30 rounded-lg">
                  <div className="text-2xl font-mono font-bold text-primary">
                    {evolutionState?.metrics?.generationNumber ?? 1}
                  </div>
                  <div className="text-xs text-muted-foreground">Generation</div>
                </div>
                <div className="p-3 bg-muted/30 rounded-lg">
                  <div className={cn(
                    "text-2xl font-mono font-bold",
                    (evolutionState?.metrics?.learningVelocity ?? 0) > 0 ? "text-green-400" : "text-red-400"
                  )}>
                    {((evolutionState?.metrics?.learningVelocity ?? 0) * 100).toFixed(1)}%
                  </div>
                  <div className="text-xs text-muted-foreground">Learning Velocity</div>
                </div>
                <div className="p-3 bg-muted/30 rounded-lg">
                  <div className="text-2xl font-mono font-bold">
                    {((evolutionState?.metrics?.currentFitness ?? 0.5) * 100).toFixed(0)}%
                  </div>
                  <div className="text-xs text-muted-foreground">Current Fitness</div>
                </div>
                <div className="p-3 bg-muted/30 rounded-lg">
                  <div className="text-2xl font-mono font-bold text-yellow-400">
                    {evolutionState?.patternLibrary?.length ?? 0}
                  </div>
                  <div className="text-xs text-muted-foreground">Learned Patterns</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : activeView === 'learning' ? (
        <MarketLearningDashboard />
      ) : null}
    </div>
  );
};

export { ScalpingTerminal };
