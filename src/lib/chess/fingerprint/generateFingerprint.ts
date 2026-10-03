/**
 * Chess Fingerprint Generator
 *
 * Aggregates a player's recent games into a "strategic fingerprint":
 * - Which archetypes they gravitate toward
 * - Where they over/under-perform relative to their own baseline
 * - A shareable style label and narrative
 *
 * Reuses simulateGame + extractColorFlowSignature per game — the same
 * pipeline as the single-game report, batched.
 */

import { simulateGame } from '../gameSimulator';
import {
  extractColorFlowSignature,
  ARCHETYPE_DEFINITIONS,
} from '../colorFlowAnalysis';
import type { StrategicArchetype } from '../colorFlowAnalysis';
import { importGames, ImportedGame, ImportSource } from '../gameImport';
import { getChessComArchives, fetchChessComArchive } from '../gameImport/chesscomApi';
import { fetchLichessGames, lichessGameToPgn } from '../gameImport/lichessApi';

// ===================== TYPES =====================

export type PlayerOutcome = 'win' | 'loss' | 'draw' | 'unknown';

export interface ArchetypeProfile {
  archetype: StrategicArchetype;
  name: string;
  games: number;
  share: number;
  wins: number;
  losses: number;
  draws: number;
  /** Win rate among decisive games (0-100). */
  winRate: number;
  /** Win rate delta vs the player's overall win rate (pp). */
  deltaVsBaseline: number;
}

export interface StyleIdentity {
  id: string;
  label: string;
  description: string;
}

/** One game in the player's form timeline (oldest -> newest). */
export interface FormEntry {
  archetype: StrategicArchetype;
  outcome: PlayerOutcome;
  opponent: string;
  userColor: 'white' | 'black';
  /** ISO date if derivable from PGN headers. */
  date: string | null;
}

export type BiasKind =
  | 'attacking'     // recent games skew sharp
  | 'positional'    // recent games skew squeeze/maneuver
  | 'technical'     // recent games skew clean/endgame
  | 'volatile'      // high intensity, no stable register
  | 'balanced';     // no dominant register

export interface PlayerBias {
  kind: BiasKind;
  label: string;
  /** Share of the dominant register inside the recent window (0-100). */
  conviction: number;
  description: string;
}

export type FormTrend = 'heating_up' | 'cooling' | 'steady';

export interface PlayerFingerprint {
  username: string;
  source: ImportSource;
  gamesAnalyzed: number;
  gamesSkipped: number;
  overallWinRate: number;
  drawRate: number;
  avgIntensity: number;
  dominantSide: 'white' | 'black' | 'contested';
  profile: ArchetypeProfile[];
  dominantArchetype: ArchetypeProfile | null;
  strengths: ArchetypeProfile[];
  weaknesses: ArchetypeProfile[];
  style: StyleIdentity;
  /** Oldest -> newest. Last ~15 analyzed games (display). */
  formTimeline: FormEntry[];
  /** Oldest -> newest. Every analyzed game (premium export). */
  fullTimeline: FormEntry[];
  bias: PlayerBias;
  trend: FormTrend;
  /** Actionable opponent-prep takeaways. */
  prepNotes: string[];
  narrative: string[];
}

// ===================== ARCHETYPE GROUPS =====================

const ATTACKING: StrategicArchetype[] = [
  'kingside_attack', 'sacrificial_attack', 'pawn_storm', 'opposite_castling',
  'sacrificial_kingside_assault', 'sacrificial_queenside_break', 'king_hunt',
  'kingside_coordinated_siege', 'queenside_coordinated_siege', 'tactical_melee',
  'kingside_rook_lift_blitz', 'kingside_knight_charge', 'kingside_bishop_battery',
  'pawn_storm_assault', 'center_kingside_break', 'open_tactical',
];

const POSITIONAL: StrategicArchetype[] = [
  'closed_maneuvering', 'positional_squeeze', 'prophylactic_defense',
  'queenside_expansion', 'central_domination', 'central_space_advantage',
  'structural_pressure', 'central_knight_outpost', 'central_bishop_cross',
  'central_pawn_roller', 'queenside_pressure', 'queenside_bishop_squeeze',
  'kingside_expansion', 'wing_play', 'middlegame_complexity',
];

const TECHNICAL: StrategicArchetype[] = [
  'endgame_technique', 'piece_harmony', 'bishop_pair_mastery',
  'knight_complex_superiority', 'rook_activity_maximum', 'rook_behind_passer',
  'passed_pawn_race', 'minor_piece_coordination', 'wing_bishop_deployment',
  'queenside_rook_majority', 'queenside_queen_seventh', 'rook_wing_domination',
  'development_focus',
];

function archetypeName(id: StrategicArchetype): string {
  const def = ARCHETYPE_DEFINITIONS[id];
  if (def) return def.name;
  return id
    .split('_')
    .map((w) => w.charCodeAt(0) + w.slice(1))
    .join(' ');
}

function userOutcome(result: string, userIsWhite: boolean): PlayerOutcome {
  if (result === '1-0') return userIsWhite ? 'win' : 'loss';
  if (result === '0-1') return userIsWhite ? 'loss' : 'win';
  if (result === '1/2-1/2' || result === '*') return 'draw';
  return 'unknown';
}

// ===================== STYLE IDENTITY =====================

function deriveStyle(profile: ArchetypeProfile[], avgIntensity: number): StyleIdentity {
  const share = (ids: StrategicArchetype[]) =>
    profile
      .filter((p) => ids.includes(p.archetype))
      .reduce((sum, p) => sum + p.share, 0);

  const attackingShare = share(ATTACKING);
  const positionalShare = share(POSITIONAL);
  const technicalShare = share(TECHNICAL);

  if (attackingShare >= 45) {
    return {
      id: 'aggressor',
      label: 'The Aggressor',
      description:
        'Your games gravitate toward direct attacks and sacrificial play. ' +
        'You take the fight to the enemy king early and often.',
    };
  }
  if (positionalShare >= 45) {
    return {
      id: 'strategist',
      label: 'The Strategist',
      description:
        'Your games build slowly — squeezes, maneuvers, and space advantages. ' +
        'You win by suffocation rather than force.',
    };
  }
  if (technicalShare >= 40) {
    return {
      id: 'technician',
      label: 'The Technician',
      description:
        'Your games resolve in cleaner technical positions — endgames, ' +
        'harmonious coordination, and precise conversion.',
    };
  }
  if (avgIntensity >= 55) {
    return {
      id: 'brawler',
      label: 'The Brawler',
      description:
        'Your games are chaotic — captures, checks, and constant tactical skirmishes. ' +
        'You thrive in positions where calculation matters more than plans.',
    };
  }
  if (avgIntensity <= 20) {
    return {
      id: 'counterpuncher',
      label: 'The Counterpuncher',
      description:
        'Your games stay quiet and restrained. You absorb pressure and win ' +
        'on the counter — or by out-waiting impatience.',
    };
  }
  return {
    id: 'versatile',
    label: 'The Shapeshifter',
    description:
      'No single pattern dominates your games — you adapt your strategic ' +
      'register to the position in front of you.',
  };
}

// ===================== BIAS / TREND / PREP =====================

interface BiasRecord {
  archetype: StrategicArchetype;
  outcome: PlayerOutcome;
  intensity: number;
}

const RECENT_WINDOW = 10;
const BIAS_THRESHOLD = 0.45;

function registerShare(list: BiasRecord[], ids: StrategicArchetype[]): number {
  if (list.length === 0) return 0;
  return list.filter((r) => ids.includes(r.archetype)).length / list.length;
}

/** Market-style bias for the player's most recent games. */
function deriveBias(records: BiasRecord[], avgIntensity: number): PlayerBias {
  const recent = records.slice(0, RECENT_WINDOW); // newest first
  const a = registerShare(recent, ATTACKING);
  const p = registerShare(recent, POSITIONAL);
  const t = registerShare(recent, TECHNICAL);
  const max = Math.max(a, p, t);
  const recentIntensity =
    recent.reduce((s, r) => s + r.intensity, 0) / Math.max(1, recent.length);

  if (max < BIAS_THRESHOLD && recentIntensity >= 55) {
    return {
      kind: 'volatile',
      label: 'Volatile',
      conviction: Math.round(max * 100),
      description:
        'No stable register — recent games swing between registers at high intensity. ' +
        'Expect chaos and calculate carefully.',
    };
  }
  if (max < BIAS_THRESHOLD) {
    return {
      kind: 'balanced',
      label: 'Balanced',
      conviction: Math.round(max * 100),
      description:
        'No dominant register right now — they adapt to whatever the position gives them.',
    };
  }
  if (a === max) {
    return {
      kind: 'attacking',
      label: 'Attacking Bias',
      conviction: Math.round(a * 100),
      description:
        'Recent games skew sharp — attacks, storms, and sacrificial breaks. ' +
        'Keep things slow and closed if you want to take them off their game.',
    };
  }
  if (p === max) {
    return {
      kind: 'positional',
      label: 'Positional Bias',
      conviction: Math.round(p * 100),
      description:
        'Recent games skew slow — squeezes, space, and maneuvering. ' +
        'They are patient right now; early imbalance may unsettle them.',
    };
  }
  return {
    kind: 'technical',
    label: 'Technical Bias',
    conviction: Math.round(t * 100),
    description:
      'Recent games resolve clean — endgames and precise conversion. ' +
      'Do not hand them a small edge; they know how to hold and grow it.',
  };
}

/** Win-rate movement: recent 8 games vs the 8 before. */
function deriveTrend(records: BiasRecord[]): FormTrend {
  if (records.length < 10) return 'steady';
  const recent = records.slice(0, 8);
  const prior = records.slice(8, 16);
  if (prior.length === 0) return 'steady';
  const rate = (list: BiasRecord[]) =>
    list.filter((r) => r.outcome === 'win').length / list.length;
  const delta = rate(recent) - rate(prior);
  if (delta >= 0.15) return 'heating_up';
  if (delta <= -0.15) return 'cooling';
  return 'steady';
}

function buildPrepNotes(
  profile: ArchetypeProfile[],
  records: BiasRecord[],
  username: string
): string[] {
  const notes: string[] = [];
  const significant = profile.filter((p) => p.games >= 3);

  const weakest = [...significant].sort(
    (a, b) => a.deltaVsBaseline - b.deltaVsBaseline
  )[0];
  if (weakest && weakest.deltaVsBaseline <= -10) {
    notes.push(
      `Steer into ${weakest.name} — ${username} converts only ${weakest.winRate.toFixed(0)}% ` +
        `of decisive games there (${Math.abs(weakest.deltaVsBaseline).toFixed(0)}pp below their norm).`
    );
  }

  const strongest = [...significant].sort(
    (a, b) => b.deltaVsBaseline - a.deltaVsBaseline
  )[0];
  if (strongest && strongest.deltaVsBaseline >= 10) {
    notes.push(
      `Avoid ${strongest.name} structures — ${username} wins ${strongest.winRate.toFixed(0)}% ` +
        `of decisive games there (+${strongest.deltaVsBaseline.toFixed(0)}pp above their norm).`
    );
  }

  const drawish = profile.find((p) => p.games >= 3 && p.draws / p.games > 0.35);
  if (drawish) {
    notes.push(
      `If it reaches ${drawish.name} territory, expect a grind — ` +
        `${((drawish.draws / drawish.games) * 100).toFixed(0)}% of those games are drawn.`
    );
  }

  const recentAttacking = registerShare(records.slice(0, RECENT_WINDOW), ATTACKING);
  if (recentAttacking >= 0.5) {
    notes.push(
      `Currently on a sharp streak — ${(recentAttacking * 100).toFixed(0)}% of their last ` +
        `${Math.min(RECENT_WINDOW, records.length)} games opened into attacking patterns. ` +
        `Preparing a solid, low-theory line will pay off.`
    );
  }

  return notes;
}

// ===================== NARRATIVE =====================

function buildNarrative(fp: Omit<PlayerFingerprint, 'narrative'>): string[] {
  const paragraphs: string[] = [];
  const { username, gamesAnalyzed, dominantArchetype, strengths, weaknesses, profile } = fp;

  if (!dominantArchetype) return paragraphs;

  paragraphs.push(
    `Across the last ${gamesAnalyzed} games, ${username} is ${fp.style.label.toLowerCase()} — ` +
      `${dominantArchetype.share.toFixed(0)}% of games resolve into ${dominantArchetype.name} patterns. ` +
      fp.style.description
  );

  if (strengths.length > 0) {
    const best = strengths[0];
    paragraphs.push(
      `Strongest territory: ${best.name}. In ${best.games} games, ${username} wins ` +
        `${best.winRate.toFixed(0)}% of the time — ${Math.abs(best.deltaVsBaseline).toFixed(0)} points ` +
        `above their overall rate.`
    );
  }

  if (weaknesses.length > 0) {
    const worst = weaknesses[0];
    paragraphs.push(
      `Danger zone: ${worst.name}. Only ${worst.winRate.toFixed(0)}% wins in ${worst.games} games ` +
        `— ${Math.abs(worst.deltaVsBaseline).toFixed(0)} points below baseline. ` +
        `Opponents who steer into this pattern have the edge.`
    );
  }

  const drawish = profile.filter((p) => p.draws / Math.max(1, p.games) > 0.3);
  if (drawish.length > 0) {
    paragraphs.push(
      `Watch for ${drawish[0].name} structures — they account for ${drawish[0].draws} ` +
        `of your ${Math.round(gamesAnalyzed * fp.drawRate / 100)} draws.`
    );
  }

  return paragraphs;
}

// ===================== MAIN =====================

/**
 * Generate a player's strategic fingerprint from their recent games.
 */
export async function generatePlayerFingerprint(
  username: string,
  source: ImportSource,
  maxGames = 30,
  prefetchedGames?: ImportedGame[]
): Promise<PlayerFingerprint> {
  const games = prefetchedGames ?? (await importGames(source, username, maxGames));
  if (games.length === 0) {
    throw new Error('No games found for this username.');
  }

  const cleanUsername = username.trim().replace(/^@/, '').toLowerCase();

  interface GameRecord {
    archetype: StrategicArchetype;
    outcome: PlayerOutcome;
    intensity: number;
    dominantSide: 'white' | 'black' | 'contested';
    opponent: string;
    userColor: 'white' | 'black';
    date: string | null;
  }

  const records: GameRecord[] = [];
  let skipped = 0;

  for (const game of games) {
    try {
      const sim = simulateGame(game.pgn);
      if (sim.totalMoves < 10) {
        skipped++;
        continue;
      }
      const sig = extractColorFlowSignature(sim.board, sim.gameData, sim.totalMoves);
      const userIsWhite =
        (game.white || '').toLowerCase() === cleanUsername ||
        (sim.gameData.white || '').toLowerCase() === cleanUsername;
      const outcome = userOutcome(sim.gameData.result, userIsWhite);
      if (outcome === 'unknown') {
        skipped++;
        continue;
      }
      const opponent = userIsWhite
        ? (game.black || sim.gameData.black || 'unknown')
        : (game.white || sim.gameData.white || 'unknown');
      const pgnDate = /\[Date\s+"([^"]+)"\]/.exec(game.pgn)?.[1] ?? null;
      records.push({
        archetype: sig.archetype,
        outcome,
        intensity: sig.intensity,
        dominantSide: sig.dominantSide,
        opponent,
        userColor: userIsWhite ? 'white' : 'black',
        date: pgnDate,
      });
    } catch {
      skipped++;
    }
  }

  if (records.length < 5) {
    throw new Error(`Only ${records.length} games could be analyzed — need at least 5 for a fingerprint.`);
  }

  const total = records.length;
  const wins = records.filter((r) => r.outcome === 'win').length;
  const draws = records.filter((r) => r.outcome === 'draw').length;
  const overallWinRate = (wins / total) * 100;
  const drawRate = draws / total;
  const avgIntensity = records.reduce((s, r) => s + r.intensity, 0) / total;

  const sideVotes = records.reduce(
    (acc, r) => {
      acc[r.dominantSide]++;
      return acc;
    },
    { white: 0, black: 0, contested: 0 }
  );
  const dominantSide =
    sideVotes.white >= sideVotes.black && sideVotes.white >= sideVotes.contested
      ? 'white'
      : sideVotes.black >= sideVotes.contested
        ? 'black'
        : 'contested';

  // Aggregate per archetype
  const byArchetype = new Map<StrategicArchetype, GameRecord[]>();
  for (const r of records) {
    const list = byArchetype.get(r.archetype) ?? [];
    list.push(r);
    byArchetype.set(r.archetype, list);
  }

  const profile: ArchetypeProfile[] = [...byArchetype.entries()]
    .map(([archetype, recs]) => {
      const w = recs.filter((r) => r.outcome === 'win').length;
      const l = recs.filter((r) => r.outcome === 'loss').length;
      const d = recs.filter((r) => r.outcome === 'draw').length;
      const decisive = w + l;
      const winRate = decisive > 0 ? (w / decisive) * 100 : 50;
      const baselineDecisive = records.filter((r) => r.outcome !== 'draw');
      const baselineRate = baselineDecisive.length > 0
        ? (wins / baselineDecisive.length) * 100
        : 50;
      return {
        archetype,
        name: archetypeName(archetype),
        games: recs.length,
        share: (recs.length / total) * 100,
        wins: w,
        losses: l,
        draws: d,
        winRate,
        deltaVsBaseline: winRate - baselineRate,
      };
    })
    .sort((a, b) => b.games - a.games);

  const MIN_GAMES_FOR_VERDICT = 3;
  const significant = profile.filter((p) => p.games >= MIN_GAMES_FOR_VERDICT);
  const strengths = significant.filter((p) => p.deltaVsBaseline >= 10);
  const weaknesses = significant.filter((p) => p.deltaVsBaseline <= -10);

  const style = deriveStyle(profile, avgIntensity);

  const toEntry = (r: GameRecord): FormEntry => ({
    archetype: r.archetype,
    outcome: r.outcome,
    opponent: r.opponent,
    userColor: r.userColor,
    date: r.date,
  });
  const fullTimeline = [...records].reverse().map(toEntry);
  const formTimeline = fullTimeline.slice(-15);

  const bias = deriveBias(records, avgIntensity);
  const trend = deriveTrend(records);
  const prepNotes = buildPrepNotes(profile, records, username);

  const partial: Omit<PlayerFingerprint, 'narrative'> = {
    username,
    source,
    gamesAnalyzed: total,
    gamesSkipped: skipped + (games.length - records.length - skipped),
    overallWinRate,
    drawRate,
    avgIntensity,
    dominantSide,
    profile,
    dominantArchetype: profile[0] ?? null,
    strengths,
    weaknesses,
    style,
    formTimeline,
    fullTimeline,
    bias,
    trend,
    prepNotes,
  };

  return { ...partial, narrative: buildNarrative(partial) };
}

// ===================== EXTENDED HISTORY (PREMIUM) =====================

const DEFAULT_HISTORY_LIMIT = 250;
const CHESSCOM_MONTH_CAP = 24; // newest N archive months

function parsePgnHeaders(pgn: string): Record<string, string> {
  const headers: Record<string, string> = {};
  const regex = /\[(\w+)\s+"([^"]*)"\]/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(pgn)) !== null) {
    headers[match[1]] = match[2];
  }
  return headers;
}

function pgnToImportedGame(pgn: string, id: string, source: string): ImportedGame {
  const h = parsePgnHeaders(pgn);
  return {
    id,
    white: h.White || 'White',
    black: h.Black || 'Black',
    result: h.Result || '',
    date: h.UTCDate || h.Date || '',
    event: h.Event || source,
    pgn,
  };
}

/**
 * Fetch an extended game history for a player — for premium full-history
 * fingerprints and CSV export. Chess.com: newest N archive months.
 * Lichess: single paginated request via the proxy (higher max).
 */
export async function fetchExtendedHistory(
  username: string,
  source: ImportSource,
  maxGames = DEFAULT_HISTORY_LIMIT
): Promise<ImportedGame[]> {
  const clean = username.trim().replace(/^@/, '');
  if (!clean) throw new Error('Please enter a username.');

  if (source === 'lichess') {
    const res = await fetchLichessGames(clean, { max: maxGames });
    return res.games.map((g, i) =>
      pgnToImportedGame(lichessGameToPgn(g), `lichess-ext-${i}`, 'lichess')
    );
  }

  // Chess.com — walk archives newest -> oldest until the cap
  const archives = await getChessComArchives(clean);
  const months = archives.slice(-CHESSCOM_MONTH_CAP).reverse();
  const out: ImportedGame[] = [];

  for (const monthUrl of months) {
    if (out.length >= maxGames) break;
    try {
      const games = await fetchChessComArchive(monthUrl);
      // Newest games last within each month — take most recent first
      for (const g of [...games].reverse()) {
        if (out.length >= maxGames) break;
        if (g.pgn) {
          out.push(pgnToImportedGame(g.pgn, `chesscom-${out.length}`, 'chess.com'));
        }
      }
    } catch {
      // A flaky archive month shouldn't kill the whole export
    }
  }

  return out;
}
