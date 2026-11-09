import { Chess, type Move } from 'chess.js';
import { classifyMoves } from './moveQuality';

/** Chess events that can be painted on the board. Colours are fixed across palettes. */
export type GameEventType =
  | 'checkmate'
  | 'promotion'
  | 'check'
  | 'castle'
  | 'enPassant'
  | 'capture'
  | 'sacrifice'
  | 'brilliant'
  | 'blunder';

export interface GameEvent {
  id: string;
  type: GameEventType;
  /** Board square, e.g. "e4" */
  square: string;
  /** Rook square for castling, so the two marks can be linked */
  linkedSquare?: string;
  /** Half-move index, 1-based: matches visit.moveNumber */
  moveNumber: number;
  color: 'w' | 'b';
  san: string;
  label: string;
}

export const EVENT_STYLE: Record<GameEventType, { color: string; name: string }> = {
  checkmate: { color: '#FBBF24', name: 'Checkmate' },
  promotion: { color: '#A855F7', name: 'Promotion' },
  check: { color: '#F59E0B', name: 'Check' },
  castle: { color: '#38BDF8', name: 'Castle' },
  enPassant: { color: '#FB7185', name: 'En passant' },
  capture: { color: '#EF4444', name: 'Capture' },
  sacrifice: { color: '#EC4899', name: 'Sacrifice' },
  brilliant: { color: '#22D3EE', name: 'Brilliant move' },
  blunder: { color: '#F97316', name: 'Blunder' },
};

/** Highest priority first; decides ring order when a square holds several events. */
export const EVENT_PRIORITY: GameEventType[] = [
  'checkmate', 'promotion', 'check', 'sacrifice', 'castle', 'enPassant', 'capture', 'brilliant', 'blunder',
];

const TYPE_NAME: Record<GameEventType, string> = {
  checkmate: 'Checkmate', promotion: 'Promotion', check: 'Check', castle: 'Castle',
  enPassant: 'En passant capture', capture: 'Capture', sacrifice: 'Sacrifice',
  brilliant: 'Brilliant move', blunder: 'Blunder',
};

function eventsForMove(move: Move, index: number, quality?: string): GameEvent[] {
  const moveNumber = index + 1;
  const base = { moveNumber, color: move.color, san: move.san };
  const make = (type: GameEventType, square: string, linkedSquare?: string): GameEvent => ({
    id: `${moveNumber}-${type}-${square}`,
    type,
    square,
    linkedSquare,
    label: `${Math.ceil(moveNumber / 2)}${move.color === 'w' ? '.' : '...'} ${move.san} — ${TYPE_NAME[type]}`,
    ...base,
  });

  const events: GameEvent[] = [];
  const flags = move.flags;

  if (flags.includes('k') || flags.includes('q')) {
    const rank = move.color === 'w' ? '1' : '8';
    const kingside = flags.includes('k');
    events.push(make('castle', move.to, `${kingside ? 'h' : 'a'}${rank}`));
  }
  if (flags.includes('p')) events.push(make('promotion', move.to));
  if (flags.includes('e')) {
    // The captured pawn sits beside the destination square, not on it.
    const captured = `${move.to[0]}${move.from[1]}`;
    events.push(make('enPassant', move.to, captured));
  } else if (flags.includes('c')) {
    events.push(make('capture', move.to));
  }
  if (move.san.includes('#')) events.push(make('checkmate', move.to));
  else if (move.san.includes('+')) events.push(make('check', move.to));

  if (quality === 'brilliant') events.push(make('brilliant', move.to));
  if (quality === 'blunder') events.push(make('blunder', move.to));

  return events;
}

/**
 * All notable events of a game, in play order. Empty for an unusable PGN.
 * `sacrifices` come from the quality classifier, which flags them separately.
 */
export function buildGameEvents(pgn: string | null | undefined): GameEvent[] {
  if (!pgn || !pgn.trim()) return [];
  try {
    const chess = new Chess();
    chess.loadPgn(pgn);
    const history = chess.history({ verbose: true });
    const classified = classifyMoves(pgn);
    const events: GameEvent[] = [];
    history.forEach((move, index) => {
      const info = classified[index];
      events.push(...eventsForMove(move, index, info?.quality));
      if (info?.isSacrifice && !events.some((e) => e.type === 'sacrifice' && e.moveNumber === index + 1)) {
        events.push({
          id: `${index + 1}-sacrifice-${move.to}`,
          type: 'sacrifice',
          square: move.to,
          moveNumber: index + 1,
          color: move.color,
          san: move.san,
          label: `${Math.ceil((index + 1) / 2)}${move.color === 'w' ? '.' : '...'} ${move.san} — Sacrifice`,
        });
      }
    });
    return events;
  } catch {
    return [];
  }
}

/** Events that have happened by the given half-move; -1 or a large number shows all. */
export function eventsUpTo(events: GameEvent[], currentMove: number, totalMoves: number): GameEvent[] {
  if (currentMove < 0 || currentMove >= totalMoves) return events;
  return events.filter((e) => e.moveNumber <= currentMove);
}

export interface SquareEvents {
  square: string;
  events: GameEvent[];
}

/** Group events by square, highest-priority event first, for nested ring rendering. */
export function groupEventsBySquare(events: GameEvent[], hidden: Set<GameEventType> = new Set()): SquareEvents[] {
  const bySquare = new Map<string, GameEvent[]>();
  for (const event of events) {
    if (hidden.has(event.type)) continue;
    const list = bySquare.get(event.square) || [];
    list.push(event);
    bySquare.set(event.square, list);
  }
  return [...bySquare.entries()].map(([square, list]) => ({
    square,
    events: list.sort((a, b) => EVENT_PRIORITY.indexOf(a.type) - EVENT_PRIORITY.indexOf(b.type)),
  }));
}

/** Convert "e4" to 0-based file/rank-from-top coordinates. */
export function squareToCoords(square: string): { file: number; rank: number } | null {
  if (!/^[a-h][1-8]$/.test(square)) return null;
  return { file: square.charCodeAt(0) - 97, rank: 8 - Number(square[1]) };
}
