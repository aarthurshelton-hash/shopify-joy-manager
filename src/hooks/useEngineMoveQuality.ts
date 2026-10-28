import { useEffect, useState } from 'react';
import { analyzeGameWithEngine } from '@/lib/chess/engineAnalysis';

export interface EngineMove {
  san: string;
  cpLoss: number;
  accuracy: number;
  bestMove: string;
  wasBestMove: boolean;
}

export interface EngineQualityState {
  status: 'idle' | 'queued' | 'running' | 'ready' | 'unavailable';
  progress: { current: number; total: number } | null;
  moves: EngineMove[] | null;
  whiteAccuracy: number | null;
  blackAccuracy: number | null;
  depth: number | null;
}

const IDLE: EngineQualityState = {
  status: 'idle', progress: null, moves: null, whiteAccuracy: null, blackAccuracy: null, depth: null,
};

const ANALYSIS_DEPTH = 12;
const MAX_CACHED = 12;

const STORE_PREFIX = 'ep_eng_v1_';
const STORE_INDEX = 'ep_eng_idx_v1';
const STORE_MAX = 40;

function pgnKey(pgn: string): string {
  let h = 5381;
  for (let i = 0; i < pgn.length; i++) h = ((h << 5) + h + pgn.charCodeAt(i)) | 0;
  return `${(h >>> 0).toString(36)}_${pgn.length}`;
}

function loadStored(pgn: string): EngineQualityState | null {
  try {
    const raw = localStorage.getItem(STORE_PREFIX + pgnKey(pgn));
    if (!raw) return null;
    const d = JSON.parse(raw) as { m: [string, number, number, string, number][]; w: number; b: number; d: number };
    return {
      status: 'ready',
      progress: null,
      moves: d.m.map(([san, cpLoss, accuracy, bestMove, best]) => ({
        san, cpLoss, accuracy, bestMove, wasBestMove: best === 1,
      })),
      whiteAccuracy: d.w,
      blackAccuracy: d.b,
      depth: d.d,
    };
  } catch {
    return null;
  }
}

function saveStored(pgn: string, s: EngineQualityState) {
  if (!s.moves) return;
  try {
    const key = pgnKey(pgn);
    const payload = {
      m: s.moves.map((m) => [m.san, Math.round(m.cpLoss), Math.round(m.accuracy * 10) / 10, m.bestMove, m.wasBestMove ? 1 : 0]),
      w: s.whiteAccuracy, b: s.blackAccuracy, d: s.depth,
    };
    localStorage.setItem(STORE_PREFIX + key, JSON.stringify(payload));
    const idx: string[] = JSON.parse(localStorage.getItem(STORE_INDEX) || '[]').filter((k: string) => k !== key);
    idx.push(key);
    while (idx.length > STORE_MAX) {
      const old = idx.shift();
      if (old) localStorage.removeItem(STORE_PREFIX + old);
    }
    localStorage.setItem(STORE_INDEX, JSON.stringify(idx));
  } catch {
    /* storage full or unavailable */
  }
}

const states = new Map<string, EngineQualityState>();
const listeners = new Set<(pgn: string) => void>();
let queue: Promise<void> = Promise.resolve();

function setState(pgn: string, next: EngineQualityState) {
  states.set(pgn, next);
  if (states.size > MAX_CACHED) {
    const oldest = states.keys().next().value;
    if (oldest !== undefined && oldest !== pgn) states.delete(oldest);
  }
  listeners.forEach((l) => l(pgn));
}

function start(pgn: string) {
  if (states.has(pgn)) return;
  const stored = loadStored(pgn);
  if (stored) {
    setState(pgn, stored);
    return;
  }
  setState(pgn, { ...IDLE, status: 'queued' });

  // The local engine is a singleton, so games are analysed one at a time.
  queue = queue.then(async () => {
    try {
      setState(pgn, { ...IDLE, status: 'running', progress: { current: 0, total: 0 } });
      const result = await analyzeGameWithEngine(pgn, {
        depth: ANALYSIS_DEPTH,
        onProgress: (current, total) =>
          setState(pgn, { ...IDLE, status: 'running', progress: { current, total } }),
      });
      if (!result.enginePowered) {
        setState(pgn, { ...IDLE, status: 'unavailable' });
        return;
      }
      const ready: EngineQualityState = {
        status: 'ready',
        progress: null,
        moves: result.moves.map((m) => ({
          san: m.san,
          cpLoss: m.engineAnalysis?.cpLoss ?? 0,
          accuracy: m.engineAnalysis?.accuracy ?? 100,
          bestMove: m.engineAnalysis?.bestMove ?? '',
          wasBestMove: m.engineAnalysis?.wasBestMove ?? false,
        })),
        whiteAccuracy: result.whiteAccuracy,
        blackAccuracy: result.blackAccuracy,
        depth: result.analysisDepth,
      };
      setState(pgn, ready);
      saveStored(pgn, ready);
    } catch (e) {
      console.warn('[EngineMoveQuality] analysis failed:', e);
      setState(pgn, { ...IDLE, status: 'unavailable' });
    }
  });
}

/**
 * Engine-backed move quality for a PGN. Results are shared and cached, so any
 * number of components can read the same analysis. Only the component that
 * passes `autoStart` triggers it, after a short delay so the board renders first.
 */
export function useEngineMoveQuality(pgn: string, autoStart = false): EngineQualityState {
  const [state, setLocal] = useState<EngineQualityState>(() => states.get(pgn) ?? IDLE);

  useEffect(() => {
    setLocal(states.get(pgn) ?? IDLE);
    const onChange = (changed: string) => {
      if (changed === pgn) setLocal(states.get(pgn) ?? IDLE);
    };
    listeners.add(onChange);

    let timer: number | undefined;
    if (autoStart && pgn && !states.has(pgn)) {
      timer = window.setTimeout(() => start(pgn), 1200);
    }
    return () => {
      listeners.delete(onChange);
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, [pgn, autoStart]);

  return state;
}
