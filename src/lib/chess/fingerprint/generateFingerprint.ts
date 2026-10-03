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
  maxGames = 30
): Promise<PlayerFingerprint> {
  const games = await importGames(source, username, maxGames);
  if (games.length === 0) {
    throw new Error('No games found for this username.');
  }

  const cleanUsername = username.trim().replace(/^@/, '').toLowerCase();

  interface GameRecord {
    archetype: StrategicArchetype;
    outcome: PlayerOutcome;
    intensity: number;
    dominantSide: 'white' | 'black' | 'contested';
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
      records.push({
        archetype: sig.archetype,
        outcome,
        intensity: sig.intensity,
        dominantSide: sig.dominantSide,
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
  };

  return { ...partial, narrative: buildNarrative(partial) };
}
