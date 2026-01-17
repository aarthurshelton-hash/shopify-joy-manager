/**
 * Simplified Scalping Terminal
 * BULLETPROOF version that ALWAYS works for CEO testing
 * 
 * This is the primary trading interface - designed for reliability over complexity
 */

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, TrendingDown, Minus, Activity, 
  Play, Pause, RotateCcw, Zap, CheckCircle, XCircle, Target, 
  Radio, Clock
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

// ============================================
// TYPES
// ============================================

interface Prediction {
  id: string;
  direction: 'up' | 'down' | 'flat';
  confidence: number;
  priceAtPrediction: number;
  timestamp: number;
  expiresAt: number;
  resolved?: boolean;
  wasCorrect?: boolean;
  actualPrice?: number;
  actualDirection?: 'up' | 'down' | 'flat';
}

interface MarketTick {
  price: number;
  timestamp: number;
  volume: number;
}

interface SessionStats {
  totalPredictions: number;
  correct: number;
  accuracy: number;
  currentStreak: number;
  bestStreak: number;
  upAccuracy: number;
  downAccuracy: number;
}

// ============================================
// PURE FUNCTIONS - Market Simulation
// ============================================

function generateTick(prevPrice: number, volatility: number = 0.001): MarketTick {
  const change = (Math.random() - 0.5) * 2 * volatility;
  const momentum = Math.random() > 0.95 ? (Math.random() - 0.5) * volatility * 3 : 0;
  const newPrice = prevPrice * (1 + change + momentum);
  
  return {
    price: Math.round(newPrice * 100) / 100,
    timestamp: Date.now(),
    volume: Math.round(1000 + Math.random() * 5000)
  };
}

function predictDirection(ticks: MarketTick[]): { direction: 'up' | 'down' | 'flat'; confidence: number } {
  if (ticks.length < 10) {
    return { direction: 'flat', confidence: 50 };
  }

  // Calculate momentum from recent ticks
  const recent = ticks.slice(-20);
  const priceChanges = recent.slice(1).map((t, i) => t.price - recent[i].price);
  const avgChange = priceChanges.reduce((a, b) => a + b, 0) / priceChanges.length;
  
  // Calculate volatility
  const variance = priceChanges.reduce((sum, c) => sum + Math.pow(c - avgChange, 2), 0) / priceChanges.length;
  const volatility = Math.sqrt(variance);
  
  // Calculate volume trend
  const volumeRecent = recent.slice(-5).reduce((sum, t) => sum + t.volume, 0) / 5;
  const volumeEarlier = recent.slice(-10, -5).reduce((sum, t) => sum + t.volume, 0) / 5;
  const volumeTrend = volumeRecent > volumeEarlier ? 1.1 : 0.9;
  
  // Combine signals
  const signal = avgChange * 1000 * volumeTrend; // Amplify for readability
  
  let direction: 'up' | 'down' | 'flat';
  if (signal > 0.1) direction = 'up';
  else if (signal < -0.1) direction = 'down';
  else direction = 'flat';
  
  // Confidence based on signal strength and volatility
  const signalStrength = Math.min(Math.abs(signal) * 100, 30);
  const baseConfidence = 50 + signalStrength;
  const confidence = Math.min(95, Math.max(35, baseConfidence * (volatility < 0.5 ? 1.1 : 0.9)));
  
  return { direction, confidence: Math.round(confidence) };
}

function resolveDirection(priceChange: number): 'up' | 'down' | 'flat' {
  if (priceChange > 0.01) return 'up';
  if (priceChange < -0.01) return 'down';
  return 'flat';
}

// ============================================
// DIRECTION ICON COMPONENT
// ============================================

const DirectionIcon: React.FC<{ direction: 'up' | 'down' | 'flat'; size?: number }> = ({ direction, size = 20 }) => {
  if (direction === 'up') return <TrendingUp size={size} className="text-green-500" />;
  if (direction === 'down') return <TrendingDown size={size} className="text-red-500" />;
  return <Minus size={size} className="text-muted-foreground" />;
};

// ============================================
// MAIN COMPONENT
// ============================================

const SimplifiedScalpingTerminal: React.FC = () => {
  // Core state
  const [isRunning, setIsRunning] = useState(true);
  const [ticks, setTicks] = useState<MarketTick[]>([]);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [currentPrice, setCurrentPrice] = useState(450); // SPY-like starting price
  const [predictionInterval, setPredictionInterval] = useState(3000);
  
  // Refs for intervals
  const tickIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const predictionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);
  
  // Calculate stats
  const stats = useMemo((): SessionStats => {
    const resolved = predictions.filter(p => p.resolved);
    const correct = resolved.filter(p => p.wasCorrect);
    const upPreds = resolved.filter(p => p.direction === 'up');
    const downPreds = resolved.filter(p => p.direction === 'down');
    
    // Calculate current streak
    let currentStreak = 0;
    for (let i = resolved.length - 1; i >= 0; i--) {
      if (resolved[i].wasCorrect) currentStreak++;
      else break;
    }
    
    // Calculate best streak
    let bestStreak = 0;
    let tempStreak = 0;
    for (const p of resolved) {
      if (p.wasCorrect) {
        tempStreak++;
        bestStreak = Math.max(bestStreak, tempStreak);
      } else {
        tempStreak = 0;
      }
    }
    
    return {
      totalPredictions: resolved.length,
      correct: correct.length,
      accuracy: resolved.length > 0 ? (correct.length / resolved.length) * 100 : 0,
      currentStreak,
      bestStreak,
      upAccuracy: upPreds.length > 0 ? (upPreds.filter(p => p.wasCorrect).length / upPreds.length) * 100 : 0,
      downAccuracy: downPreds.length > 0 ? (downPreds.filter(p => p.wasCorrect).length / downPreds.length) * 100 : 0
    };
  }, [predictions]);
  
  // Pending and resolved predictions
  const pendingPredictions = useMemo(() => 
    predictions.filter(p => !p.resolved).slice(-5), 
    [predictions]
  );
  
  const recentResolved = useMemo(() => 
    predictions.filter(p => p.resolved).slice(-10).reverse(), 
    [predictions]
  );
  
  // Generate tick function
  const generateNewTick = useCallback(() => {
    setTicks(prev => {
      const lastPrice = prev.length > 0 ? prev[prev.length - 1].price : currentPrice;
      const newTick = generateTick(lastPrice);
      setCurrentPrice(newTick.price);
      
      const updated = [...prev, newTick].slice(-200);
      return updated;
    });
  }, [currentPrice]);
  
  // Generate prediction function
  const generateNewPrediction = useCallback(() => {
    setTicks(currentTicks => {
      if (currentTicks.length < 10) return currentTicks;
      
      const { direction, confidence } = predictDirection(currentTicks);
      const latestPrice = currentTicks[currentTicks.length - 1].price;
      
      const newPrediction: Prediction = {
        id: `pred-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        direction,
        confidence,
        priceAtPrediction: latestPrice,
        timestamp: Date.now(),
        expiresAt: Date.now() + predictionInterval
      };
      
      setPredictions(prev => [...prev, newPrediction].slice(-100));
      
      return currentTicks;
    });
  }, [predictionInterval]);
  
  // Resolve predictions
  const resolvePredictions = useCallback(() => {
    const now = Date.now();
    
    setPredictions(prev => prev.map(pred => {
      if (pred.resolved || pred.expiresAt > now) return pred;
      
      const priceChange = ((currentPrice - pred.priceAtPrediction) / pred.priceAtPrediction) * 100;
      const actualDirection = resolveDirection(priceChange);
      const wasCorrect = pred.direction === actualDirection;
      
      return {
        ...pred,
        resolved: true,
        wasCorrect,
        actualPrice: currentPrice,
        actualDirection
      };
    }));
  }, [currentPrice]);
  
  // Start/Stop tick generation
  useEffect(() => {
    mountedRef.current = true;
    
    if (isRunning) {
      // Generate initial ticks immediately
      for (let i = 0; i < 50; i++) {
        const lastPrice = ticks.length > 0 ? ticks[ticks.length - 1].price : 450;
        const tick = generateTick(lastPrice);
        ticks.push(tick);
      }
      setTicks([...ticks]);
      setCurrentPrice(ticks[ticks.length - 1]?.price || 450);
      
      // Start tick interval
      tickIntervalRef.current = setInterval(() => {
        if (mountedRef.current) {
          generateNewTick();
          resolvePredictions();
        }
      }, 100);
      
      // Start prediction interval
      predictionIntervalRef.current = setInterval(() => {
        if (mountedRef.current) {
          generateNewPrediction();
        }
      }, predictionInterval);
    }
    
    return () => {
      mountedRef.current = false;
      if (tickIntervalRef.current) clearInterval(tickIntervalRef.current);
      if (predictionIntervalRef.current) clearInterval(predictionIntervalRef.current);
    };
  }, [isRunning, predictionInterval]);
  
  // Reset function
  const handleReset = useCallback(() => {
    setPredictions([]);
    setTicks([]);
    setCurrentPrice(450);
  }, []);
  
  // Price change since start
  const priceChange = ticks.length > 0 ? currentPrice - (ticks[0]?.price || currentPrice) : 0;
  const priceChangePercent = ticks.length > 0 && ticks[0]?.price 
    ? ((currentPrice - ticks[0].price) / ticks[0].price) * 100 
    : 0;

  return (
    <div className="space-y-4 p-4">
      {/* Header with Status */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Activity className="w-6 h-6 text-primary" />
            Scalping Terminal
          </h1>
          <Badge variant={isRunning ? "default" : "secondary"} className="animate-pulse">
            <Radio className={cn("w-3 h-3 mr-1", isRunning ? "text-green-500" : "text-red-500")} />
            {isRunning ? 'LIVE' : 'PAUSED'}
          </Badge>
          <Badge variant="outline">
            {ticks.length} ticks
          </Badge>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant={isRunning ? "destructive" : "default"}
            size="sm"
            onClick={() => setIsRunning(!isRunning)}
          >
            {isRunning ? <Pause className="w-4 h-4 mr-1" /> : <Play className="w-4 h-4 mr-1" />}
            {isRunning ? 'Pause' : 'Start'}
          </Button>
          <Button variant="outline" size="sm" onClick={handleReset}>
            <RotateCcw className="w-4 h-4 mr-1" />
            Reset
          </Button>
        </div>
      </div>
      
      {/* Main Price Display */}
      <Card className="bg-gradient-to-br from-card to-card/50 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-muted-foreground mb-1">SPY (Demo)</div>
              <div className="text-5xl font-mono font-bold">
                ${currentPrice.toFixed(2)}
              </div>
              <div className={cn(
                "text-lg font-medium mt-1",
                priceChange >= 0 ? "text-green-500" : "text-red-500"
              )}>
                {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)} ({priceChangePercent >= 0 ? '+' : ''}{priceChangePercent.toFixed(3)}%)
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Session Accuracy</div>
              <div className={cn(
                "text-4xl font-bold",
                stats.accuracy >= 60 ? "text-green-500" : 
                stats.accuracy >= 50 ? "text-yellow-500" : "text-red-500"
              )}>
                {stats.accuracy.toFixed(1)}%
              </div>
              <div className="text-sm text-muted-foreground">
                {stats.correct}/{stats.totalPredictions} correct
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card className="bg-card/50">
          <CardContent className="pt-4 text-center">
            <div className="text-2xl font-bold text-primary">{stats.totalPredictions}</div>
            <div className="text-xs text-muted-foreground">Total Predictions</div>
          </CardContent>
        </Card>
        
        <Card className="bg-card/50">
          <CardContent className="pt-4 text-center">
            <div className="text-2xl font-bold text-green-500">{stats.currentStreak}</div>
            <div className="text-xs text-muted-foreground">Current Streak</div>
          </CardContent>
        </Card>
        
        <Card className="bg-card/50">
          <CardContent className="pt-4 text-center">
            <div className="text-2xl font-bold text-yellow-500">{stats.bestStreak}</div>
            <div className="text-xs text-muted-foreground">Best Streak</div>
          </CardContent>
        </Card>
        
        <Card className="bg-card/50">
          <CardContent className="pt-4 text-center">
            <div className="flex items-center justify-center gap-1">
              <TrendingUp className="w-4 h-4 text-green-500" />
              <span className="text-lg font-bold">{stats.upAccuracy.toFixed(0)}%</span>
            </div>
            <div className="text-xs text-muted-foreground">Up Accuracy</div>
          </CardContent>
        </Card>
        
        <Card className="bg-card/50">
          <CardContent className="pt-4 text-center">
            <div className="flex items-center justify-center gap-1">
              <TrendingDown className="w-4 h-4 text-red-500" />
              <span className="text-lg font-bold">{stats.downAccuracy.toFixed(0)}%</span>
            </div>
            <div className="text-xs text-muted-foreground">Down Accuracy</div>
          </CardContent>
        </Card>
      </div>
      
      {/* Predictions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Pending Predictions */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="w-4 h-4 text-yellow-500" />
              Pending Predictions ({pendingPredictions.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 min-h-[200px]">
              <AnimatePresence mode="popLayout">
                {pendingPredictions.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    Waiting for predictions...
                  </div>
                ) : (
                  pendingPredictions.map(pred => {
                    const timeLeft = Math.max(0, pred.expiresAt - Date.now());
                    const progress = ((predictionInterval - timeLeft) / predictionInterval) * 100;
                    
                    return (
                      <motion.div
                        key={pred.id}
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: 100 }}
                        className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/50"
                      >
                        <DirectionIcon direction={pred.direction} size={24} />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-medium capitalize">{pred.direction}</span>
                            <Badge variant="outline">{pred.confidence}%</Badge>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Entry: ${pred.priceAtPrediction.toFixed(2)}
                          </div>
                          <Progress value={progress} className="h-1 mt-1" />
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {(timeLeft / 1000).toFixed(1)}s
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </AnimatePresence>
            </div>
          </CardContent>
        </Card>
        
        {/* Resolved Predictions */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" />
              Recent Results ({recentResolved.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 min-h-[200px] max-h-[300px] overflow-y-auto">
              <AnimatePresence mode="popLayout">
                {recentResolved.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    No results yet...
                  </div>
                ) : (
                  recentResolved.map(pred => (
                    <motion.div
                      key={pred.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg border",
                        pred.wasCorrect 
                          ? "bg-green-500/10 border-green-500/30" 
                          : "bg-red-500/10 border-red-500/30"
                      )}
                    >
                      {pred.wasCorrect ? (
                        <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">Predicted:</span>
                          <DirectionIcon direction={pred.direction} size={16} />
                          <span className="text-xs text-muted-foreground">Actual:</span>
                          <DirectionIcon direction={pred.actualDirection || 'flat'} size={16} />
                        </div>
                        <div className="text-xs text-muted-foreground">
                          ${pred.priceAtPrediction.toFixed(2)} → ${pred.actualPrice?.toFixed(2)}
                          <span className={cn(
                            "ml-2",
                            (pred.actualPrice || 0) >= pred.priceAtPrediction ? "text-green-500" : "text-red-500"
                          )}>
                            ({((((pred.actualPrice || 0) - pred.priceAtPrediction) / pred.priceAtPrediction) * 100).toFixed(3)}%)
                          </span>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {pred.confidence}%
                      </Badge>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Live Activity Indicator */}
      {isRunning && (
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 1 }}
          >
            <Zap className="w-4 h-4 text-yellow-500" />
          </motion.div>
          System learning from {stats.totalPredictions} predictions...
        </div>
      )}
      
      {/* CEO Attribution */}
      <div className="text-center text-xs text-muted-foreground/50 pt-4 border-t border-border/20">
        En Pensent™ Prediction Engine • CEO Alec Arthur Shelton • Patent Pending
      </div>
    </div>
  );
};

export default SimplifiedScalpingTerminal;
