/**
 * Session Control Component
 * Start/Stop trading sessions with $1000 starting balance
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, Pause, Square, RotateCcw, DollarSign, 
  TrendingUp, TrendingDown, Clock, Trophy, 
  AlertCircle, Zap, Target
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { useTradingSessionStore } from '@/stores/tradingSessionStore';

interface SessionControlProps {
  onSessionStart?: () => void;
  onSessionEnd?: () => void;
  compact?: boolean;
}

export const SessionControl: React.FC<SessionControlProps> = ({
  onSessionStart,
  onSessionEnd,
  compact = false
}) => {
  const { 
    currentSession, 
    startSession, 
    pauseSession, 
    resumeSession, 
    endSession,
    getSessionStats,
    getAllTimeStats,
    activeTrades
  } = useTradingSessionStore();
  
  const sessionStats = getSessionStats();
  const allTimeStats = getAllTimeStats();
  
  const handleStart = () => {
    startSession(1000);
    onSessionStart?.();
  };
  
  const handleEnd = () => {
    endSession();
    onSessionEnd?.();
  };
  
  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  };
  
  const formatMoney = (amount: number) => {
    const sign = amount >= 0 ? '+' : '';
    return `${sign}$${Math.abs(amount).toFixed(2)}`;
  };
  
  if (compact) {
    return (
      <div className="flex items-center gap-3 p-3 bg-card/50 rounded-lg border border-primary/20">
        {!currentSession ? (
          <Button onClick={handleStart} size="sm" className="gap-2">
            <Play className="w-4 h-4" />
            Start $1,000 Session
          </Button>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-primary" />
              <div>
                <div className={cn(
                  "text-lg font-mono font-bold",
                  currentSession.currentBalance >= currentSession.startingBalance 
                    ? "text-green-400" 
                    : "text-red-400"
                )}>
                  ${currentSession.currentBalance.toFixed(2)}
                </div>
                <div className="text-[10px] text-muted-foreground">
                  {formatMoney(sessionStats.totalGrowth)} ({sessionStats.growthPercent.toFixed(2)}%)
                </div>
              </div>
            </div>
            
            <Separator orientation="vertical" className="h-8" />
            
            <div className="flex items-center gap-1">
              {currentSession.status === 'active' ? (
                <Button variant="ghost" size="sm" onClick={pauseSession}>
                  <Pause className="w-4 h-4" />
                </Button>
              ) : (
                <Button variant="ghost" size="sm" onClick={resumeSession}>
                  <Play className="w-4 h-4" />
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={handleEnd}>
                <Square className="w-4 h-4" />
              </Button>
            </div>
            
            <Badge variant="outline" className="text-xs">
              {activeTrades.length} open
            </Badge>
          </>
        )}
      </div>
    );
  }
  
  return (
    <Card className="bg-card/50 backdrop-blur border-primary/20">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <DollarSign className="w-5 h-5 text-primary" />
            Trading Session
          </CardTitle>
          
          {currentSession && (
            <Badge 
              variant="outline"
              className={cn(
                "text-xs",
                currentSession.status === 'active' 
                  ? "border-green-500/30 text-green-400" 
                  : "border-yellow-500/30 text-yellow-400"
              )}
            >
              {currentSession.status === 'active' ? '● LIVE' : '○ PAUSED'}
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <AnimatePresence mode="wait">
          {!currentSession ? (
            /* Start Session View */
            <motion.div
              key="start"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              <div className="text-center p-6 bg-muted/30 rounded-lg">
                <motion.div
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="text-5xl font-mono font-bold text-primary mb-2"
                >
                  $1,000
                </motion.div>
                <p className="text-sm text-muted-foreground">
                  Starting Balance
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  How much can you grow it in one session?
                </p>
              </div>
              
              <Button 
                onClick={handleStart} 
                className="w-full gap-2 h-12 text-lg"
                size="lg"
              >
                <Play className="w-5 h-5" />
                Start Trading Session
              </Button>
              
              {/* All-Time Stats */}
              {allTimeStats.totalSessions > 0 && (
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="p-2 bg-muted/20 rounded">
                    <div className="text-xs text-muted-foreground">Sessions</div>
                    <div className="text-sm font-mono">{allTimeStats.totalSessions}</div>
                  </div>
                  <div className="p-2 bg-muted/20 rounded">
                    <div className="text-xs text-muted-foreground">Best Growth</div>
                    <div className="text-sm font-mono text-green-400">
                      ${allTimeStats.bestSession.toFixed(2)}
                    </div>
                  </div>
                  <div className="p-2 bg-muted/20 rounded">
                    <div className="text-xs text-muted-foreground">Total Trades</div>
                    <div className="text-sm font-mono">{allTimeStats.totalTrades}</div>
                  </div>
                  <div className="p-2 bg-muted/20 rounded">
                    <div className="text-xs text-muted-foreground">Win Rate</div>
                    <div className="text-sm font-mono">
                      {allTimeStats.overallWinRate.toFixed(1)}%
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          ) : (
            /* Active Session View */
            <motion.div
              key="active"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              {/* Current Balance */}
              <div className="text-center p-4 bg-muted/30 rounded-lg">
                <div className={cn(
                  "text-4xl font-mono font-bold transition-colors",
                  currentSession.currentBalance >= currentSession.startingBalance 
                    ? "text-green-400" 
                    : "text-red-400"
                )}>
                  ${currentSession.currentBalance.toFixed(2)}
                </div>
                
                <div className="flex items-center justify-center gap-2 mt-2">
                  {sessionStats.totalGrowth >= 0 ? (
                    <TrendingUp className="w-4 h-4 text-green-400" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-400" />
                  )}
                  <span className={cn(
                    "text-lg font-mono",
                    sessionStats.totalGrowth >= 0 ? "text-green-400" : "text-red-400"
                  )}>
                    {formatMoney(sessionStats.totalGrowth)} 
                    ({sessionStats.growthPercent >= 0 ? '+' : ''}
                    {sessionStats.growthPercent.toFixed(2)}%)
                  </span>
                </div>
                
                <div className="flex items-center justify-center gap-4 mt-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDuration(sessionStats.sessionDuration)}
                  </span>
                  <span>Peak: ${currentSession.peakBalance.toFixed(2)}</span>
                  <span>Low: ${currentSession.troughBalance.toFixed(2)}</span>
                </div>
              </div>
              
              {/* Session Stats */}
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="p-2 bg-muted/20 rounded">
                  <div className="text-xs text-muted-foreground">Trades</div>
                  <div className="text-sm font-mono">{currentSession.totalTrades}</div>
                </div>
                <div className="p-2 bg-muted/20 rounded">
                  <div className="text-xs text-muted-foreground">Win Rate</div>
                  <div className={cn(
                    "text-sm font-mono",
                    sessionStats.winRate >= 50 ? "text-green-400" : "text-red-400"
                  )}>
                    {sessionStats.winRate.toFixed(0)}%
                  </div>
                </div>
                <div className="p-2 bg-muted/20 rounded">
                  <div className="text-xs text-muted-foreground">Best</div>
                  <div className="text-sm font-mono text-green-400">
                    +${currentSession.bestTrade.toFixed(2)}
                  </div>
                </div>
                <div className="p-2 bg-muted/20 rounded">
                  <div className="text-xs text-muted-foreground">Worst</div>
                  <div className="text-sm font-mono text-red-400">
                    ${currentSession.worstTrade.toFixed(2)}
                  </div>
                </div>
              </div>
              
              {/* Prediction Accuracy */}
              <div className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-primary" />
                  <span className="text-sm">Session Predictions</span>
                </div>
                <div className="text-right">
                  <div className={cn(
                    "text-sm font-mono font-bold",
                    currentSession.predictions > 0 && 
                    (currentSession.correctPredictions / currentSession.predictions) >= 0.5
                      ? "text-green-400" 
                      : "text-red-400"
                  )}>
                    {currentSession.correctPredictions}/{currentSession.predictions}
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    {currentSession.predictions > 0 
                      ? `${((currentSession.correctPredictions / currentSession.predictions) * 100).toFixed(1)}%`
                      : '—'}
                  </div>
                </div>
              </div>
              
              {/* Open Positions Warning */}
              {activeTrades.length > 0 && (
                <div className="flex items-center gap-2 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-yellow-400" />
                  <span className="text-sm text-yellow-400">
                    {activeTrades.length} open position{activeTrades.length > 1 ? 's' : ''}
                  </span>
                </div>
              )}
              
              {/* Controls */}
              <div className="flex gap-2">
                {currentSession.status === 'active' ? (
                  <Button 
                    variant="outline" 
                    className="flex-1 gap-2"
                    onClick={pauseSession}
                  >
                    <Pause className="w-4 h-4" />
                    Pause
                  </Button>
                ) : (
                  <Button 
                    variant="outline" 
                    className="flex-1 gap-2"
                    onClick={resumeSession}
                  >
                    <Play className="w-4 h-4" />
                    Resume
                  </Button>
                )}
                
                <Button 
                  variant="destructive" 
                  className="flex-1 gap-2"
                  onClick={handleEnd}
                >
                  <Square className="w-4 h-4" />
                  End Session
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};
