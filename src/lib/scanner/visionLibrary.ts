import { supabase } from '@/integrations/supabase/client';
import { simulateGame, type SquareData } from '@/lib/chess/gameSimulator';
import { colorPalettes, type PieceType } from '@/lib/chess/pieceColors';
import { FAMOUS_GAMES_BENCHMARK } from '@/lib/chess/benchmark/famousGamesBenchmark';
import { generateGameHash } from '@/lib/visualizations/gameCanonical';
import { buildTemplate, type PaletteColors, type Template } from './visionFingerprint';

export interface VisionCandidate {
  key: string;
  kind: 'saved' | 'library';
  title: string;
  subtitle: string;
  paletteId: string;
  paletteName: string;
  pgn: string;
  gameHash: string;
  publicShareId?: string;
  visualizationId?: string;
}

export interface VisionLibrary {
  candidates: Map<string, VisionCandidate>;
  templates: Template[];
}

const PIECES: PieceType[] = ['k', 'q', 'r', 'b', 'n', 'p'];

function isCompletePalette(v: unknown): v is PaletteColors {
  const p = v as PaletteColors | undefined;
  return !!p && PIECES.every((k) => typeof p.white?.[k] === 'string' && typeof p.black?.[k] === 'string');
}

interface SavedRow {
  id: string;
  title: string | null;
  pgn: string | null;
  public_share_id: string | null;
  game_data: unknown;
}

function resolveSavedPalette(gameData: Record<string, unknown>): { id: string; name: string; colors: PaletteColors } | null {
  const raw = gameData.palette as string | { id?: string } | undefined;
  const id = typeof raw === 'string' ? raw : raw?.id;
  const vs = gameData.visualizationState as { customColors?: unknown } | undefined;
  if ((!id || id === 'custom') && isCompletePalette(vs?.customColors)) {
    return { id: 'custom', name: 'Custom', colors: vs!.customColors as PaletteColors };
  }
  const named = colorPalettes.find((p) => p.id === id && p.id !== 'custom');
  return named ? { id: named.id, name: named.name, colors: { white: named.white, black: named.black } } : null;
}

const boardCache = new Map<string, SquareData[][]>();
function boardFor(pgn: string): SquareData[][] | null {
  if (!boardCache.has(pgn)) {
    try {
      boardCache.set(pgn, simulateGame(pgn).board);
    } catch {
      return null;
    }
  }
  return boardCache.get(pgn) ?? null;
}

async function build(): Promise<VisionLibrary> {
  const candidates = new Map<string, VisionCandidate>();
  const templates: Template[] = [];
  const seen = new Set<string>();

  const add = (c: VisionCandidate, palette: PaletteColors) => {
    const identity = c.paletteId === 'custom' ? c.key : `${c.gameHash}:${c.paletteId}`;
    if (seen.has(identity)) return;
    const board = boardFor(c.pgn);
    if (!board) return;
    seen.add(identity);
    candidates.set(c.key, c);
    templates.push(buildTemplate(c.key, board, palette, c.gameHash));
  };

  const { data } = await supabase
    .from('saved_visualizations')
    .select('id, title, pgn, public_share_id, game_data')
    .not('public_share_id', 'is', null)
    .limit(2000);

  for (const row of (data || []) as SavedRow[]) {
    const gameData = (typeof row.game_data === 'string' ? JSON.parse(row.game_data) : row.game_data) as Record<string, unknown> | null;
    const pgn = row.pgn || (gameData?.pgn as string | undefined) || '';
    if (!pgn || !gameData) continue;
    const palette = resolveSavedPalette(gameData);
    if (!palette) continue;
    add({
      key: `saved:${row.id}`,
      kind: 'saved',
      title: row.title || 'Untitled Vision',
      subtitle: 'Saved vision',
      paletteId: palette.id,
      paletteName: palette.name,
      pgn,
      gameHash: generateGameHash(pgn),
      publicShareId: row.public_share_id || undefined,
      visualizationId: row.id,
    }, palette.colors);
  }

  const named = colorPalettes.filter((p) => p.id !== 'custom');
  for (const game of FAMOUS_GAMES_BENCHMARK) {
    for (const p of named) {
      add({
        key: `library:${game.id}:${p.id}`,
        kind: 'library',
        title: game.name,
        subtitle: `${game.white} vs ${game.black}, ${game.year}`,
        paletteId: p.id,
        paletteName: p.name,
        pgn: game.pgn,
        gameHash: generateGameHash(game.pgn),
      }, { white: p.white, black: p.black });
    }
  }

  return { candidates, templates };
}

let libraryPromise: Promise<VisionLibrary> | null = null;

/** Loads (once per session) every scannable vision and its fingerprint template. */
export function loadVisionLibrary(): Promise<VisionLibrary> {
  if (!libraryPromise) {
    libraryPromise = build().catch((err) => {
      libraryPromise = null;
      throw err;
    });
  }
  return libraryPromise;
}
