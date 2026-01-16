/**
 * Position Tracker Component
 * Live simulated $1000 positions with correlative data
 */

import React, { useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Target,
  ArrowUpRight,
  ArrowDownRight,
  XCircle,
  Activity,
  Link,
  Zap
} from 'lucide-react';
import { SimulatedPosition, PositionStats } from '@/hooks/useSimulatedPositions';
import { cn } from '@/lib/utils';

interface PositionTrackerProps {
  openPositions: SimulatedPosition[];
  closedPositions: SimulatedPosition[];
  stats: PositionStats;
  currentSymbol: string;
  currentPrice: number;
  correlatedPrices: Map<string, number>;
  onOpenPosition: (symbol: string, direction: 'long' | 'short', price: number, correlatedPrices: Map<string, number>) => void;
  onClosePosition: (positionId: string, closePrice: number) => void;
  onUpdatePosition: (positionId: string, currentPrice: number, correlatedPrices: Map<string, number>) => void;
}

export function PositionTracker({
  openPositions,
  closedPositions,
  stats,
  currentSymbol,
  currentPrice,
  correlatedPrices,
  onOpenPosition,
  onClosePosition,
  onUpdatePosition
}: PositionTrackerProps) {
  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Update open positions with latest prices
  useEffect(() => {
    if (openPositions.length === 0) return;
    
    openPositions.forEach(pos => {
      if (pos.symbol === currentSymbol) {
        onUpdatePosition(pos.id, currentPrice, correlatedPrices);
      }
    });
  }, [currentPrice, currentSymbol, openPositions, correlatedPrices, onUpdatePosition]);
  
  const handleOpenLong = useCallback(() => {
    onOpenPosition(currentSymbol, 'long', currentPrice, correlatedPrices);
  }, [currentSymbol, currentPrice, correlatedPrices, onOpenPosition]);
  
  const handleOpenShort = useCallback(() => {
    onOpenPosition(currentSymbol, 'short', currentPrice, correlatedPrices);
  }, [currentSymbol, currentPrice, correlatedPrices, onOpenPosition]);
  
  const formatPnl = (pnl: number) => {
    const formatted = Math.abs(pnl).toFixed(2);
    return pnl >= 0 ? `+$${formatted}` : `-$${formatted}`;
  };
  
  const formatPercent = (percent: number) => {
    const formatted = Math.abs(percent).toFixed(2);
    return percent >= 0 ? `+${formatted}%` : `-${formatted}%`;
  };

  const currentPosition = openPositions.find(p => p.symbol === currentSymbol);

  return (
    <div className="space-y-4">
      {/* Entry Controls */}
      <Card className="border-primary/20 bg-card/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-primary" />
            Simulated $1,000 Entry
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Current Symbol:</span>
            <Badge variant="outline" className="font-mono">{currentSymbol}</Badge>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Entry Price:</span>
            <span className="font-mono font-bold">${currentPrice.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Shares @ $1000:</span>
            <span className="font-mono">{(1000 / currentPrice).toFixed(4)}</span>
          </div>
          
          {!currentPosition ? (
            <div className="grid grid-cols-2 gap-2 pt-2">
              <Button 
                onClick={handleOpenLong}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <ArrowUpRight className="w-4 h-4 mr-1" />
                Long $1K
              </Button>
              <Button 
                onClick={handleOpenShort}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                <ArrowDownRight className="w-4 h-4 mr-1" />
                Short $1K
              </Button>
            </div>
          ) : (
            <Button 
              onClick={() => onClosePosition(currentPosition.id, currentPrice)}
              variant="destructive"
              className="w-full"
            >
              <XCircle className="w-4 h-4 mr-1" />
              Close Position
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Active Position with Correlative Data */}
      {currentPosition && (
        <Card className={cn(
          "border-2",
          currentPosition.pnl >= 0 ? "border-emerald-500/50 bg-emerald-950/20" : "border-red-500/50 bg-red-950/20"
        )}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary animate-pulse" />
                Live Position: {currentPosition.symbol}
                <Badge variant={currentPosition.direction === 'long' ? 'default' : 'destructive'}>
                  {currentPosition.direction.toUpperCase()}
                </Badge>
              </div>
              <span className={cn(
                "font-mono font-bold text-lg",
                currentPosition.pnl >= 0 ? "text-emerald-400" : "text-red-400"
              )}>
                {formatPnl(currentPosition.pnl)}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Main Position Stats */}
            <div className="grid grid-cols-3 gap-3 text-xs">
              <div className="p-2 bg-background/50 rounded">
                <div className="text-muted-foreground">Entry</div>
                <div className="font-mono font-bold">${currentPosition.entryPrice.toFixed(2)}</div>
              </div>
              <div className="p-2 bg-background/50 rounded">
                <div className="text-muted-foreground">Current</div>
                <div className="font-mono font-bold">${currentPosition.currentPrice.toFixed(2)}</div>
              </div>
              <div className="p-2 bg-background/50 rounded">
                <div className="text-muted-foreground">Return</div>
                <div className={cn(
                  "font-mono font-bold",
                  currentPosition.pnlPercent >= 0 ? "text-emerald-400" : "text-red-400"
                )}>
                  {formatPercent(currentPosition.pnlPercent)}
                </div>
              </div>
            </div>
            
            {/* Peak/Trough */}
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-emerald-400" />
                <span className="text-muted-foreground">Peak:</span>
                <span className="font-mono text-emerald-400">{formatPnl(currentPosition.peakPnl)}</span>
              </div>
              <div className="flex items-center gap-1">
                <TrendingDown className="w-3 h-3 text-red-400" />
                <span className="text-muted-foreground">Trough:</span>
                <span className="font-mono text-red-400">{formatPnl(currentPosition.troughPnl)}</span>
              </div>
            </div>

            {/* Correlative Assets */}
            {currentPosition.correlatedAssets.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Link className="w-3 h-3" />
                  Correlated Markets (if $1K was here instead)
                </div>
                <div className="space-y-1">
                  {currentPosition.correlatedAssets.map(asset => (
                    <div 
                      key={asset.symbol}
                      className={cn(
                        "flex items-center justify-between p-2 rounded text-xs",
                        asset.isAligned ? "bg-primary/10" : "bg-yellow-500/10"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-mono text-xs">
                          {asset.symbol}
                        </Badge>
                        <span className="text-muted-foreground truncate max-w-24">
                          {asset.name}
                        </span>
                        <span className={cn(
                          "text-xs px-1 rounded",
                          asset.correlation > 0 ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
                        )}>
                          {asset.correlation > 0 ? '+' : ''}{(asset.correlation * 100).toFixed(0)}%
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-muted-foreground">
                          ${asset.currentPrice.toFixed(2)}
                        </span>
                        <span className={cn(
                          "font-mono font-bold",
                          asset.hypotheticalPnl >= 0 ? "text-emerald-400" : "text-red-400"
                        )}>
                          {formatPnl(asset.hypotheticalPnl)}
                        </span>
                        {!asset.isAligned && (
                          <Zap className="w-3 h-3 text-yellow-400" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Session Stats */}
      <Card className="border-muted bg-card/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Target className="w-4 h-4 text-primary" />
            Session Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2 bg-background/50 rounded">
              <div className="text-muted-foreground">Total Trades</div>
              <div className="font-mono font-bold">{stats.totalTrades}</div>
            </div>
            <div className="p-2 bg-background/50 rounded">
              <div className="text-muted-foreground">Win Rate</div>
              <div className={cn(
                "font-mono font-bold",
                stats.winRate >= 50 ? "text-emerald-400" : "text-red-400"
              )}>
                {stats.winRate.toFixed(1)}%
              </div>
            </div>
            <div className="p-2 bg-background/50 rounded">
              <div className="text-muted-foreground">Total P&L</div>
              <div className={cn(
                "font-mono font-bold",
                stats.totalPnl >= 0 ? "text-emerald-400" : "text-red-400"
              )}>
                {formatPnl(stats.totalPnl)}
              </div>
            </div>
            <div className="p-2 bg-background/50 rounded">
              <div className="text-muted-foreground">Open P&L</div>
              <div className={cn(
                "font-mono font-bold",
                stats.currentOpenPnl >= 0 ? "text-emerald-400" : "text-red-400"
              )}>
                {formatPnl(stats.currentOpenPnl)}
              </div>
            </div>
            <div className="p-2 bg-background/50 rounded">
              <div className="text-muted-foreground">Best Trade</div>
              <div className="font-mono font-bold text-emerald-400">
                {formatPnl(stats.bestTrade)}
              </div>
            </div>
            <div className="p-2 bg-background/50 rounded">
              <div className="text-muted-foreground">Worst Trade</div>
              <div className="font-mono font-bold text-red-400">
                {formatPnl(stats.worstTrade)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Closed Positions */}
      {closedPositions.length > 0 && (
        <Card className="border-muted bg-card/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Recent Closed Positions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {closedPositions.slice(-5).reverse().map(pos => (
                <div 
                  key={pos.id}
                  className="flex items-center justify-between text-xs p-1 rounded bg-background/30"
                >
                  <div className="flex items-center gap-2">
                    <Badge variant={pos.direction === 'long' ? 'default' : 'destructive'} className="text-xs">
                      {pos.direction[0].toUpperCase()}
                    </Badge>
                    <span className="font-mono">{pos.symbol}</span>
                  </div>
                  <span className={cn(
                    "font-mono font-bold",
                    (pos.closePnl || 0) >= 0 ? "text-emerald-400" : "text-red-400"
                  )}>
                    {formatPnl(pos.closePnl || 0)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
