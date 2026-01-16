/**
 * Scalping Terminal
 * Full trading dashboard with real-time predictions
 */

import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  Play, Pause, RotateCcw, Settings, Zap, Activity,
  TrendingUp, TrendingDown, Radio, Clock
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { useScalpingPredictor } from '@/hooks/useScalpingPredictor';
import { PredictionHUD } from './PredictionHUD';
import { LearningStatePanel } from './LearningStatePanel';
import { PredictionStream } from './PredictionStream';
import { TickChart } from './TickChart';
import { HeartbeatIndicator } from '@/components/pensent-code/HeartbeatIndicator';

const SYMBOLS = ['SPY', 'QQQ', 'AAPL', 'NVDA', 'TSLA', 'MSFT', 'AMD', 'GOOGL'];

export const ScalpingTerminal: React.FC = () => {
  const [symbol, setSymbol] = useState('SPY');
  const [autoPredict, setAutoPredict] = useState(true);
  const [predictionInterval, setPredictionInterval] = useState(3000);
  const [showSettings, setShowSettings] = useState(false);
  
  const predictor = useScalpingPredictor({
    symbol,
    mode: 'demo', // Will be 'websocket' when real API connected
    predictionIntervalMs: predictionInterval,
    autoPredict,
    demoVolatility: 0.0012,
    demoInterval: 150
  });
  
  const handleSymbolChange = useCallback((newSymbol: string) => {
    setSymbol(newSymbol);
    predictor.reset();
    predictor.reconnect();
  }, [predictor]);
  
  const toggleAutoPredict = useCallback(() => {
    if (autoPredict) {
      predictor.stopHeartbeat();
    } else {
      predictor.startHeartbeat();
    }
    setAutoPredict(!autoPredict);
  }, [autoPredict, predictor]);
  
  return (
    <div className="space-y-4">
      {/* Header with controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
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
      
      {/* Main dashboard */}
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
          <LearningStatePanel 
            state={predictor.learningState}
            stats={predictor.stats}
          />
          
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
                <span className="font-mono">{predictor.stats.totalPredictions}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Correct</span>
                <span className="font-mono text-green-500">
                  {predictor.learningState.correctPredictions}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Win Rate</span>
                <span className={cn(
                  "font-mono font-bold",
                  predictor.stats.accuracy >= 55 ? "text-green-500" : 
                  predictor.stats.accuracy >= 45 ? "text-yellow-500" : "text-red-500"
                )}>
                  {predictor.stats.accuracy.toFixed(1)}%
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
    </div>
  );
};
