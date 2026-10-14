import React from 'react';
import { Link } from 'react-router-dom';
import { Brain, TrendingUp, Activity, ChevronRight, FlaskConical } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useLiveChessStats } from '@/hooks/useLiveChessStats';

interface PredictionEdgeCardProps {
  totalMoves: number;
}

// Early middlegame: the move window where the audited EP edge over Stockfish is positive
const EDGE_ZONE_START = 11;
const EDGE_ZONE_END = 25;

/**
 * Stage 3 — the "depth reveal".
 * Surfaces En Pensent's live, data-integrity-safe prediction edge over Stockfish,
 * tied to this specific game's middlegame window. When the engine is offline /
 * recalibrating, it shows a neutral "calibrating" state instead of any invented numbers.
 *
 * Uses the safe framing confirmed with the founder: prediction accuracy in the quiet
 * middlegame — NOT a gameplay-Elo claim.
 */
export const PredictionEdgeCard: React.FC<PredictionEdgeCardProps> = ({ totalMoves }) => {
  const { data, isLoading } = useLiveChessStats();

  const isOffline = !data || data.totalPredictions === 0 || data.epAccuracy === 0;

  // Describe this game's overlap with the golden zone
  const zoneEnd = Math.min(EDGE_ZONE_END, totalMoves);
  const hasGoldenZone = totalMoves >= EDGE_ZONE_START;

  return (
    <div className="p-4 rounded-lg border border-primary/30 bg-gradient-to-br from-primary/10 via-transparent to-purple-500/10 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-sm uppercase tracking-wider text-primary flex items-center gap-2">
          <Brain className="h-4 w-4" />
          Prediction Intelligence
        </h3>
        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 text-[10px]">
          vs Stockfish
        </Badge>
      </div>

      {/* Tie the science to THIS game */}
      {hasGoldenZone ? (
        <p className="text-xs text-muted-foreground leading-relaxed">
          In this game's early middlegame <span className="text-foreground font-medium">(moves {EDGE_ZONE_START}–{zoneEnd})</span>,
          positions are balanced and an evaluation alone says least about the result — the window where
          En Pensent's prediction has measured ahead of Stockfish.
        </p>
      ) : (
        <p className="text-xs text-muted-foreground leading-relaxed">
          En Pensent's edge is concentrated in balanced positions, where an evaluation alone says least about the result.
        </p>
      )}

      {isLoading ? (
        <p className="text-xs text-muted-foreground font-serif py-2">Loading live engine data…</p>
      ) : isOffline ? (
        <div className="flex items-center gap-2 text-muted-foreground py-1">
          <Activity className="h-4 w-4 animate-pulse" />
          <p className="text-xs font-serif">
            Prediction engine <span className="text-foreground font-medium">calibrating</span> — live figures return shortly.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-2 rounded bg-background/50 border border-border/30">
            <p className="text-lg font-display font-bold text-gold-gradient tabular-nums">
              {data.epAccuracy.toFixed(1)}%
            </p>
            <p className="text-[9px] text-muted-foreground uppercase tracking-wide">EP Accuracy</p>
          </div>
          <div className="p-2 rounded bg-background/50 border border-border/30">
            <p className="text-lg font-display font-bold text-primary tabular-nums">
              {data.epEdge >= 0 ? '+' : ''}{data.epEdge.toFixed(2)}pp
            </p>
            <p className="text-[9px] text-muted-foreground uppercase tracking-wide">Overall vs SF</p>
          </div>
          <div className="p-2 rounded bg-background/50 border border-border/30">
            <p className="text-lg font-display font-bold text-foreground tabular-nums">
              {data.chess960Total > 0 ? `${data.chess960EP - data.chess960SF >= 0 ? '+' : ''}${(data.chess960EP - data.chess960SF).toFixed(1)}pp` : '—'}
            </p>
            <p className="text-[9px] text-muted-foreground uppercase tracking-wide">Chess960 vs SF</p>
          </div>
        </div>
      )}

      {/* Proof links for the skeptics */}
      <div className="flex items-center gap-4 pt-2 border-t border-border/30">
        <Link
          to="/benchmark"
          className="group inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-primary transition-colors"
        >
          <TrendingUp className="h-3 w-3" />
          Live benchmark
          <ChevronRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
        </Link>
        <Link
          to="/whitepaper"
          className="group inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-primary transition-colors"
        >
          <FlaskConical className="h-3 w-3" />
          Methodology
          <ChevronRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>
    </div>
  );
};

export default PredictionEdgeCard;
