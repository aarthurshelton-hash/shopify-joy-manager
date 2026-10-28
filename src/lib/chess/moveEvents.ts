import { Chess, type Square } from 'chess.js';
import { analyzeTimeline } from './timelineAnalysis';
import type { MomentType } from '@/components/chess/EnhancedTimelineMarker';
import type { EngineMove } from '@/hooks/useEngineMoveQuality';

export type EventTone = 'gold' | 'crimson' | 'azure' | 'neutral';

export interface MoveEvent {
  ply: number;
  san: string;
  from: Square;
  to: Square;
  color: 'w' | 'b';
  type: MomentType;
  title: string;
  detail: string;
  tone: EventTone;
  focusSquare: Square;
  notable: boolean;
  engine: boolean;
}

const HEURISTIC_QUALITY: ReadonlySet<MomentType> = new Set<MomentType>([
  'brilliant', 'great', 'blunder', 'mistake', 'inaccuracy',
]);

const BLUNDER_CP = 200;
const MISTAKE_CP = 100;
const SOUND_CP = 30;

function engineQuality(ev: EngineMove): MomentType | null {
  if (ev.cpLoss >= BLUNDER_CP) return 'blunder';
  if (ev.cpLoss >= MISTAKE_CP) return 'mistake';
  return null;
}

function bestMoveSan(fenBefore: string, uci: string): string | null {
  if (!uci || uci.length < 4) return null;
  try {
    const c = new Chess(fenBefore);
    const m = c.move({
      from: uci.slice(0, 2) as Square,
      to: uci.slice(2, 4) as Square,
      promotion: uci.length > 4 ? uci[4] : undefined,
    });
    return m.san;
  } catch {
    return null;
  }
}

const PIECE_NAME: Record<string, string> = {
  p: 'pawn', n: 'knight', b: 'bishop', r: 'rook', q: 'queen', k: 'king',
};

const PRIORITY: Record<MomentType, number> = {
  checkmate: 100, brilliant: 95, sacrifice: 90, fork: 85, pin: 80, skewer: 78,
  discovery: 75, blunder: 70, great: 65, mistake: 60, promotion: 55,
  underpromotion: 54, en_passant: 50, check: 45, inaccuracy: 40, castling: 35, capture: 30,
};

const TITLES: Record<MomentType, string> = {
  checkmate: 'Checkmate', brilliant: 'Brilliant move', great: 'Strong move',
  blunder: 'Blunder', mistake: 'Mistake', inaccuracy: 'Inaccuracy',
  fork: 'Fork', pin: 'Pin', skewer: 'Skewer', discovery: 'Discovered attack',
  sacrifice: 'Sacrifice', en_passant: 'En passant', promotion: 'Promotion',
  underpromotion: 'Underpromotion', check: 'Check', castling: 'Castling', capture: 'Capture',
};

const TONES: Record<MomentType, EventTone> = {
  checkmate: 'crimson', brilliant: 'gold', great: 'gold', blunder: 'crimson',
  mistake: 'crimson', inaccuracy: 'neutral', fork: 'azure', pin: 'azure',
  skewer: 'azure', discovery: 'azure', sacrifice: 'gold', en_passant: 'azure',
  promotion: 'gold', underpromotion: 'gold', check: 'crimson', castling: 'neutral', capture: 'neutral',
};

const side = (c: 'w' | 'b') => (c === 'w' ? 'White' : 'Black');

function findKing(chess: Chess, color: 'w' | 'b'): Square | null {
  const rows = chess.board();
  for (let r = 0; r < 8; r++) {
    for (let f = 0; f < 8; f++) {
      const p = rows[r][f];
      if (p && p.type === 'k' && p.color === color) {
        return `${'abcdefgh'[f]}${8 - r}` as Square;
      }
    }
  }
  return null;
}

/**
 * Replays a PGN and attaches board squares to every analysed event, so the UI
 * can pop details up next to the action as the game plays. One event per ply,
 * the most significant. Index = ply (1-based).
 */
export function buildMoveEvents(pgn: string, engine?: EngineMove[] | null): Map<number, MoveEvent> {
  const out = new Map<number, MoveEvent>();
  if (!pgn || !pgn.trim()) return out;

  let history: ReturnType<Chess['history']>;
  try {
    const parsed = new Chess();
    parsed.loadPgn(pgn);
    history = parsed.history({ verbose: true });
  } catch {
    return out;
  }
  if (history.length === 0) return out;

  const sans = history.map((m) => m.san);
  let momentsByPly = new Map<number, ReturnType<typeof analyzeTimeline>['moments']>();
  try {
    const timeline = analyzeTimeline(pgn, sans);
    for (const m of timeline.moments) {
      const list = momentsByPly.get(m.moveNumber) || [];
      list.push(m);
      momentsByPly.set(m.moveNumber, list);
    }
  } catch {
    momentsByPly = new Map();
  }

  const replay = new Chess();
  history.forEach((mv, i) => {
    const ply = i + 1;
    const fenBefore = replay.fen();
    replay.move(mv.san);

    const eng = engine && engine[i] && engine[i].san === mv.san ? engine[i] : null;
    const all = momentsByPly.get(ply) || [];
    const heuristicBrilliant = all.some((m) => m.type === 'brilliant' || m.type === 'sacrifice');

    // Heuristic quality labels are guesses; only engine-verified ones are shown.
    const moments = all
      .filter((m) => !HEURISTIC_QUALITY.has(m.type))
      .filter((m) => m.type !== 'sacrifice' || !eng || eng.cpLoss <= SOUND_CP)
      .sort((a, b) => (PRIORITY[b.type] || 0) - (PRIORITY[a.type] || 0));

    let top = moments[0];
    let fromEngine = false;
    let engineDetail = '';
    if (eng) {
      const q = engineQuality(eng);
      if (q) {
        const best = bestMoveSan(fenBefore, eng.bestMove);
        const cost = (eng.cpLoss / 100).toFixed(1);
        engineDetail =
          `Costs about ${cost} pawns of evaluation.` + (best ? ` Engine preferred ${best}.` : '');
        if (!top || (PRIORITY[q] || 0) > (PRIORITY[top.type] || 0)) {
          top = { moveNumber: ply, type: q, move: mv.san, player: mv.color === 'w' ? 'white' : 'black' };
          fromEngine = true;
        }
      } else if (heuristicBrilliant && eng.cpLoss <= 10 && (!top || top.type !== 'checkmate')) {
        top = {
          moveNumber: ply, type: 'brilliant', move: mv.san, player: mv.color === 'w' ? 'white' : 'black',
        };
        fromEngine = true;
        engineDetail = 'A sacrifice that the engine confirms holds up.';
      }
    }
    if (!top) return;

    const enemy: 'w' | 'b' = mv.color === 'w' ? 'b' : 'w';
    const mover = PIECE_NAME[mv.piece] || 'piece';
    const captured = mv.captured ? PIECE_NAME[mv.captured] : null;

    let detail = fromEngine ? engineDetail : top.description || '';
    let focus: Square = mv.to;
    switch (top.type) {
      case 'checkmate':
        detail = `${side(mv.color)} mates on ${mv.to}.`;
        focus = findKing(replay, enemy) || mv.to;
        break;
      case 'check':
        detail = `${side(mv.color)}'s ${mover} gives check from ${mv.to}.`;
        focus = findKing(replay, enemy) || mv.to;
        break;
      case 'capture':
        detail = captured ? `${side(mv.color)}'s ${mover} takes the ${captured} on ${mv.to}.` : detail;
        break;
      case 'promotion':
      case 'underpromotion':
        detail = `${side(mv.color)}'s pawn promotes to a ${PIECE_NAME[mv.promotion || 'q']} on ${mv.to}.`;
        break;
      case 'castling':
        detail = `${side(mv.color)} castles ${mv.san.startsWith('O-O-O') ? 'queenside' : 'kingside'}.`;
        break;
      case 'en_passant':
        detail = `${side(mv.color)} captures en passant on ${mv.to}.`;
        break;
      default:
        break;
    }

    const bigCapture = top.type === 'capture' && !!mv.captured && mv.captured !== 'p';
    const notable =
      top.type !== 'capture' && top.type !== 'inaccuracy' && top.type !== 'castling'
        ? true
        : bigCapture;

    out.set(ply, {
      ply,
      san: mv.san,
      from: mv.from,
      to: mv.to,
      color: mv.color,
      type: top.type,
      title: TITLES[top.type],
      detail,
      tone: TONES[top.type],
      focusSquare: focus,
      notable,
      engine: fromEngine,
    });
  });

  return out;
}

export function formatPly(ply: number, san: string): string {
  const n = Math.ceil(ply / 2);
  return `${n}${ply % 2 === 1 ? '.' : '...'} ${san}`;
}
