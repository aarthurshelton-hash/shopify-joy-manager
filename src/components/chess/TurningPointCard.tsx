import React from 'react';
import { Zap, Copy } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ClassifiedMove, classifyMoves } from '@/lib/chess/moveQuality';

interface TurningPointCardProps {
  pgn?: string;
  white?: string;
  black?: string;
}

interface TurningPoint {
  move: ClassifiedMove;
  reason: string;
}

// Weight each quality by how much it signals a decisive swing in the game
const QUALITY_WEIGHT: Record<string, number> = {
  brilliant: 100,
  blunder: 90,
  great: 40,
  mistake: 35,
  inaccuracy: 15,
  best: 5,
  good: 2,
  book: 0,
};

/**
 * #3 — Auto "turning point" detection.
 * Picks the single most decisive moment using existing move classification:
 * the move with the strongest combination of quality signal and material swing.
 */
function computeTurningPoint(moves: ClassifiedMove[]): TurningPoint | null {
  if (!moves || moves.length === 0) return null;

  // A checkmate is the definitive end — treat it as the culminating moment only
  // if there's no earlier brilliant/blunder that decided the game.
  let best: ClassifiedMove | null = null;
  let bestScore = -1;

  for (const m of moves) {
    if (m.isCheckmate) continue; // handled as fallback below
    const qualityScore = QUALITY_WEIGHT[m.quality] ?? 0;
    const swing = Math.abs(m.materialChange || 0) / 100; // pawns
    const score = qualityScore + swing * 5;
    if (score > bestScore) {
      bestScore = score;
      best = m;
    }
  }

  // Fallback to the checkmate if nothing decisive was found earlier
  if (!best || bestScore <= 0) {
    const mate = moves.find((m) => m.isCheckmate);
    if (mate) return { move: mate, reason: 'the decisive checkmate' };
    return null;
  }

  const reasonMap: Record<string, string> = {
    brilliant: 'a brilliant sacrifice that shifted the game',
    blunder: 'the blunder that swung the evaluation',
    great: 'a great move that seized the initiative',
    mistake: 'the mistake that changed the balance',
    inaccuracy: 'an inaccuracy that shifted momentum',
  };
  return { move: best, reason: reasonMap[best.quality] || 'the pivotal moment' };
}

function formatMove(m: ClassifiedMove): string {
  return `${m.moveNumber}${m.color === 'w' ? '.' : '...'} ${m.san}`;
}

export const TurningPointCard: React.FC<TurningPointCardProps> = ({ pgn, white, black }) => {
  const turningPoint = React.useMemo(() => {
    if (!pgn) return null;
    try {
      return computeTurningPoint(classifyMoves(pgn));
    } catch {
      return null;
    }
  }, [pgn]);

  if (!turningPoint) return null;

  const { move, reason } = turningPoint;
  const player = move.color === 'w' ? white || 'White' : black || 'Black';
  const qualityLabel = move.info?.label ?? move.quality;

  const shareText = `${white || 'White'} vs ${black || 'Black'} turned at move ${move.moveNumber}: ${formatMove(move)} — ${qualityLabel}. Seen as art on En Pensent: ${typeof window !== 'undefined' ? window.location.href : 'enpensent.com'}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      toast.success('Turning-point insight copied!', { description: 'Share it anywhere.' });
    } catch {
      toast.error('Could not copy to clipboard');
    }
  };

  return (
    <div className="p-4 rounded-lg border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-transparent to-orange-500/10 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-sm uppercase tracking-wider text-amber-500 flex items-center gap-2">
          <Zap className="h-4 w-4" />
          The Turning Point
        </h3>
        <Badge
          variant="outline"
          className="text-[10px] border-amber-500/30 bg-amber-500/10 text-amber-500"
          style={{ color: move.info?.color }}
        >
          {move.info?.symbol} {qualityLabel}
        </Badge>
      </div>

      <p className="text-sm leading-relaxed">
        The game turned at{' '}
        <span className="font-display text-foreground">move {move.moveNumber}</span> —{' '}
        <span className="font-medium text-foreground">{player}</span>'s{' '}
        <span className="font-mono text-amber-500">{formatMove(move)}</span>, {reason}.
      </p>

      <div className="flex items-center justify-end">
        <Button variant="ghost" size="sm" onClick={handleCopy} className="gap-2 text-xs text-muted-foreground hover:text-amber-500">
          <Copy className="h-3.5 w-3.5" />
          Copy shareable insight
        </Button>
      </div>
    </div>
  );
};

export default TurningPointCard;
