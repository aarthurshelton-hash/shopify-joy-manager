import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, BookOpen } from 'lucide-react';
import { useTimeline } from '@/contexts/TimelineContext';
import { buildMoveEvents, formatPly, type EventTone } from '@/lib/chess/moveEvents';
import type { GameAnalysis } from '@/lib/chess/chessAnalysis';

interface GameStoryPanelProps {
  pgn: string;
  totalMoves: number;
  gameAnalysis: GameAnalysis | null;
  white?: string;
  black?: string;
}

const DOT: Record<EventTone, string> = {
  gold: 'bg-[#d4af37]',
  crimson: 'bg-red-500',
  azure: 'bg-sky-400',
  neutral: 'bg-zinc-400',
};

export const GameStoryPanel: React.FC<GameStoryPanelProps> = ({
  pgn, totalMoves, gameAnalysis, white, black,
}) => {
  const { currentMove, setCurrentMove } = useTimeline();
  const [open, setOpen] = useState(true);
  const events = useMemo(
    () => Array.from(buildMoveEvents(pgn).values()).filter((e) => e.notable),
    [pgn],
  );
  const activeRef = useRef<HTMLButtonElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  const activePly = useMemo(() => {
    if (currentMove <= 0 || currentMove >= totalMoves) return currentMove >= totalMoves ? -1 : 0;
    return currentMove;
  }, [currentMove, totalMoves]);

  useEffect(() => {
    const el = activeRef.current;
    const list = listRef.current;
    if (!el || !list) return;
    list.scrollTo({ top: el.offsetTop - list.clientHeight / 2 + el.clientHeight / 2, behavior: 'smooth' });
  }, [activePly]);

  if (events.length === 0 && !gameAnalysis) return null;

  const mq = gameAnalysis?.moveQuality;
  const stats: { label: string; value: string }[] = [];
  if (gameAnalysis?.opening) stats.push({ label: 'Opening', value: gameAnalysis.opening.name });
  if (mq) {
    stats.push({ label: white || 'White', value: `${mq.whiteAccuracy}%` });
    stats.push({ label: black || 'Black', value: `${mq.blackAccuracy}%` });
  }
  if (gameAnalysis) {
    stats.push({ label: 'Checks', value: String(gameAnalysis.summary.checkCount) });
    stats.push({ label: 'Captures', value: String(gameAnalysis.summary.captureCount) });
  }

  return (
    <section className="rounded-xl border border-border/50 bg-card/60 backdrop-blur-sm overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2 font-display text-xs uppercase tracking-[0.2em] text-muted-foreground">
          <BookOpen className="h-4 w-4 text-primary" />
          Game story
          <span className="text-muted-foreground/60 normal-case tracking-normal">{events.length} key moments</span>
        </span>
        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="border-t border-border/40">
          {stats.length > 0 && (
            <dl className="grid grid-cols-2 gap-px bg-border/30 sm:grid-cols-3 lg:grid-cols-5">
              {stats.map((s) => (
                <div key={s.label} className="bg-card px-4 py-3">
                  <dt className="text-[10px] uppercase tracking-widest text-muted-foreground truncate">{s.label}</dt>
                  <dd className="mt-0.5 font-display text-sm text-foreground truncate">{s.value}</dd>
                </div>
              ))}
            </dl>
          )}

          <div ref={listRef} className="max-h-72 overflow-y-auto p-2">
            {events.map((e) => {
              const isActive = e.ply === activePly;
              return (
                <button
                  key={e.ply}
                  ref={isActive ? activeRef : undefined}
                  type="button"
                  onClick={() => setCurrentMove(e.ply)}
                  className={`flex w-full items-start gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-muted/50 ${
                    isActive ? 'bg-primary/10 ring-1 ring-primary/30' : ''
                  }`}
                >
                  <span className={`mt-1.5 h-2 w-2 flex-shrink-0 rounded-full ${DOT[e.tone]}`} />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-2">
                      <span className="text-sm font-medium text-foreground">{e.title}</span>
                      <span className="font-mono text-[11px] text-muted-foreground">{formatPly(e.ply, e.san)}</span>
                    </span>
                    <span className="block text-xs text-muted-foreground">{e.detail}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
};

export default GameStoryPanel;
