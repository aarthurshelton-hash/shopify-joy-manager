import React, { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { format } from 'date-fns';
import { TrendingUp } from 'lucide-react';
import type { VisionValueHistory } from '@/lib/nfts/visionNftApi';

interface VisionValueChartProps {
  history: VisionValueHistory[];
  mintPrice: number;
  className?: string;
}

export const VisionValueChart: React.FC<VisionValueChartProps> = ({
  history,
  mintPrice,
  className = '',
}) => {
  const chartData = useMemo(() => {
    return history.map((h) => ({
      date: format(new Date(h.snapshot_date), 'MMM d'),
      fullDate: h.snapshot_date,
      floor: h.floor_price_cents / 100,
      mint: mintPrice / 100,
      print: (h.print_revenue_cents || 0) / 100,
      game: (h.gamecard_share_cents || 0) / 100,
      palette: (h.palette_share_cents || 0) / 100,
      opening: (h.opening_share_cents || 0) / 100,
      engagement: (h.engagement_cents || 0) / 100,
      trading: (h.trading_premium_cents || 0) / 100,
    }));
  }, [history, mintPrice]);

  const currentValue = history[history.length - 1]?.floor_price_cents || mintPrice;
  const gain = currentValue - mintPrice;
  const gainPercentage = mintPrice > 0 ? (gain / mintPrice) * 100 : 0;

  if (history.length < 2) {
    return (
      <div className={`p-4 text-center text-muted-foreground ${className}`}>
        <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>Not enough data yet. Check back tomorrow!</p>
        <p className="text-sm">Current floor: ${(currentValue / 100).toFixed(2)}</p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Stats Summary */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-3 bg-muted rounded-lg">
          <div className="text-xs text-muted-foreground">Total Appreciation</div>
          <div className={`text-lg font-bold ${gain >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {gain >= 0 ? '+' : ''}{(gain / 100).toFixed(2)} ({gainPercentage.toFixed(1)}%)
          </div>
        </div>
        <div className="p-3 bg-muted rounded-lg">
          <div className="text-xs text-muted-foreground">Value Sources</div>
          <div className="text-sm">
            {history[0]?.game_hype_score && `Game Hype: ${history[0].game_hype_score}/100`}
            {history[0]?.palette_scarcity && (
              <span className="ml-2">Scarcity: {history[0].palette_scarcity}</span>
            )}
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorFloor" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12 }}
              stroke="hsl(var(--muted-foreground))"
            />
            <YAxis
              tick={{ fontSize: 12 }}
              stroke="hsl(var(--muted-foreground))"
              tickFormatter={(value) => `$${value}`}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload || !payload.length) return null;
                const data = payload[0].payload;
                return (
                  <div className="bg-popover p-3 rounded-lg border shadow-lg">
                    <p className="font-medium mb-2">{data.fullDate}</p>
                    <div className="space-y-1 text-sm">
                      <p className="text-primary font-semibold">
                        Floor: ${data.floor.toFixed(2)}
                      </p>
                      {data.print > 0 && (
                        <p className="text-muted-foreground">Prints: +${data.print.toFixed(2)}</p>
                      )}
                      {data.game > 0 && (
                        <p className="text-muted-foreground">Game: +${data.game.toFixed(2)}</p>
                      )}
                      {data.palette > 0 && (
                        <p className="text-muted-foreground">Palette: +${data.palette.toFixed(2)}</p>
                      )}
                      {data.opening > 0 && (
                        <p className="text-muted-foreground">Opening: +${data.opening.toFixed(2)}</p>
                      )}
                    </div>
                  </div>
                );
              }}
            />
            <ReferenceLine
              y={mintPrice / 100}
              stroke="hsl(var(--muted-foreground))"
              strokeDasharray="3 3"
              label={{ value: 'Mint', position: 'insideBottomLeft', fontSize: 10 }}
            />
            <Area
              type="monotone"
              dataKey="floor"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorFloor)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-primary" />
          <span>Floor Price</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-0.5 bg-muted-foreground" />
          <span>Mint Price</span>
        </div>
      </div>
    </div>
  );
};

export default VisionValueChart;
