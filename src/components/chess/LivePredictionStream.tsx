/**
 * Live Prediction Stream Component
 * 
 * Shows real-time predictions as they're processed during benchmark runs.
 * Displays each prediction with its outcome, archetype, and time control.
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, Zap, Brain, Cpu, Clock, Timer, Users } from 'lucide-react';
import { formatTimeControl } from '@/lib/chess/disagreementTracker';

export interface LivePrediction {
  id: string;
  gameName: string;
  moveNumber: number;
  fen: string;
  hybridPrediction: string;
  hybridArchetype: string;
  hybridConfidence: number;
  hybridCorrect: boolean;
  stockfishPrediction: string;
  stockfishEval: number;
  stockfishDepth: number;
  stockfishCorrect: boolean;
  actualResult: string;
  timeControl?: string;
  whiteElo?: number;
  blackElo?: number;
  timestamp: number;
}

interface LivePredictionStreamProps {
  predictions: LivePrediction[];
  isRunning: boolean;
  maxDisplay?: number;
}

export function LivePredictionStream({ 
  predictions, 
  isRunning, 
  maxDisplay = 10 
}: LivePredictionStreamProps) {
  // Show most recent predictions first
  const displayPredictions = [...predictions].reverse().slice(0, maxDisplay);
  
  // Calculate running stats
  const hybridWins = predictions.filter(p => p.hybridCorrect && !p.stockfishCorrect).length;
  const stockfishWins = predictions.filter(p => !p.hybridCorrect && p.stockfishCorrect).length;
  const bothCorrect = predictions.filter(p => p.hybridCorrect && p.stockfishCorrect).length;
  const hybridTotal = predictions.filter(p => p.hybridCorrect).length;
  const stockfishTotal = predictions.filter(p => p.stockfishCorrect).length;
  
  const hybridAccuracy = predictions.length > 0 ? (hybridTotal / predictions.length) * 100 : 0;
  const stockfishAccuracy = predictions.length > 0 ? (stockfishTotal / predictions.length) * 100 : 0;

  if (predictions.length === 0 && !isRunning) {
    return null;
  }

  return (
    <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-yellow-500" />
            Live Prediction Stream
            {isRunning && (
              <Badge variant="outline" className="animate-pulse bg-green-500/20 text-green-400 border-green-500/30">
                LIVE
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="text-muted-foreground">{predictions.length} analyzed</span>
            <span className="text-purple-400">EP: {hybridAccuracy.toFixed(1)}%</span>
            <span className="text-blue-400">SF: {stockfishAccuracy.toFixed(1)}%</span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Running Score */}
        <div className="grid grid-cols-4 gap-2 text-center text-xs">
          <div className="p-2 bg-purple-500/10 rounded-lg border border-purple-500/20">
            <p className="text-lg font-bold text-purple-400">{hybridWins}</p>
            <p className="text-muted-foreground">EP Wins</p>
          </div>
          <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
            <p className="text-lg font-bold text-blue-400">{stockfishWins}</p>
            <p className="text-muted-foreground">SF Wins</p>
          </div>
          <div className="p-2 bg-green-500/10 rounded-lg border border-green-500/20">
            <p className="text-lg font-bold text-green-400">{bothCorrect}</p>
            <p className="text-muted-foreground">Both ✓</p>
          </div>
          <div className="p-2 bg-muted/30 rounded-lg">
            <p className="text-lg font-bold">
              {hybridWins > stockfishWins ? (
                <span className="text-purple-400">+{hybridWins - stockfishWins}</span>
              ) : hybridWins < stockfishWins ? (
                <span className="text-blue-400">{hybridWins - stockfishWins}</span>
              ) : (
                <span className="text-muted-foreground">0</span>
              )}
            </p>
            <p className="text-muted-foreground">Net</p>
          </div>
        </div>

        {/* Live Stream */}
        <ScrollArea className="h-[280px]">
          <AnimatePresence initial={false}>
            {displayPredictions.map((prediction, index) => {
              const timeControlInfo = formatTimeControl(prediction.timeControl);
              const isBreakthrough = prediction.hybridCorrect && !prediction.stockfishCorrect;
              const isStockfishWin = !prediction.hybridCorrect && prediction.stockfishCorrect;
              
              return (
                <motion.div
                  key={prediction.id}
                  initial={{ opacity: 0, y: -20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ 
                    duration: 0.3, 
                    delay: index === 0 ? 0 : 0.05 
                  }}
                  className={`mb-2 p-3 rounded-lg border transition-colors ${
                    isBreakthrough 
                      ? 'bg-green-500/10 border-green-500/30' 
                      : isStockfishWin 
                        ? 'bg-red-500/10 border-red-500/30'
                        : 'bg-muted/30 border-muted'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-medium text-sm truncate">
                          {prediction.gameName}
                        </span>
                        <Badge variant="outline" className={`${timeControlInfo.color} text-xs border-current/30`}>
                          {timeControlInfo.icon} {timeControlInfo.label}
                        </Badge>
                        {(prediction.whiteElo || prediction.blackElo) && (
                          <Badge variant="outline" className="text-xs text-muted-foreground">
                            <Users className="h-3 w-3 mr-1" />
                            ~{Math.round(((prediction.whiteElo || 0) + (prediction.blackElo || 0)) / 2)}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Move {prediction.moveNumber}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Cpu className="h-3 w-3" />
                          d{prediction.stockfishDepth}
                        </span>
                        <span>•</span>
                        <span className="font-mono">
                          {prediction.stockfishEval > 0 ? '+' : ''}{(prediction.stockfishEval / 100).toFixed(1)}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Brain className="h-3 w-3 text-purple-400" />
                          {prediction.hybridArchetype}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-1 shrink-0">
                      <div className={`flex items-center gap-1 text-xs ${
                        prediction.hybridCorrect ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {prediction.hybridCorrect ? (
                          <CheckCircle className="h-3 w-3" />
                        ) : (
                          <XCircle className="h-3 w-3" />
                        )}
                        EP
                      </div>
                      <div className={`flex items-center gap-1 text-xs ${
                        prediction.stockfishCorrect ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {prediction.stockfishCorrect ? (
                          <CheckCircle className="h-3 w-3" />
                        ) : (
                          <XCircle className="h-3 w-3" />
                        )}
                        SF
                      </div>
                    </div>
                  </div>
                  
                  {/* Prediction breakdown */}
                  <div className="grid grid-cols-3 gap-2 mt-2 text-xs">
                    <div className={`p-1.5 rounded text-center ${
                      prediction.stockfishCorrect ? 'bg-green-500/20' : 'bg-red-500/20'
                    }`}>
                      <span className="text-muted-foreground">SF:</span>{' '}
                      <span className="font-medium">{prediction.stockfishPrediction}</span>
                    </div>
                    <div className={`p-1.5 rounded text-center ${
                      prediction.hybridCorrect ? 'bg-green-500/20' : 'bg-red-500/20'
                    }`}>
                      <span className="text-muted-foreground">EP:</span>{' '}
                      <span className="font-medium">{prediction.hybridPrediction}</span>
                    </div>
                    <div className="p-1.5 rounded text-center bg-primary/20">
                      <span className="text-muted-foreground">Actual:</span>{' '}
                      <span className="font-medium text-primary">{prediction.actualResult}</span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
          
          {predictions.length === 0 && isRunning && (
            <div className="text-center py-8 text-muted-foreground">
              <Timer className="h-8 w-8 mx-auto mb-2 animate-pulse" />
              <p>Waiting for predictions...</p>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
