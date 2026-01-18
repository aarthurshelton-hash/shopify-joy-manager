/**
 * Live ELO Panel
 * 
 * Displays continuously updating FIDE ELO comparison between
 * En Pensent and Stockfish 17 (3600-3700 baseline).
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Crown, TrendingUp, TrendingDown, Minus, Zap, Target, Brain, Cpu } from 'lucide-react';
import { 
  LiveEloState, 
  STOCKFISH_17_ELO, 
  formatElo, 
  getEloComparisonText,
  getStockfishEloForDepth
} from '@/lib/chess/liveEloTracker';

interface LiveEloPanelProps {
  eloState: LiveEloState;
  currentDepth?: number;
  isLive?: boolean;
}

export function LiveEloPanel({ eloState, currentDepth = 60, isLive = false }: LiveEloPanelProps) {
  const stockfishDepthElo = getStockfishEloForDepth(currentDepth);
  
  // Progress toward transcendence (3800+)
  const transcendenceProgress = Math.min(100, ((eloState.enPensentElo - 3400) / 400) * 100);
  
  return (
    <Card className="border-primary/30 bg-gradient-to-br from-background to-primary/5">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-yellow-500" />
            <span>Live FIDE ELO Comparison</span>
            {isLive && (
              <Badge variant="outline" className="animate-pulse bg-green-500/10 text-green-500 border-green-500/30">
                LIVE
              </Badge>
            )}
          </div>
          <Badge 
            className={`bg-gradient-to-r ${eloState.titleColor} text-white border-0`}
          >
            {eloState.title}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Main ELO Display */}
        <div className="grid grid-cols-3 gap-4">
          {/* En Pensent ELO */}
          <div className="text-center p-4 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-lg border border-purple-500/20">
            <Brain className="h-6 w-6 mx-auto mb-2 text-purple-500" />
            <p className="text-3xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
              {formatElo(eloState.enPensentElo)}
            </p>
            <p className="text-sm text-muted-foreground">En Pensent</p>
            <p className="text-xs text-purple-400 mt-1">
              ±{Math.round((eloState.confidenceInterval[1] - eloState.confidenceInterval[0]) / 2)}
            </p>
          </div>
          
          {/* VS Indicator */}
          <div className="text-center p-4 flex flex-col items-center justify-center">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${
              eloState.vsStockfish === 'winning' 
                ? 'bg-green-500/20 text-green-500' 
                : eloState.vsStockfish === 'losing'
                  ? 'bg-red-500/20 text-red-500'
                  : 'bg-yellow-500/20 text-yellow-500'
            }`}>
              {eloState.vsStockfish === 'winning' ? (
                <TrendingUp className="h-6 w-6" />
              ) : eloState.vsStockfish === 'losing' ? (
                <TrendingDown className="h-6 w-6" />
              ) : (
                <Minus className="h-6 w-6" />
              )}
            </div>
            <p className={`text-2xl font-bold ${
              eloState.eloDifference > 0 ? 'text-green-500' : 
              eloState.eloDifference < 0 ? 'text-red-500' : 'text-yellow-500'
            }`}>
              {eloState.eloDifference > 0 ? '+' : ''}{eloState.eloDifference}
            </p>
            <p className="text-xs text-muted-foreground">ELO Diff</p>
          </div>
          
          {/* Stockfish ELO */}
          <div className="text-center p-4 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-lg border border-blue-500/20">
            <Cpu className="h-6 w-6 mx-auto mb-2 text-blue-500" />
            <p className="text-3xl font-bold text-blue-500">
              {formatElo(stockfishDepthElo)}
            </p>
            <p className="text-sm text-muted-foreground">Stockfish 17</p>
            <p className="text-xs text-blue-400 mt-1">
              Depth {currentDepth}
            </p>
          </div>
        </div>
        
        {/* Comparison Text */}
        <div className="text-center p-3 bg-muted/30 rounded-lg">
          <p className="text-sm font-medium">{getEloComparisonText(eloState)}</p>
        </div>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-3 text-center text-sm">
          <div className="p-2 bg-muted/20 rounded">
            <p className="text-xl font-bold text-primary">{eloState.gamesAnalyzed}</p>
            <p className="text-xs text-muted-foreground">Games</p>
          </div>
          <div className="p-2 bg-green-500/10 rounded">
            <p className="text-xl font-bold text-green-500">{eloState.wins}</p>
            <p className="text-xs text-muted-foreground">Wins</p>
          </div>
          <div className="p-2 bg-yellow-500/10 rounded">
            <p className="text-xl font-bold text-yellow-500">{eloState.draws}</p>
            <p className="text-xs text-muted-foreground">Draws</p>
          </div>
          <div className="p-2 bg-red-500/10 rounded">
            <p className="text-xl font-bold text-red-500">{eloState.losses}</p>
            <p className="text-xs text-muted-foreground">Losses</p>
          </div>
        </div>
        
        {/* Progress to Transcendence */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-yellow-500" />
              Progress to Transcendence (3800+ ELO)
            </span>
            <span className="font-mono text-primary">{transcendenceProgress.toFixed(0)}%</span>
          </div>
          <Progress 
            value={transcendenceProgress} 
            className="h-2 [&>div]:bg-gradient-to-r [&>div]:from-purple-500 [&>div]:via-pink-500 [&>div]:to-yellow-500"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>3400 (Elite)</span>
            <span>3600 (SF17)</span>
            <span>3800+ (Beyond)</span>
          </div>
        </div>
        
        {/* Stockfish Version Reference */}
        <div className="p-3 bg-blue-500/5 rounded-lg border border-blue-500/20 space-y-2">
          <p className="text-xs font-medium text-blue-400 flex items-center gap-2">
            <Target className="h-3 w-3" />
            Stockfish 17 ELO Reference (TCEC/CCRL Calibrated)
          </p>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="text-center">
              <p className="font-mono text-blue-300">{STOCKFISH_17_ELO.cloud}</p>
              <p className="text-muted-foreground">Cloud API</p>
            </div>
            <div className="text-center">
              <p className="font-mono text-blue-300">{STOCKFISH_17_ELO.localDepth40}</p>
              <p className="text-muted-foreground">Depth 40</p>
            </div>
            <div className="text-center">
              <p className="font-mono text-blue-300">{STOCKFISH_17_ELO.unlimited}</p>
              <p className="text-muted-foreground">Unlimited</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
