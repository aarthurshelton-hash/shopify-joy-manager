/**
 * Simplified Scalping Terminal - LIVE MARKET DATA VERSION
 * Uses REAL 24/7 market data (crypto/forex) for prediction testing
 * 
 * CEO Testing Dashboard - Alec Arthur Shelton
 */

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, TrendingDown, Minus, Activity, 
  Play, Pause, RotateCcw, Zap, CheckCircle, XCircle, Target, 
  Radio, Clock, Wifi, WifiOff, Globe
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

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
  symbol: string;
}

interface PriceTick {
  price: number;
  timestamp: number;
  symbol: string;
  isReal: boolean;
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

// 24/7 Markets - Crypto trades around the clock
const MARKET_SYMBOLS = [
  { symbol: 'BTC-USD', name: 'Bitcoin', is24h: true },
  { symbol: 'ETH-USD', name: 'Ethereum', is24h: true },
  { symbol: 'SPY', name: 'S&P 500 ETF', is24h: false },
  { symbol: 'QQQ', name: 'Nasdaq 100 ETF', is24h: false },
  { symbol: 'AAPL', name: 'Apple', is24h: false },
  { symbol: 'TSLA', name: 'Tesla', is24h: false },
  { symbol: 'NVDA', name: 'NVIDIA', is24h: false },
];

// ============================================
// PREDICTION ENGINE
// ============================================

function predictDirection(ticks: PriceTick[]): { direction: 'up' | 'down' | 'flat'; confidence: number } {
  if (ticks.length < 5) {
    return { direction: 'flat', confidence: 50 };
  }

  const recent = ticks.slice(-20);
  const priceChanges = recent.slice(1).map((t, i) => t.price - recent[i].price);
  const avgChange = priceChanges.reduce((a, b) => a + b, 0) / priceChanges.length;
  
  // Calculate momentum
  const shortMomentum = ticks.slice(-5).reduce((sum, t, i, arr) => 
    i === 0 ? 0 : sum + (t.price - arr[i-1].price), 0);
  const longMomentum = ticks.slice(-15).reduce((sum, t, i, arr) => 
    i === 0 ? 0 : sum + (t.price - arr[i-1].price), 0);
  
  // Volatility
  const variance = priceChanges.reduce((sum, c) => sum + Math.pow(c - avgChange, 2), 0) / priceChanges.length;
  const volatility = Math.sqrt(variance);
  
  // Combined signal
  const signal = (shortMomentum * 2 + longMomentum) / ticks[ticks.length - 1].price * 10000;
  
  let direction: 'up' | 'down' | 'flat';
  if (signal > 0.5) direction = 'up';
  else if (signal < -0.5) direction = 'down';
  else direction = 'flat';
  
  // Confidence based on signal strength
  const signalStrength = Math.min(Math.abs(signal) * 10, 35);
  const baseConfidence = 50 + signalStrength;
  const confidence = Math.min(92, Math.max(40, baseConfidence * (volatility < 50 ? 1.1 : 0.9)));
  
  return { direction, confidence: Math.round(confidence) };
}

function resolveDirection(priceChange: number): 'up' | 'down' | 'flat' {
  if (priceChange > 0.0001) return 'up';
  if (priceChange < -0.0001) return 'down';
  return 'flat';
}

// ============================================
// DIRECTION ICON
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
  const [selectedSymbol, setSelectedSymbol] = useState('BTC-USD');
  const [ticks, setTicks] = useState<PriceTick[]>([]);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [predictionIntervalMs] = useState(5000); // 5 second predictions
  
  // Refs
  const fetchIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const predictionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);
  const lastPriceRef = useRef<number | null>(null);

  // Get symbol info
  const symbolInfo = useMemo(() => 
    MARKET_SYMBOLS.find(s => s.symbol === selectedSymbol) || MARKET_SYMBOLS[0],
    [selectedSymbol]
  );

  // Calculate stats
  const stats = useMemo((): SessionStats => {
    const symbolPredictions = predictions.filter(p => p.symbol === selectedSymbol);
    const resolved = symbolPredictions.filter(p => p.resolved);
    const correct = resolved.filter(p => p.wasCorrect);
    const upPreds = resolved.filter(p => p.direction === 'up');
    const downPreds = resolved.filter(p => p.direction === 'down');
    
    let currentStreak = 0;
    for (let i = resolved.length - 1; i >= 0; i--) {
      if (resolved[i].wasCorrect) currentStreak++;
      else break;
    }
    
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
  }, [predictions, selectedSymbol]);

  // Pending and resolved predictions for current symbol
  const pendingPredictions = useMemo(() => 
    predictions.filter(p => !p.resolved && p.symbol === selectedSymbol).slice(-5), 
    [predictions, selectedSymbol]
  );
  
  const recentResolved = useMemo(() => 
    predictions.filter(p => p.resolved && p.symbol === selectedSymbol).slice(-10).reverse(), 
    [predictions, selectedSymbol]
  );

  // Fetch real market data
  const fetchMarketData = useCallback(async () => {
    if (!mountedRef.current) return;
    
    try {
      const { data, error } = await supabase.functions.invoke('stock-data', {
        body: { action: 'quote', symbol: selectedSymbol }
      });

      if (error) throw error;
      
      if (data && data.latestPrice) {
        const price = data.latestPrice;
        const now = Date.now();
        
        // Only add tick if price changed
        if (lastPriceRef.current !== price) {
          lastPriceRef.current = price;
          
          const newTick: PriceTick = {
            price,
            timestamp: now,
            symbol: selectedSymbol,
            isReal: true
          };
          
          setTicks(prev => {
            const updated = [...prev.filter(t => t.symbol === selectedSymbol), newTick].slice(-200);
            return updated;
          });
          
          setCurrentPrice(price);
          setIsLive(true);
          setFetchError(null);
        }
        
        setLastFetch(new Date());
      }
    } catch (error) {
      console.error('Market data fetch error:', error);
      setFetchError(error instanceof Error ? error.message : 'Failed to fetch');
      setIsLive(false);
      
      // Generate simulated tick as fallback
      if (currentPrice) {
        const change = (Math.random() - 0.5) * currentPrice * 0.0005;
        const newPrice = currentPrice + change;
        
        setTicks(prev => [...prev, {
          price: newPrice,
          timestamp: Date.now(),
          symbol: selectedSymbol,
          isReal: false
        }].slice(-200));
        
        setCurrentPrice(newPrice);
      }
    }
  }, [selectedSymbol, currentPrice]);

  // Generate prediction
  const generatePrediction = useCallback(() => {
    const symbolTicks = ticks.filter(t => t.symbol === selectedSymbol);
    if (symbolTicks.length < 5 || !currentPrice) return;
    
    const { direction, confidence } = predictDirection(symbolTicks);
    
    const newPrediction: Prediction = {
      id: `pred-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      direction,
      confidence,
      priceAtPrediction: currentPrice,
      timestamp: Date.now(),
      expiresAt: Date.now() + predictionIntervalMs,
      symbol: selectedSymbol
    };
    
    setPredictions(prev => [...prev, newPrediction].slice(-100));
  }, [ticks, selectedSymbol, currentPrice, predictionIntervalMs]);

  // Resolve predictions
  const resolvePredictions = useCallback(() => {
    if (!currentPrice) return;
    const now = Date.now();
    
    setPredictions(prev => prev.map(pred => {
      if (pred.resolved || pred.expiresAt > now || pred.symbol !== selectedSymbol) return pred;
      
      const priceChange = (currentPrice - pred.priceAtPrediction) / pred.priceAtPrediction;
      const actualDirection = resolveDirection(priceChange);
      const wasCorrect = pred.direction === actualDirection || 
        (pred.direction === 'flat' && Math.abs(priceChange) < 0.0002);
      
      return {
        ...pred,
        resolved: true,
        wasCorrect,
        actualPrice: currentPrice,
        actualDirection
      };
    }));
  }, [currentPrice, selectedSymbol]);

  // Main effect - start/stop data fetching
  useEffect(() => {
    mountedRef.current = true;
    
    if (isRunning) {
      // Initial fetch
      fetchMarketData();
      
      // Fetch every 2 seconds for real-time feel
      fetchIntervalRef.current = setInterval(() => {
        if (mountedRef.current) {
          fetchMarketData();
          resolvePredictions();
        }
      }, 2000);
      
      // Generate predictions every 5 seconds
      predictionIntervalRef.current = setInterval(() => {
        if (mountedRef.current) {
          generatePrediction();
        }
      }, predictionIntervalMs);
    }
    
    return () => {
      mountedRef.current = false;
      if (fetchIntervalRef.current) clearInterval(fetchIntervalRef.current);
      if (predictionIntervalRef.current) clearInterval(predictionIntervalRef.current);
    };
  }, [isRunning, selectedSymbol, predictionIntervalMs]);

  // Symbol change - reset ticks
  useEffect(() => {
    setTicks([]);
    setCurrentPrice(null);
    lastPriceRef.current = null;
    if (isRunning) {
      fetchMarketData();
    }
  }, [selectedSymbol]);

  // Reset function
  const handleReset = useCallback(() => {
    setPredictions([]);
    setTicks([]);
    setCurrentPrice(null);
    lastPriceRef.current = null;
  }, []);

  // Format price based on symbol
  const formatPrice = (price: number) => {
    if (selectedSymbol.includes('BTC')) return `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    if (selectedSymbol.includes('ETH')) return `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    return `$${price.toFixed(2)}`;
  };

  // Price change calculation
  const symbolTicks = ticks.filter(t => t.symbol === selectedSymbol);
  const priceChange = symbolTicks.length > 1 && currentPrice ? 
    currentPrice - symbolTicks[0].price : 0;
  const priceChangePercent = symbolTicks.length > 1 && symbolTicks[0].price ? 
    (priceChange / symbolTicks[0].price) * 100 : 0;

  return (
    <div className="space-y-4 p-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Activity className="w-6 h-6 text-primary" />
            Live Scalping Terminal
          </h1>
          <Badge variant={isLive ? "default" : "destructive"} className="animate-pulse">
            {isLive ? <Wifi className="w-3 h-3 mr-1" /> : <WifiOff className="w-3 h-3 mr-1" />}
            {isLive ? 'LIVE DATA' : 'SIMULATED'}
          </Badge>
          {symbolInfo.is24h && (
            <Badge variant="outline" className="text-green-500 border-green-500">
              <Globe className="w-3 h-3 mr-1" />
              24/7 Market
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={selectedSymbol} onValueChange={setSelectedSymbol}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MARKET_SYMBOLS.map(s => (
                <SelectItem key={s.symbol} value={s.symbol}>
                  {s.symbol} - {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
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

      {/* Error Banner */}
      {fetchError && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 text-sm text-destructive">
          ⚠️ {fetchError} - Using simulated data as fallback
        </div>
      )}
      
      {/* Main Price Display */}
      <Card className="bg-gradient-to-br from-card to-card/50 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-muted-foreground mb-1 flex items-center gap-2">
                {symbolInfo.name} ({selectedSymbol})
                {lastFetch && (
                  <span className="text-xs opacity-60">
                    Updated: {lastFetch.toLocaleTimeString()}
                  </span>
                )}
              </div>
              <div className="text-5xl font-mono font-bold">
                {currentPrice ? formatPrice(currentPrice) : 'Loading...'}
              </div>
              {currentPrice && (
                <div className={cn(
                  "text-lg font-medium mt-1",
                  priceChange >= 0 ? "text-green-500" : "text-red-500"
                )}>
                  {priceChange >= 0 ? '+' : ''}{formatPrice(Math.abs(priceChange))} ({priceChangePercent >= 0 ? '+' : ''}{priceChangePercent.toFixed(4)}%)
                </div>
              )}
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
                    {currentPrice ? 'Generating predictions...' : 'Waiting for market data...'}
                  </div>
                ) : (
                  pendingPredictions.map(pred => {
                    const timeLeft = Math.max(0, pred.expiresAt - Date.now());
                    const progress = ((predictionIntervalMs - timeLeft) / predictionIntervalMs) * 100;
                    
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
                            Entry: {formatPrice(pred.priceAtPrediction)}
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
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg border",
                        pred.wasCorrect 
                          ? "bg-green-500/10 border-green-500/30" 
                          : "bg-red-500/10 border-red-500/30"
                      )}
                    >
                      {pred.wasCorrect ? (
                        <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-500 shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">Predicted:</span>
                          <DirectionIcon direction={pred.direction} size={16} />
                          <span className="text-xs text-muted-foreground">→</span>
                          <span className="text-sm">Actual:</span>
                          <DirectionIcon direction={pred.actualDirection || 'flat'} size={16} />
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {formatPrice(pred.priceAtPrediction)} → {pred.actualPrice ? formatPrice(pred.actualPrice) : '?'}
                        </div>
                      </div>
                      <Badge 
                        variant={pred.wasCorrect ? "default" : "destructive"}
                        className="shrink-0"
                      >
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

      {/* Live Data Indicator */}
      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <Radio className={cn("w-3 h-3", isLive ? "text-green-500 animate-pulse" : "text-red-500")} />
        {isLive ? (
          <span>Receiving live market data • {symbolTicks.length} ticks collected</span>
        ) : (
          <span>Using simulated data • Real data unavailable</span>
        )}
      </div>
    </div>
  );
};

export default SimplifiedScalpingTerminal;
