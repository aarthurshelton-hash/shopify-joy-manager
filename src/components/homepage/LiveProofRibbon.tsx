import React from 'react';
import { Link } from 'react-router-dom';
import { Activity, TrendingUp, ChevronRight } from 'lucide-react';
import { useLiveChessStats } from '@/hooks/useLiveChessStats';

// Formats large counts compactly (e.g. 12,400,000 -> 12.4M)
function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return `${n}`;
}

const Stat: React.FC<{ label: string; value: string; accent?: boolean }> = ({
  label,
  value,
  accent,
}) => (
  <div className="flex flex-col items-center px-4 sm:px-6">
    <span
      className={`font-display text-lg sm:text-2xl font-bold tabular-nums ${
        accent ? 'text-gold-gradient' : 'text-foreground'
      }`}
    >
      {value}
    </span>
    <span className="text-[9px] sm:text-[10px] uppercase tracking-widest text-muted-foreground text-center">
      {label}
    </span>
  </div>
);

/**
 * Live, data-integrity-safe proof ribbon.
 * Binds to real prediction data via useLiveChessStats. When the engine is
 * offline / recalibrating (no resolved predictions yet), it shows a neutral
 * "Calibrating" state rather than any fabricated numbers.
 */
export const LiveProofRibbon: React.FC = () => {
  const { data, isLoading } = useLiveChessStats();

  const isOffline = !data || data.totalPredictions === 0 || data.epAccuracy === 0;

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="rounded-2xl border border-primary/20 bg-card/60 backdrop-blur-sm px-4 py-4 sm:px-6 sm:py-5">
        {isLoading ? (
          <p className="text-center text-xs text-muted-foreground font-serif">
            Loading live engine data…
          </p>
        ) : isOffline ? (
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Activity className="h-4 w-4 animate-pulse" />
            <p className="text-xs sm:text-sm font-serif">
              Prediction engine <span className="text-foreground font-medium">calibrating</span> — live accuracy returns shortly.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-center gap-2 text-primary">
              <TrendingUp className="h-4 w-4" />
              <p className="text-[11px] sm:text-xs uppercase tracking-widest font-display">
                Live prediction edge over Stockfish
              </p>
            </div>
            <div className="flex items-center justify-center divide-x divide-border/50">
              <Stat label="Predictions Resolved" value={formatCount(data.totalPredictions)} />
              <Stat label="EP Accuracy" value={`${data.epAccuracy.toFixed(1)}%`} accent />
              <Stat label="vs Stockfish" value={`${data.epEdge >= 0 ? '+' : ''}${data.epEdge.toFixed(1)}pp`} accent />
              {data.epRecoveryRate > 0 && (
                <Stat label="Catches SF Misses" value={`${data.epRecoveryRate.toFixed(0)}%`} />
              )}
            </div>
            <div className="text-center">
              <Link
                to="/benchmark"
                className="group inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-primary transition-colors font-serif"
              >
                See the live benchmark &amp; methodology
                <ChevronRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveProofRibbon;
