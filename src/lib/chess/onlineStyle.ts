import type { Json } from '@/integrations/supabase/types';
import { supabase } from '@/integrations/supabase/client';
import type { ImportedGame, ImportSource } from './gameImport';
import type { GameTraits } from './gamePalette';
import { stickyPalette } from './gamePalette';
import type { PaletteId } from './pieceColors';
import {
  buildPlayerProfiles,
  foldGame,
  parseStyleGame,
  playerKey,
  sideTraitsOf,
  standardize,
  styleFromScores,
  type PlayerProfile,
  type StyleGame,
  type StyleState,
} from './playerStyle';
import { signaturePalette } from './signaturePalette';

/** When a game was played, from its PGN headers (UTC where available). */
export function gameMoment(pgn: string): string {
  const h = (k: string) => new RegExp(`\\[${k} "([^"]*)"\\]`).exec(pgn)?.[1] ?? '';
  const date = (h('UTCDate') || h('Date')).replace(/\./g, '-').replace(/\?/g, '0');
  const time = h('UTCTime') || h('StartTime') || '00:00:00';
  return /^\d{4}-\d{2}-\d{2}$/.test(date) ? `${date}T${time}Z` : '';
}

export function toStyleGames(platform: ImportSource, games: ImportedGame[]): StyleGame[] {
  return games.map((g) => {
    const at = gameMoment(g.pgn);
    return { id: g.id, pgn: g.pgn, white: g.white, black: g.black, year: Number(at.slice(0, 4)) || 0, at, platform };
  });
}

/** A player's evolving profile from their own recent online games. */
export function profileFromGames(platform: ImportSource, username: string, games: ImportedGame[]): PlayerProfile | null {
  return buildPlayerProfiles(toStyleGames(platform, games)).get(playerKey(username, platform)) ?? null;
}

// ---------- Premium: stored, incrementally evolving profiles ----------

export interface JourneyPoint {
  at: string;
  games: number;
  paletteId: PaletteId;
}

export interface StoredStyleProfile {
  id: string;
  platform: ImportSource;
  username: string;
  games: number;
  scores: GameTraits;
  paletteId: PaletteId;
  journey: JourneyPoint[];
  lastGameAt: string | null;
  signaturePaletteId: string | null;
}

type Row = {
  id: string;
  platform: string;
  username: string;
  games: number;
  scores: Json;
  palette_id: string;
  journey: Json;
  last_game_at: string | null;
  signature_palette_id: string | null;
};

const fromRow = (r: Row): StoredStyleProfile => ({
  id: r.id,
  platform: r.platform as ImportSource,
  username: r.username,
  games: r.games,
  scores: r.scores as unknown as GameTraits,
  paletteId: r.palette_id as PaletteId,
  journey: (r.journey as unknown as JourneyPoint[]) ?? [],
  lastGameAt: r.last_game_at,
  signaturePaletteId: r.signature_palette_id,
});

export async function listStoredProfiles(userId: string): Promise<StoredStyleProfile[]> {
  const { data, error } = await supabase.from('player_style_profiles').select('*').eq('user_id', userId).order('updated_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(fromRow);
}

/**
 * Folds any games newer than the stored profile into it (premium only; enforced by RLS),
 * records palette changes in the journey, and keeps the player's signature palette in saved_palettes.
 */
export async function updateStoredProfile(userId: string, platform: ImportSource, username: string, games: ImportedGame[]): Promise<StoredStyleProfile> {
  const name = username.trim().toLowerCase();
  const { data: existing, error: readErr } = await supabase
    .from('player_style_profiles')
    .select('*')
    .eq('user_id', userId)
    .eq('platform', platform)
    .eq('username', name)
    .maybeSingle();
  if (readErr) throw readErr;
  const prev = existing ? fromRow(existing) : null;

  const fresh = toStyleGames(platform, games)
    .filter((g) => g.at && (!prev?.lastGameAt || g.at > prev.lastGameAt))
    .sort((a, b) => (a.at ?? '').localeCompare(b.at ?? ''));

  let state: StyleState | null = prev ? { games: prev.games, scores: prev.scores } : null;
  const journey = [...(prev?.journey ?? [])];
  let lastGameAt = prev?.lastGameAt ?? null;
  let paletteId: PaletteId | undefined = prev?.paletteId;
  for (const g of fresh) {
    const side = g.white.toLowerCase() === name ? 'w' : g.black.toLowerCase() === name ? 'b' : null;
    if (!side) continue;
    const parsed = parseStyleGame(g.pgn);
    if (parsed.moves.length < 10) continue;
    state = foldGame(state, standardize(sideTraitsOf(parsed, side), parsed.speed));
    paletteId = stickyPalette(styleFromScores(state.scores), paletteId);
    if (journey[journey.length - 1]?.paletteId !== paletteId) journey.push({ at: g.at!, games: state.games, paletteId });
    lastGameAt = g.at!;
  }
  if (!state) throw new Error(`No games by ${username} to learn a style from.`);

  const style = styleFromScores(state.scores);
  const sig = signaturePalette(style, username);
  const sigRow = { name: sig.name, description: sig.description, white_colors: sig.white as unknown as Json, black_colors: sig.black as unknown as Json, user_id: userId, is_public: false };
  let signatureId = prev?.signaturePaletteId ?? null;
  if (signatureId) {
    const { error } = await supabase.from('saved_palettes').update(sigRow).eq('id', signatureId);
    if (error) throw error;
  } else {
    const { data, error } = await supabase.from('saved_palettes').insert(sigRow).select('id').single();
    if (error) throw error;
    signatureId = data.id;
  }

  const row = {
    user_id: userId,
    platform,
    username: name,
    games: state.games,
    scores: state.scores as unknown as Json,
    palette_id: paletteId ?? stickyPalette(style),
    journey: journey as unknown as Json,
    last_game_at: lastGameAt,
    signature_palette_id: signatureId,
    updated_at: new Date().toISOString(),
  };
  const { data, error } = await supabase.from('player_style_profiles').upsert(row, { onConflict: 'user_id,platform,username' }).select('*').single();
  if (error) throw error;
  return fromRow(data);
}
