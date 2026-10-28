import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, BookOpen, Play, Square, Link2, Check } from 'lucide-react';
import { useTimeline } from '@/contexts/TimelineContext';
import { buildMoveEvents, pickHighlights, formatPly, type EventTone } from '@/lib/chess/moveEvents';
import type { GameAnalysis } from '@/lib/chess/chessAnalysis';
import { useEngineMoveQuality } from '@/hooks/useEngineMoveQuality';

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

const STEP_MS = 3400;

export const GameStoryPanel: React.FC<GameStoryPanelProps> = ({
  pgn, totalMoves, gameAnalysis, white, black,
}) => {
  const { currentMove, setCurrentMove } = useTimeline();
  const [open, setOpen] = useState(true);
  const [tourIndex, setTourIndex] = useState<number | null>(null);
  const [copiedPly, setCopiedPly] = useState<number | null>(null);
  const engine = useEngineMoveQuality(pgn, true);
  const allEvents = useMemo(() => buildMoveEvents(pgn, engine.moves), [pgn, engine.moves]);
  const events = useMemo(() => Array.from(allEvents.values()).filter((e) => e.notable), [allEvents]);
  const highlights = useMemo(() => pickHighlights(allEvents, 8), [allEvents]);
  const activeRef = useRef<HTMLButtonElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const autoStarted = useRef(false);
  const deepLinked = useRef(false);

  const activePly = useMemo(() => {
    if (currentMove <= 0 || currentMove >= totalMoves) return currentMove >= totalMoves ? -1 : 0;
    return currentMove;
  }, [currentMove, totalMoves]);

  const touring = tourIndex !== null;

  const stopTour = useCallback(() => {
    setTourIndex(null);
    setCurrentMove(Infinity);
  }, [setCurrentMove]);

  useEffect(() => {
    if (tourIndex === null) return;
    const h = highlights[tourIndex];
    if (!h) {
      setTourIndex(null);
      setCurrentMove(Infinity);
      return;
    }
    setCurrentMove(h.ply);
    const timer = window.setTimeout(() => setTourIndex((i) => (i === null ? null : i + 1)), STEP_MS);
    return () => window.clearTimeout(timer);
  }, [tourIndex, highlights, setCurrentMove]);

  useEffect(() => () => setTourIndex(null), []);

  // ?highlights=1 starts the tour once the engine has either finished or given up.
  useEffect(() => {
    if (autoStarted.current || highlights.length === 0) return;
    if (engine.status !== 'ready' && engine.status !== 'unavailable') return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('highlights') !== '1') return;
    autoStarted.current = true;
    setTourIndex(0);
  }, [engine.status, highlights.length]);

  // ?move=N jumps straight to a shared moment.
  useEffect(() => {
    if (deepLinked.current || totalMoves <= 0) return;
    const raw = new URLSearchParams(window.location.search).get('move');
    const ply = raw ? parseInt(raw, 10) : NaN;
    if (!Number.isFinite(ply) || ply < 1 || ply > totalMoves) return;
    deepLinked.current = true;
    const t = window.setTimeout(() => setCurrentMove(ply), 600);
    return () => window.clearTimeout(t);
  }, [totalMoves, setCurrentMove]);

  useEffect(() => {
    const el = activeRef.current;
    const list = listRef.current;
    if (!el || !list) return;
    list.scrollTo({ top: el.offsetTop - list.clientHeight / 2 + el.clientHeight / 2, behavior: 'smooth' });
  }, [activePly]);

  const shareMoment = async (ply: number) => {
    const url = new URL(window.location.href);
    url.searchParams.set('move', String(ply));
    url.searchParams.delete('highlights');
    try {
      await navigator.clipboard.writeText(url.toString());
      setCopiedPly(ply);
      window.setTimeout(() => setCopiedPly((p) => (p === ply ? null : p)), 1800);
    } catch {
      window.prompt('Copy this link', url.toString());
    }
  };

  if (events.length === 0 && !gameAnalysis) return null;

  const stats: { label: string; value: string }[] = [];
  if (gameAnalysis?.opening) stats.push({ label: 'Opening', value: gameAnalysis.opening.name });
  if (engine.status === 'ready' && engine.whiteAccuracy !== null && engine.blackAccuracy !== null) {
    stats.push({ label: `${white || 'White'} accuracy`, value: `${engine.whiteAccuracy}%` });
    stats.push({ label: `${black || 'Black'} accuracy`, value: `${engine.blackAccuracy}%` });
  }
  const pct =
    engine.progress && engine.progress.total > 0
      ? Math.round((engine.progress.current / engine.progress.total) * 100)
      : 0;
  if (gameAnalysis) {
    stats.push({ label: 'Checks', value: String(gameAnalysis.summary.checkCount) });
    stats.push({ label: 'Captures', value: String(gameAnalysis.summary.captureCount) });
  }

  return (
    <section className="rounded-xl border border-border/50 bg-card/60 backdrop-blur-sm overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
          aria-expanded={open}
        >
          <BookOpen className="h-4 w-4 shrink-0 text-primary" />
          <span className="font-display text-xs uppercase tracking-[0.2em] text-muted-foreground">Game story</span>
          <span className="truncate text-xs text-muted-foreground/60">{events.length} key moments</span>
          <ChevronDown className={`ml-auto h-4 w-4 shrink-0 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
        {highlights.length > 0 && (
          <button
            type="button"
            onClick={() => (touring ? stopTour() : setTourIndex(0))}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-3 py-1.5 text-[11px] font-display uppercase tracking-wider text-primary transition-colors hover:bg-primary/20"
          >
            {touring ? <Square className="h-3 w-3" /> : <Play className="h-3 w-3" />}
            {touring ? `Stop ${Math.min((tourIndex ?? 0) + 1, highlights.length)}/${highlights.length}` : 'Play highlights'}
          </button>
        )}
      </div>

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

          {(engine.status === 'queued' || engine.status === 'running') && (
            <div className="px-4 py-2 border-b border-border/30">
              <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-muted-foreground">
                <span>Stockfish is checking every move</span>
                <span className="tabular-nums">{pct}%</span>
              </div>
              <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-muted/40">
                <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
              </div>
            </div>
          )}
          {engine.status === 'ready' && (
            <p className="px-4 py-2 text-[10px] uppercase tracking-widest text-muted-foreground/70 border-b border-border/30">
              Mistakes and blunders verified by Stockfish · depth {engine.depth}
            </p>
          )}
          {engine.status === 'unavailable' && (
            <p className="px-4 py-2 text-[11px] text-muted-foreground/70 border-b border-border/30">
              Engine unavailable on this device, so move-quality labels are hidden.
            </p>
          )}

          <div ref={listRef} className="max-h-72 overflow-y-auto p-2">
            {events.map((e) => {
              const isActive = e.ply === activePly;
              return (
                <div
                  key={e.ply}
                  className={`flex items-start gap-1 rounded-lg transition-colors hover:bg-muted/50 ${
                    isActive ? 'bg-primary/10 ring-1 ring-primary/30' : ''
                  }`}
                >
                  <button
                    ref={isActive ? activeRef : undefined}
                    type="button"
                    onClick={() => {
                      if (touring) setTourIndex(null);
                      setCurrentMove(e.ply);
                    }}
                    className="flex min-w-0 flex-1 items-start gap-3 px-3 py-2 text-left"
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
                  <button
                    type="button"
                    onClick={() => shareMoment(e.ply)}
                    title="Copy a link to this moment"
                    aria-label={`Copy link to move ${formatPly(e.ply, e.san)}`}
                    className="mr-2 mt-2 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    {copiedPly === e.ply ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Link2 className="h-3.5 w-3.5" />}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
};

export default GameStoryPanel;
