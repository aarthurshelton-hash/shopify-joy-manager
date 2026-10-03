/**
 * Game Report Generator
 *
 * Produces an explainable, narrative post-game report from a PGN:
 * - Strategic archetype identity + evolution across game phases
 * - Corpus-backed outcome distribution for the detected archetype
 * - Whether the actual result followed or defied the historical pattern
 * - Key turning points from color-flow critical moments
 *
 * Reuses the existing simulation + color-flow pipeline; no new analysis
 * primitives are introduced here.
 */

import { simulateGame, truncateBoardToMove } from '../gameSimulator';
import {
  extractColorFlowSignature,
  ARCHETYPE_DEFINITIONS,
} from '../colorFlowAnalysis';
import type {
  ColorFlowSignature,
  StrategicArchetype,
  CriticalMoment,
} from '../colorFlowAnalysis';
import {
  loadArchetypeStats,
  getArchetypePrediction,
} from '../accuracy/archetypeHistoricalRates';

// ===================== TYPES =====================

export interface PhaseSnapshot {
  label: string;
  throughMove: number;
  archetype: StrategicArchetype;
  archetypeName: string;
  dominantSide: 'white' | 'black' | 'contested';
  intensity: number;
}

export interface ArchetypeTransition {
  fromArchetype: StrategicArchetype;
  toArchetype: StrategicArchetype;
  fromName: string;
  toName: string;
  aroundMove: number;
}

export interface CorpusOutlook {
  source: 'historical' | 'default';
  sampleSize: number;
  probabilities: { white: number; black: number; draw: number };
  modalOutcome: 'white_wins' | 'black_wins' | 'draw';
}

export type ResultAlignment = 'followed' | 'defied' | 'unknown';

export interface GameReport {
  white: string;
  black: string;
  result: string;
  event: string;
  date: string;
  totalMoves: number;
  finalArchetype: StrategicArchetype;
  finalArchetypeName: string;
  finalArchetypeDescription: string;
  dominantSide: 'white' | 'black' | 'contested';
  flowDirection: ColorFlowSignature['flowDirection'];
  intensity: number;
  phases: PhaseSnapshot[];
  transitions: ArchetypeTransition[];
  criticalMoments: CriticalMoment[];
  corpus: CorpusOutlook;
  resultAlignment: ResultAlignment;
  narrative: string[];
}

// ===================== HELPERS =====================

function phaseLabel(throughMove: number, totalMoves: number): string {
  if (throughMove <= 10) return 'Opening';
  if (throughMove <= 25) return 'Early middlegame';
  if (throughMove <= 45) return 'Late middlegame';
  if (throughMove >= totalMoves) return 'Final position';
  return 'Endgame';
}

function archetypeName(id: StrategicArchetype): string {
  const def = ARCHETYPE_DEFINITIONS[id];
  if (def) return def.name;
  // Enhanced archetypes without a definition entry: humanize the id
  return id
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function archetypeDescription(id: StrategicArchetype): string {
  return ARCHETYPE_DEFINITIONS[id]?.description ?? 'A distinctive strategic pattern';
}

function resultToOutcome(result: string): 'white_wins' | 'black_wins' | 'draw' | null {
  if (result === '1-0') return 'white_wins';
  if (result === '0-1') return 'black_wins';
  if (result === '1/2-1/2') return 'draw';
  return null;
}

function outcomeLabel(outcome: 'white_wins' | 'black_wins' | 'draw'): string {
  if (outcome === 'white_wins') return 'a White win';
  if (outcome === 'black_wins') return 'a Black win';
  return 'a draw';
}

function pct(p: number): string {
  return `${(p * 100).toFixed(0)}%`;
}

// ===================== NARRATIVE =====================

function buildNarrative(report: Omit<GameReport, 'narrative'>): string[] {
  const paragraphs: string[] = [];
  const {
    finalArchetypeName,
    finalArchetypeDescription,
    dominantSide,
    intensity,
    phases,
    transitions,
    criticalMoments,
    corpus,
    result,
    totalMoves,
    white,
    black,
  } = report;

  // 1. Identity
  const firstDetection = phases.find((p) => p.archetype === report.finalArchetype);
  const identityMove = firstDetection ? firstDetection.throughMove : totalMoves;
  const sideText =
    dominantSide === 'contested'
      ? 'Neither side fully owned the board — the territory stayed contested throughout.'
      : `${dominantSide === 'white' ? white || 'White' : black || 'Black'} drove the flow of the game.`;
  paragraphs.push(
    `By move ${identityMove}, this became a ${finalArchetypeName} game — ${finalArchetypeDescription.toLowerCase()}. ` +
      `${sideText} Overall activity intensity measured ${Math.round(intensity)}/100.`
  );

  // 2. Evolution
  if (transitions.length > 0) {
    const parts = transitions.map(
      (t) => `around move ${t.aroundMove} it shifted from ${t.fromName} to ${t.toName}`
    );
    paragraphs.push(
      `The game did not stay in one strategic register: ${parts.join('; ')}. ` +
        `Games that transform between patterns are harder to predict — and often more interesting to replay.`
    );
  }

  // 3. Corpus outlook
  if (corpus.source === 'historical' && corpus.sampleSize > 0) {
    paragraphs.push(
      `Across ${corpus.sampleSize.toLocaleString()} games with this pattern in the En Pensent corpus, ` +
        `White wins ${pct(corpus.probabilities.white)}, Black wins ${pct(corpus.probabilities.black)}, ` +
        `and ${pct(corpus.probabilities.draw)} end in a draw.`
    );
  } else {
    paragraphs.push(
      `Based on baseline rates for ${finalArchetypeName} games, the expected split is ` +
        `White ${pct(corpus.probabilities.white)}, Black ${pct(corpus.probabilities.black)}, ` +
        `draw ${pct(corpus.probabilities.draw)}.`
    );
  }

  // 4. Verdict
  const actual = resultToOutcome(result);
  if (actual) {
    const actualProb =
      actual === 'white_wins'
        ? corpus.probabilities.white
        : actual === 'black_wins'
          ? corpus.probabilities.black
          : corpus.probabilities.draw;
    if (actual === corpus.modalOutcome) {
      paragraphs.push(
        `The result (${result}) followed the pattern: ${outcomeLabel(actual)} is the most common outcome ` +
          `for ${finalArchetypeName} games.`
      );
    } else {
      paragraphs.push(
        `This game defied its pattern: it ended in ${outcomeLabel(actual)} (${result}), which happens in only ` +
          `${pct(actualProb)} of ${finalArchetypeName} games. The most common outcome is ${outcomeLabel(corpus.modalOutcome)}.`
      );
    }
  }

  // 5. Turning points
  if (criticalMoments.length > 0) {
    const top = [...criticalMoments]
      .sort((a, b) => b.shiftMagnitude - a.shiftMagnitude)
      .slice(0, 3)
      .sort((a, b) => a.moveNumber - b.moveNumber);
    const parts = top.map((m) => `move ${m.moveNumber} (${m.description})`);
    paragraphs.push(`The territorial balance shifted most sharply at ${parts.join(', ')}.`);
  }

  return paragraphs;
}

// ===================== MAIN =====================

/**
 * Generate a full explainable report for a single game.
 */
export async function generateGameReport(pgn: string): Promise<GameReport> {
  const trimmed = (pgn || '').trim();
  if (!trimmed) {
    throw new Error('No PGN provided.');
  }

  const simulation = simulateGame(trimmed);
  const { board, gameData, totalMoves } = simulation;

  if (totalMoves < 10) {
    throw new Error('Game is too short to analyze (need at least 10 moves).');
  }

  // Phase checkpoints: fixed strategic milestones plus the final position
  const checkpointMoves = [10, 20, 30, 45]
    .filter((m) => m < totalMoves)
    .concat([totalMoves]);

  const phases: PhaseSnapshot[] = checkpointMoves.map((throughMove) => {
    const truncated = throughMove >= totalMoves ? board : truncateBoardToMove(board, throughMove);
    const sig = extractColorFlowSignature(truncated, gameData, throughMove);
    return {
      label: phaseLabel(throughMove, totalMoves),
      throughMove,
      archetype: sig.archetype,
      archetypeName: archetypeName(sig.archetype),
      dominantSide: sig.dominantSide,
      intensity: sig.intensity,
    };
  });

  // Final (full-game) signature drives the headline identity
  const finalSignature = extractColorFlowSignature(board, gameData, totalMoves);

  // Archetype transitions between consecutive checkpoints
  const transitions: ArchetypeTransition[] = [];
  for (let i = 1; i < phases.length; i++) {
    const prev = phases[i - 1];
    const cur = phases[i];
    if (prev.archetype !== cur.archetype && prev.archetype !== 'unknown' && cur.archetype !== 'unknown') {
      transitions.push({
        fromArchetype: prev.archetype,
        toArchetype: cur.archetype,
        fromName: prev.archetypeName,
        toName: cur.archetypeName,
        aroundMove: cur.throughMove,
      });
    }
  }

  // Corpus-backed outcome distribution (falls back to defaults offline)
  let sampleSize = 0;
  try {
    const stats = await loadArchetypeStats();
    sampleSize = stats.get(finalSignature.archetype)?.totalGames ?? 0;
  } catch {
    // Offline / unauthenticated: default rates still work
  }
  const archetypePrediction = getArchetypePrediction(
    finalSignature.archetype,
    finalSignature.dominantSide
  );

  const corpus: CorpusOutlook = {
    source: archetypePrediction.source,
    sampleSize,
    probabilities: archetypePrediction.probabilities,
    modalOutcome: archetypePrediction.prediction,
  };

  const actual = resultToOutcome(gameData.result);
  const resultAlignment: ResultAlignment = !actual
    ? 'unknown'
    : actual === corpus.modalOutcome
      ? 'followed'
      : 'defied';

  const partial: Omit<GameReport, 'narrative'> = {
    white: gameData.white || 'White',
    black: gameData.black || 'Black',
    result: gameData.result || '*',
    event: gameData.event || '',
    date: gameData.date || '',
    totalMoves,
    finalArchetype: finalSignature.archetype,
    finalArchetypeName: archetypeName(finalSignature.archetype),
    finalArchetypeDescription: archetypeDescription(finalSignature.archetype),
    dominantSide: finalSignature.dominantSide,
    flowDirection: finalSignature.flowDirection,
    intensity: finalSignature.intensity,
    phases,
    transitions,
    criticalMoments: finalSignature.criticalMoments ?? [],
    corpus,
    resultAlignment,
  };

  return { ...partial, narrative: buildNarrative(partial) };
}
