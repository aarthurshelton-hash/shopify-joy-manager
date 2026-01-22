/**
 * Options Scalping Terminal - Main Dashboard
 * 
 * 24/7 American Options Scalping with Multi-Timeframe Prediction
 * En Pensent™ Patent-Pending Technology
 * @version 7.50-OPTIONS
 */

import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Play, Pause, RotateCcw, Activity, Target, Zap, Clock, Award, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useOptionsScalping } from '@/hooks/useOptionsScalping';
import { SCALPING_UNDERLYINGS } from '@/lib/pensent-core/domains/options';

const OptionsScalpingTerminal: React.FC = () => {
  const {
    isRunning, isConnected, selectedUnderlying, chain, analysis, context,
    pendingPredictions, resolvedPredictions, portfolio, accuracy, evolution,
    start, stop, selectUnderlying, generatePrediction, reset,
  } = useOptionsScalping();

  useEffect(() => {
    start();
    return () => stop();
  }, []);

  const winRate = accuracy.total > 0 ? (accuracy.correct / accuracy.total * 100) : 0;

  return (
    <div className="space-y-4">
      {/* Header Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold">Options Scalping Terminal</h2>
          <Badge variant={isConnected ? 'default' : 'destructive'} className="gap-1">
            <Activity className="w-3 h-3" />
            {isConnected ? 'Connected' : 'Disconnected'}
          </Badge>
          <Badge variant={context?.session === 'regular' ? 'default' : 'secondary'}>
            {context?.session || 'unknown'}
          </Badge>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant={isRunning ? 'destructive' : 'default'} onClick={isRunning ? stop : start}>
            {isRunning ? <><Pause className="w-4 h-4 mr-1" /> Stop</> : <><Play className="w-4 h-4 mr-1" /> Start</>}
          </Button>
          <Button size="sm" variant="outline" onClick={reset}><RotateCcw className="w-4 h-4" /></Button>
        </div>
      </div>

      {/* Underlying Selector */}
      <div className="flex gap-2 flex-wrap">
        {SCALPING_UNDERLYINGS.map(u => (
          <Button
            key={u.symbol}
            size="sm"
            variant={selectedUnderlying === u.symbol ? 'default' : 'outline'}
            onClick={() => selectUnderlying(u.symbol)}
          >
            {u.symbol}
          </Button>
        ))}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <Card><CardContent className="pt-4 text-center">
          <DollarSign className="w-5 h-5 mx-auto mb-1 text-primary" />
          <div className="text-2xl font-bold">${portfolio.balance.toFixed(0)}</div>
          <div className="text-xs text-muted-foreground">Balance</div>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <div className={cn("text-2xl font-bold", portfolio.totalPnL >= 0 ? "text-green-500" : "text-red-500")}>
            {portfolio.totalPnL >= 0 ? '+' : ''}${portfolio.totalPnL.toFixed(0)}
          </div>
          <div className="text-xs text-muted-foreground">Total P&L</div>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <Target className="w-5 h-5 mx-auto mb-1 text-primary" />
          <div className="text-2xl font-bold">{winRate.toFixed(1)}%</div>
          <div className="text-xs text-muted-foreground">Win Rate</div>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <Zap className="w-5 h-5 mx-auto mb-1 text-primary" />
          <div className="text-2xl font-bold">{accuracy.total}</div>
          <div className="text-xs text-muted-foreground">Predictions</div>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <Award className="w-5 h-5 mx-auto mb-1 text-primary" />
          <div className="text-2xl font-bold">Gen {evolution.generation}</div>
          <div className="text-xs text-muted-foreground">Evolution</div>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <Clock className="w-5 h-5 mx-auto mb-1 text-primary" />
          <div className="text-2xl font-bold">{(evolution.fitness * 100).toFixed(0)}%</div>
          <div className="text-xs text-muted-foreground">Fitness</div>
        </CardContent></Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Underlying Analysis */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">{selectedUnderlying} Analysis</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {analysis ? (
              <>
                <div className="flex justify-between">
                  <span className="text-2xl font-bold">${analysis.price.toFixed(2)}</span>
                  <Badge variant={analysis.changePercent >= 0 ? 'default' : 'destructive'}>
                    {analysis.changePercent >= 0 ? '+' : ''}{analysis.changePercent.toFixed(2)}%
                  </Badge>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span>RSI</span><span>{analysis.rsi.toFixed(1)}</span></div>
                  <Progress value={analysis.rsi} className="h-2" />
                  <div className="flex justify-between"><span>IV Rank</span><span>{analysis.ivRank.toFixed(0)}%</span></div>
                  <Progress value={analysis.ivRank} className="h-2" />
                  <div className="flex justify-between"><span>Trend</span>
                    <Badge variant={analysis.trend === 'bullish' ? 'default' : analysis.trend === 'bearish' ? 'destructive' : 'secondary'}>
                      {analysis.trend}
                    </Badge>
                  </div>
                </div>
              </>
            ) : <div className="text-center text-muted-foreground py-8">Loading...</div>}
          </CardContent>
        </Card>

        {/* Predictions */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Live Predictions</CardTitle></CardHeader>
          <CardContent>
            <Tabs defaultValue="pending">
              <TabsList className="w-full"><TabsTrigger value="pending" className="flex-1">Pending ({pendingPredictions.length})</TabsTrigger><TabsTrigger value="resolved" className="flex-1">Resolved</TabsTrigger></TabsList>
              <TabsContent value="pending">
                <ScrollArea className="h-[200px]">
                  {pendingPredictions.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">No pending predictions</div>
                  ) : pendingPredictions.map(p => (
                    <motion.div key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div className="flex items-center gap-2">
                        {p.direction === 'long' ? <TrendingUp className="w-4 h-4 text-green-500" /> : <TrendingDown className="w-4 h-4 text-red-500" />}
                        <span className="font-medium">{p.underlying}</span>
                        <Badge variant="outline">${p.strike} {p.optionType.toUpperCase()}</Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge>{(p.confidence * 100).toFixed(0)}%</Badge>
                        <span className="text-xs text-muted-foreground">{p.strategy}</span>
                      </div>
                    </motion.div>
                  ))}
                </ScrollArea>
              </TabsContent>
              <TabsContent value="resolved">
                <ScrollArea className="h-[200px]">
                  {resolvedPredictions.map(p => (
                    <div key={p.id} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div className="flex items-center gap-2">
                        {p.wasCorrect ? <TrendingUp className="w-4 h-4 text-green-500" /> : <TrendingDown className="w-4 h-4 text-red-500" />}
                        <span>{p.underlying} ${p.strike}</span>
                      </div>
                      <Badge variant={p.wasCorrect ? 'default' : 'destructive'}>
                        {p.pnl && p.pnl >= 0 ? '+' : ''}${(p.pnl || 0).toFixed(0)}
                      </Badge>
                    </div>
                  ))}
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      <div className="text-center text-xs text-muted-foreground">
        En Pensent™ Options Scalping System v7.50 | Patent-Pending Technology
      </div>
    </div>
  );
};

export default OptionsScalpingTerminal;
