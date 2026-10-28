import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { useTimeline } from '@/contexts/TimelineContext';
import { buildMoveEvents, formatPly, type EventTone, type MoveEvent } from '@/lib/chess/moveEvents';
import { useEngineMoveQuality } from '@/hooks/useEngineMoveQuality';

interface MoveEventOverlayProps {
  pgn: string;
  size: number;
  totalMoves: number;
}

const TONE_STYLES: Record<EventTone, { ring: string; glow: string; accent: string }> = {
  gold: { ring: 'rgba(212,175,55,0.95)', glow: 'rgba(212,175,55,0.35)', accent: '#d4af37' },
  crimson: { ring: 'rgba(220,38,38,0.95)', glow: 'rgba(220,38,38,0.30)', accent: '#ef4444' },
  azure: { ring: 'rgba(56,189,248,0.95)', glow: 'rgba(56,189,248,0.30)', accent: '#38bdf8' },
  neutral: { ring: 'rgba(212,212,216,0.9)', glow: 'rgba(212,212,216,0.25)', accent: '#d4d4d8' },
};

const STORAGE_KEY = 'ep_callouts';

function squareToXY(sq: string, size: number) {
  const border = size * 0.02;
  const cell = size / 8;
  const file = sq.charCodeAt(0) - 97;
  const rank = parseInt(sq[1], 10) - 1;
  return { x: border + file * cell, y: border + (7 - rank) * cell, cell };
}

export const MoveEventOverlay: React.FC<MoveEventOverlayProps> = ({ pgn, size, totalMoves }) => {
  const { currentMove, isPlaying } = useTimeline();
  const reduceMotion = useReducedMotion();
  const engine = useEngineMoveQuality(pgn, true);
  const events = useMemo(() => buildMoveEvents(pgn, engine.moves), [pgn, engine.moves]);
  const [enabled, setEnabled] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) !== 'off';
    } catch {
      return true;
    }
  });
  const [active, setActive] = useState<MoveEvent | null>(null);
  const previous = useRef<number | null>(null);

  useEffect(() => {
    const prev = previous.current;
    previous.current = currentMove;
    if (prev === null || prev === currentMove || !enabled) return;
    if (currentMove <= 0 || currentMove > totalMoves) {
      setActive(null);
      return;
    }
    const ev = events.get(currentMove);
    if (!ev || !ev.notable) {
      setActive(null);
      return;
    }
    setActive(ev);
    const timer = window.setTimeout(() => setActive(null), isPlaying ? 2200 : 4200);
    return () => window.clearTimeout(timer);
  }, [currentMove, enabled, events, isPlaying, totalMoves]);

  const toggle = () => {
    const next = !enabled;
    setEnabled(next);
    if (!next) setActive(null);
    try {
      localStorage.setItem(STORAGE_KEY, next ? 'on' : 'off');
    } catch {
      /* ignore */
    }
  };

  const style = active ? TONE_STYLES[active.tone] : null;
  const focus = active ? squareToXY(active.focusSquare, size) : null;
  const total = size * 1.04;

  let cardPos: React.CSSProperties = {};
  if (focus) {
    const cardWidth = Math.min(220, size * 0.55);
    const placeRight = focus.x + focus.cell + cardWidth + 8 <= total;
    const left = placeRight ? focus.x + focus.cell + 8 : Math.max(4, focus.x - cardWidth - 8);
    const top = Math.min(Math.max(4, focus.y - 4), total - 96);
    cardPos = { left, top, width: cardWidth };
  }

  return (
    <div
      data-html2canvas-ignore="true"
      className="absolute left-0 top-0 pointer-events-none"
      style={{ width: total, height: total }}
      aria-live="polite"
    >
      <AnimatePresence>
        {active && style && focus && (
          <>
            <motion.div
              key={`ring-${active.ply}`}
              initial={{ opacity: 0, scale: reduceMotion ? 1 : 1.35 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reduceMotion ? 0 : 0.25 }}
              className="absolute rounded-sm"
              style={{
                left: focus.x,
                top: focus.y,
                width: focus.cell,
                height: focus.cell,
                boxShadow: `0 0 0 2px ${style.ring}, 0 0 18px 4px ${style.glow}`,
              }}
            />
            <motion.div
              key={`card-${active.ply}`}
              initial={{ opacity: 0, x: reduceMotion ? 0 : -8, scale: reduceMotion ? 1 : 0.96 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.2 } }}
              transition={{ duration: reduceMotion ? 0 : 0.22, ease: 'easeOut' }}
              className="absolute rounded-lg border bg-black/85 px-3 py-2 text-left shadow-2xl backdrop-blur-md"
              style={{ ...cardPos, borderColor: `${style.accent}66` }}
            >
              <div className="flex items-center justify-between gap-2">
                <span
                  className="font-display text-[11px] font-bold uppercase tracking-[0.18em]"
                  style={{ color: style.accent }}
                >
                  {active.title}
                </span>
                <span className="font-mono text-[10px] text-white/50">{formatPly(active.ply, active.san)}</span>
              </div>
              <p className="mt-1 text-[11px] leading-snug text-white/80">{active.detail}</p>
              {active.engine && (
                <p className="mt-1 text-[9px] uppercase tracking-[0.18em] text-white/40">
                  Stockfish{engine.depth ? ` · depth ${engine.depth}` : ''}
                </p>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <button
        type="button"
        onClick={toggle}
        title={enabled ? 'Hide move callouts' : 'Show move callouts'}
        aria-pressed={enabled}
        className="pointer-events-auto absolute bottom-2 right-2 flex h-7 w-7 items-center justify-center rounded-full border border-white/20 bg-black/60 text-white/80 backdrop-blur transition hover:bg-black/80"
        style={{ opacity: enabled ? 1 : 0.55 }}
      >
        <Sparkles className="h-3.5 w-3.5" />
      </button>
    </div>
  );
};

export default MoveEventOverlay;
