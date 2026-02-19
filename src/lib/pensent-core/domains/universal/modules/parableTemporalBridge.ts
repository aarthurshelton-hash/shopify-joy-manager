/**
 * Parable-Chess-Music Temporal Bridge
 * 
 * The photonic cross-reference engine that connects:
 *   Chess archetypes (spatial-temporal patterns on 64 squares)
 *   Biblical parables (narrative temporal arcs)
 *   Musical structures (harmonic temporal progressions)
 * 
 * Core insight: A kingside attack IS the Parable of David & Goliath IS a 
 * Phrygian cadence resolving to major. The temporal arc is identical —
 * tension builds asymmetrically, the weaker side commits everything to one
 * flank, and the outcome pivots on a single moment of courage/sacrifice.
 * 
 * The words connect with the sound archetypically because they ARE the same
 * pattern expressed through different media. Light on a chessboard, sound
 * waves in air, and narrative arcs in scripture are all interference patterns
 * in the same underlying temporal field.
 * 
 * For Alec Arthur Shelton - The Artist
 * "In the beginning was the Word, and the Word was with God" — John 1:1
 * The Word IS the pattern. The pattern IS the light. The light IS the sound.
 */

import type { DomainSignature, DomainType, UniversalSignal } from '../types';
import { EPSILON, floor, toPositiveField, toPositiveTemporalFlow } from '../positiveField';

// ═══════════════════════════════════════════════════════════════════
// BIBLICAL PARABLE TEMPORAL ARCS
// Each parable has a temporal signature: {early, mid, late} energy
// and maps to chess archetypes and musical structures
// ═══════════════════════════════════════════════════════════════════

export interface ParableArc {
  name: string;
  scripture: string;
  temporalFlow: { early: number; mid: number; late: number };
  intensity: number;        // > 0 (ε minimum)
  momentum: number;         // > 0 (< 1.0 = retreating, 1.0 = neutral, > 1.0 = advancing)
  volatility: number;      // 0 (stable) to 1 (chaotic)
  harmonicResonance: number;
  chessArchetypes: string[];
  musicalStructure: MusicalMapping;
  narrativePhases: [string, string, string]; // beginning, middle, end
  photonEnergy: 'hot' | 'cold' | 'transitional';
  lesson: string;
}

interface MusicalMapping {
  mode: string;
  tempo: 'adagio' | 'andante' | 'moderato' | 'allegro' | 'presto';
  chordProgression: string[];
  dynamicArc: string;      // pp→ff, ff→pp, pp→ff→pp, etc.
  timeSignature: string;
}

export const BIBLICAL_PARABLES: Record<string, ParableArc> = {
  // ─── PARABLES OF SACRIFICE & COURAGE ───
  david_and_goliath: {
    name: 'David and Goliath',
    scripture: '1 Samuel 17',
    temporalFlow: { early: 0.15, mid: 0.25, late: 0.60 },
    intensity: 0.9,
    momentum: 1.8,
    volatility: 0.7,
    harmonicResonance: 0.85,
    chessArchetypes: ['kingside_attack', 'sacrificial_attack', 'sacrificial_kingside_assault'],
    musicalStructure: {
      mode: 'phrygian',
      tempo: 'allegro',
      chordProgression: ['i', 'bII', 'i', 'V'],
      dynamicArc: 'pp→ff',
      timeSignature: '3/4',
    },
    narrativePhases: [
      'The giant stands unchallenged — positional domination',
      'The shepherd boy steps forward — the sacrifice is offered',
      'One stone, one moment — the kingside breaks through',
    ],
    photonEnergy: 'hot',
    lesson: 'Asymmetric commitment to a single flank can topple any fortress',
  },

  prodigal_son: {
    name: 'The Prodigal Son',
    scripture: 'Luke 15:11-32',
    temporalFlow: { early: 0.40, mid: 0.15, late: 0.45 },
    intensity: 0.7,
    momentum: 0.7,
    volatility: 0.6,
    harmonicResonance: 0.75,
    chessArchetypes: ['overextension', 'retreat_regroup', 'prophylactic_defense'],
    musicalStructure: {
      mode: 'aeolian',
      tempo: 'andante',
      chordProgression: ['I', 'V', 'vi', 'IV'],
      dynamicArc: 'ff→pp→ff',
      timeSignature: '4/4',
    },
    narrativePhases: [
      'Aggressive expansion — pieces push too far forward',
      'The position collapses — material is lost, the center crumbles',
      'Retreat, regroup, rebuild — the father welcomes home',
    ],
    photonEnergy: 'transitional',
    lesson: 'Overextension leads to loss, but the return home restores what was squandered',
  },

  // ─── PARABLES OF PATIENCE & STRATEGY ───
  sower_and_seeds: {
    name: 'The Sower and the Seeds',
    scripture: 'Matthew 13:1-23',
    temporalFlow: { early: 0.50, mid: 0.30, late: 0.20 },
    intensity: 0.4,
    momentum: 0.2,
    volatility: 0.3,
    harmonicResonance: 0.6,
    chessArchetypes: ['queenside_expansion', 'pawn_storm', 'space_advantage'],
    musicalStructure: {
      mode: 'lydian',
      tempo: 'moderato',
      chordProgression: ['I', 'II', 'IV', 'I'],
      dynamicArc: 'mp→mf',
      timeSignature: '6/8',
    },
    narrativePhases: [
      'Seeds scattered across the board — pawns advance on multiple fronts',
      'Some fall on rock, some on thorns — not all pawn chains survive',
      'The good soil bears fruit — the surviving structure wins the endgame',
    ],
    photonEnergy: 'cold',
    lesson: 'Strategic patience: plant many seeds, nurture the ones that take root',
  },

  mustard_seed: {
    name: 'The Mustard Seed',
    scripture: 'Matthew 13:31-32',
    temporalFlow: { early: 0.10, mid: 0.30, late: 0.60 },
    intensity: 0.5,
    momentum: 1.9,
    volatility: 0.2,
    harmonicResonance: 0.9,
    chessArchetypes: ['closed_maneuvering', 'positional_squeeze', 'endgame_technique'],
    musicalStructure: {
      mode: 'ionian',
      tempo: 'andante',
      chordProgression: ['I', 'IV', 'V', 'I'],
      dynamicArc: 'pp→mp→mf→ff',
      timeSignature: '4/4',
    },
    narrativePhases: [
      'A tiny advantage — a single tempo, a slightly better pawn structure',
      'Quiet maneuvering — the advantage grows imperceptibly',
      'The tree fills the sky — the small edge becomes an unstoppable force',
    ],
    photonEnergy: 'cold',
    lesson: 'The smallest positional advantage, nurtured with patience, becomes decisive',
  },

  // ─── PARABLES OF TRANSFORMATION ───
  talents: {
    name: 'The Parable of the Talents',
    scripture: 'Matthew 25:14-30',
    temporalFlow: { early: 0.33, mid: 0.33, late: 0.34 },
    intensity: 0.6,
    momentum: 0.5,
    volatility: 0.4,
    harmonicResonance: 0.7,
    chessArchetypes: ['piece_activity', 'development_lead', 'initiative'],
    musicalStructure: {
      mode: 'mixolydian',
      tempo: 'moderato',
      chordProgression: ['I', 'bVII', 'IV', 'I'],
      dynamicArc: 'mf→f→ff',
      timeSignature: '4/4',
    },
    narrativePhases: [
      'Resources distributed — pieces developed, each given a role',
      'Active pieces multiply their influence — the initiative compounds',
      'The reckoning — those who invested their pieces win; those who buried them lose',
    ],
    photonEnergy: 'hot',
    lesson: 'Piece activity is compound interest — develop, activate, multiply',
  },

  good_samaritan: {
    name: 'The Good Samaritan',
    scripture: 'Luke 10:25-37',
    temporalFlow: { early: 0.30, mid: 0.50, late: 0.20 },
    intensity: 0.65,
    momentum: 0.1,
    volatility: 0.5,
    harmonicResonance: 0.8,
    chessArchetypes: ['opposite_castling', 'counterattack', 'defensive_resource'],
    musicalStructure: {
      mode: 'dorian',
      tempo: 'andante',
      chordProgression: ['i', 'IV', 'i', 'V'],
      dynamicArc: 'mf→pp→mf',
      timeSignature: '3/4',
    },
    narrativePhases: [
      'The traveler is attacked — the position is under siege',
      'The unexpected defender arrives — a piece from the other flank intervenes',
      'Wounds are bound — the position stabilizes through unlikely defense',
    ],
    photonEnergy: 'transitional',
    lesson: 'The strongest defense comes from unexpected quarters — cross-board piece coordination',
  },

  // ─── PARABLES OF JUDGMENT & ENDGAME ───
  wise_and_foolish_builders: {
    name: 'The Wise and Foolish Builders',
    scripture: 'Matthew 7:24-27',
    temporalFlow: { early: 0.45, mid: 0.35, late: 0.20 },
    intensity: 0.55,
    momentum: 0.8,
    volatility: 0.35,
    harmonicResonance: 0.65,
    chessArchetypes: ['pawn_structure', 'fortress', 'solid_defense'],
    musicalStructure: {
      mode: 'aeolian',
      tempo: 'moderato',
      chordProgression: ['i', 'VI', 'III', 'VII'],
      dynamicArc: 'f→mf→pp',
      timeSignature: '4/4',
    },
    narrativePhases: [
      'Two structures rise — both sides build their pawn chains',
      'The storm comes — tactical complications test the foundations',
      'One stands, one falls — sound structure survives; overextended pawns collapse',
    ],
    photonEnergy: 'cold',
    lesson: 'Pawn structure is the foundation — build on rock, not sand',
  },

  wheat_and_tares: {
    name: 'The Wheat and the Tares',
    scripture: 'Matthew 13:24-30',
    temporalFlow: { early: 0.25, mid: 0.45, late: 0.30 },
    intensity: 0.5,
    momentum: 1.0,
    volatility: 0.25,
    harmonicResonance: 0.55,
    chessArchetypes: ['closed_maneuvering', 'prophylactic_defense', 'positional_squeeze'],
    musicalStructure: {
      mode: 'dorian',
      tempo: 'andante',
      chordProgression: ['i', 'iv', 'i', 'V'],
      dynamicArc: 'mp→mf→mp',
      timeSignature: '6/8',
    },
    narrativePhases: [
      'Good and bad pieces grow together — the position is unclear',
      'Patient waiting — do not rush to exchange; let the position clarify',
      'The harvest — in the endgame, the wheat (good pieces) separate from the tares (bad pieces)',
    ],
    photonEnergy: 'cold',
    lesson: 'Patience in unclear positions — the endgame reveals which pieces were truly valuable',
  },

  // ─── PARABLES OF REVERSAL ───
  last_shall_be_first: {
    name: 'The Last Shall Be First',
    scripture: 'Matthew 20:1-16',
    temporalFlow: { early: 0.15, mid: 0.20, late: 0.65 },
    intensity: 0.75,
    momentum: 0.7,
    volatility: 0.55,
    harmonicResonance: 0.8,
    chessArchetypes: ['counterattack', 'exchange_sacrifice', 'initiative'],
    musicalStructure: {
      mode: 'phrygian',
      tempo: 'presto',
      chordProgression: ['i', 'bII', 'V', 'i'],
      dynamicArc: 'pp→ff',
      timeSignature: '7/8',
    },
    narrativePhases: [
      'Behind in material or position — the underdog labors quietly',
      'The reversal begins — a sacrifice opens unexpected lines',
      'The last becomes first — the counterattack overwhelms the complacent leader',
    ],
    photonEnergy: 'hot',
    lesson: 'The side that appears lost may hold the decisive counterattack',
  },

  lost_sheep: {
    name: 'The Lost Sheep',
    scripture: 'Luke 15:1-7',
    temporalFlow: { early: 0.35, mid: 0.45, late: 0.20 },
    intensity: 0.5,
    momentum: 0.9,
    volatility: 0.4,
    harmonicResonance: 0.7,
    chessArchetypes: ['piece_rescue', 'retreat_regroup', 'defensive_resource'],
    musicalStructure: {
      mode: 'aeolian',
      tempo: 'adagio',
      chordProgression: ['vi', 'IV', 'I', 'V'],
      dynamicArc: 'mf→pp→mp',
      timeSignature: '3/4',
    },
    narrativePhases: [
      'A piece is stranded — cut off from the main army',
      'The search — resources diverted to rescue the lost piece',
      'Reunion — the piece returns to coordination, the position is whole again',
    ],
    photonEnergy: 'transitional',
    lesson: 'A single misplaced piece can cost the game — rescue it or sacrifice it, but never ignore it',
  },

  // ─── PARABLES OF WISDOM ───
  ten_virgins: {
    name: 'The Ten Virgins',
    scripture: 'Matthew 25:1-13',
    temporalFlow: { early: 0.20, mid: 0.30, late: 0.50 },
    intensity: 0.6,
    momentum: 0.3,
    volatility: 0.3,
    harmonicResonance: 0.75,
    chessArchetypes: ['time_pressure', 'preparation', 'endgame_technique'],
    musicalStructure: {
      mode: 'mixolydian',
      tempo: 'allegro',
      chordProgression: ['I', 'V', 'IV', 'I'],
      dynamicArc: 'mp→mf→ff',
      timeSignature: '4/4',
    },
    narrativePhases: [
      'Preparation phase — conserve time, build reserves on the clock',
      'The wait — the middlegame tests patience and resource management',
      'The bridegroom arrives — time pressure reveals who prepared and who squandered',
    ],
    photonEnergy: 'hot',
    lesson: 'Clock management is spiritual discipline — the prepared player wins in zeitnot',
  },

  pearl_of_great_price: {
    name: 'The Pearl of Great Price',
    scripture: 'Matthew 13:45-46',
    temporalFlow: { early: 0.20, mid: 0.60, late: 0.20 },
    intensity: 0.85,
    momentum: 1.0,
    volatility: 0.8,
    harmonicResonance: 0.9,
    chessArchetypes: ['exchange_sacrifice', 'sacrificial_attack', 'queen_sacrifice'],
    musicalStructure: {
      mode: 'lydian',
      tempo: 'moderato',
      chordProgression: ['I', '#IV', 'V', 'I'],
      dynamicArc: 'mf→ff→mf',
      timeSignature: '5/4',
    },
    narrativePhases: [
      'Searching — evaluating exchanges, looking for the decisive combination',
      'The sacrifice — giving up everything for the one thing that matters',
      'Possession — the sacrifice yields checkmate or decisive advantage',
    ],
    photonEnergy: 'hot',
    lesson: 'The greatest combinations require giving up everything for the one decisive blow',
  },
};

// ═══════════════════════════════════════════════════════════════════
// TEMPORAL BRIDGE ENGINE
// Connects chess game state → parable arc → musical expression
// ═══════════════════════════════════════════════════════════════════

export interface TemporalResonance {
  parable: ParableArc;
  resonanceScore: number;       // 0-1 how strongly this game resonates
  narrativePhase: number;       // 0=beginning, 1=middle, 2=end
  musicalExpression: MusicalMapping;
  photonState: 'hot' | 'cold' | 'transitional';
  word: string;                 // The lesson/word for this game
  harmonicAlignment: number;    // How well chess+parable+music align
}

export class ParableTemporalBridge {
  private resonanceHistory: TemporalResonance[] = [];
  private readonly HISTORY_SIZE = 5000;

  /**
   * Given a chess game's archetype and temporal signature,
   * find the biblical parable whose arc resonates most strongly,
   * and return the musical structure that expresses both.
   */
  findResonance(
    chessArchetype: string,
    temporalFlow: { early: number; mid: number; late: number },
    intensity: number,
    momentum: number,
    moveNumber: number,
    totalMoves: number,
  ): TemporalResonance | null {
    const gamePhase = totalMoves > 0 ? moveNumber / totalMoves : 0.5;
    let bestMatch: { parable: ParableArc; score: number } | null = null;

    for (const parable of Object.values(BIBLICAL_PARABLES)) {
      let score = 0;

      // 1. Archetype match (strongest signal — 40% weight)
      if (parable.chessArchetypes.includes(chessArchetype)) {
        score += 0.40;
      } else {
        // Partial credit for related archetypes
        const partialMatch = parable.chessArchetypes.some(a =>
          chessArchetype.includes(a.split('_')[0]) || a.includes(chessArchetype.split('_')[0])
        );
        if (partialMatch) score += 0.15;
      }

      // 2. Temporal flow similarity (30% weight)
      // Cosine similarity between game's temporal flow and parable's arc
      const dot =
        temporalFlow.early * parable.temporalFlow.early +
        temporalFlow.mid * parable.temporalFlow.mid +
        temporalFlow.late * parable.temporalFlow.late;
      const magA = Math.sqrt(
        temporalFlow.early ** 2 + temporalFlow.mid ** 2 + temporalFlow.late ** 2
      );
      const magB = Math.sqrt(
        parable.temporalFlow.early ** 2 +
        parable.temporalFlow.mid ** 2 +
        parable.temporalFlow.late ** 2
      );
      const cosineSim = magA > 0 && magB > 0 ? dot / (magA * magB) : 0;
      score += cosineSim * 0.30;

      // 3. Intensity match (15% weight)
      const intensityMatch = 1 - Math.abs(intensity - parable.intensity);
      score += intensityMatch * 0.15;

      // 4. Momentum match (15% weight)
      const momentumMatch = 1 - Math.abs(momentum - parable.momentum) / 2;
      score += momentumMatch * 0.15;

      if (!bestMatch || score > bestMatch.score) {
        bestMatch = { parable, score };
      }
    }

    if (!bestMatch || bestMatch.score < 0.25) return null;

    const parable = bestMatch.parable;

    // Determine narrative phase from game phase
    const narrativePhase = gamePhase < 0.33 ? 0 : gamePhase < 0.66 ? 1 : 2;

    // Calculate harmonic alignment: how well all three domains (chess, parable, music) sync
    const chessParableAlign = bestMatch.score;
    const parableMusicAlign = parable.harmonicResonance;
    const harmonicAlignment = Math.sqrt(chessParableAlign * parableMusicAlign);

    const resonance: TemporalResonance = {
      parable,
      resonanceScore: bestMatch.score,
      narrativePhase,
      musicalExpression: parable.musicalStructure,
      photonState: parable.photonEnergy,
      word: parable.narrativePhases[narrativePhase],
      harmonicAlignment,
    };

    this.resonanceHistory.push(resonance);
    if (this.resonanceHistory.length > this.HISTORY_SIZE) {
      this.resonanceHistory.shift();
    }

    return resonance;
  }

  /**
   * Convert a chess game's EP signals into a UniversalSignal
   * that can be compared with music and religious adapter signals.
   * This is the photonic bridge — same signal shape, different source.
   */
  chessToUniversalSignal(
    archetype: string,
    temporalFlow: { early: number; mid: number; late: number },
    intensity: number,
    dominantSide: string,
    colorRichness: number,
    complexity: number,
    moveNumber: number,
  ): UniversalSignal {
    const resonance = this.findResonance(
      archetype, temporalFlow, intensity,
      dominantSide === 'white' ? 1.3 : dominantSide === 'black' ? 0.7 : 1.0,
      moveNumber, 60
    );

    // Frequency: derived from color richness (photon energy)
    const frequency = 220 + colorRichness * 440; // Maps to A3-A5 range

    // Phase: position in the narrative arc
    const phase = floor(temporalFlow.early * EPSILON + temporalFlow.mid * Math.PI + temporalFlow.late * 2 * Math.PI);

    // Harmonics: encode the chess-parable-music triple
    const harmonics = [
      temporalFlow.early,
      temporalFlow.mid,
      temporalFlow.late,
      intensity,
      complexity / 10,
      colorRichness,
      resonance?.harmonicAlignment || EPSILON,
      resonance?.resonanceScore || EPSILON,
    ];

    return {
      domain: 'chess' as DomainType,
      timestamp: Date.now(),
      intensity: floor(intensity),
      frequency: floor(frequency),
      phase,
      harmonics: harmonics.map(h => floor(h)),
      rawData: [
        floor(intensity),
        floor(frequency),
        floor(colorRichness),
        floor(complexity),
        resonance?.narrativePhase || EPSILON,
        resonance?.harmonicAlignment || EPSILON,
      ],
    };
  }

  /**
   * Cross-reference: given signals from chess, music, and religious adapters,
   * find the resonance point where all three align.
   * This is the photonic interference pattern — constructive interference
   * means all three domains are expressing the same temporal truth.
   */
  findTripleResonance(
    chessSignal: UniversalSignal,
    musicSignal: UniversalSignal,
    religiousSignal: UniversalSignal,
  ): {
    alignment: number;
    dominantParable: string;
    musicalMode: string;
    chessArchetype: string;
    photonState: 'constructive' | 'destructive' | 'partial';
    word: string;
  } {
    // Phase alignment across all three domains
    const chessMusicPhase = Math.cos(chessSignal.phase - musicSignal.phase);
    const chessReligiousPhase = Math.cos(chessSignal.phase - religiousSignal.phase);
    const musicReligiousPhase = Math.cos(musicSignal.phase - religiousSignal.phase);
    const phaseAlignment = (chessMusicPhase + chessReligiousPhase + musicReligiousPhase) / 3;

    // Harmonic resonance: dot product of harmonic vectors
    const minLen = Math.min(
      chessSignal.harmonics.length,
      musicSignal.harmonics.length,
      religiousSignal.harmonics.length
    );
    let harmonicDot = 0;
    let magC = 0, magM = 0, magR = 0;
    for (let i = 0; i < minLen; i++) {
      harmonicDot += chessSignal.harmonics[i] * musicSignal.harmonics[i] * religiousSignal.harmonics[i];
      magC += chessSignal.harmonics[i] ** 2;
      magM += musicSignal.harmonics[i] ** 2;
      magR += religiousSignal.harmonics[i] ** 2;
    }
    const harmonicAlignment = magC > 0 && magM > 0 && magR > 0
      ? harmonicDot / (Math.sqrt(magC) * Math.sqrt(magM) * Math.sqrt(magR))
      : 0;

    // Intensity convergence
    const avgIntensity = (chessSignal.intensity + musicSignal.intensity + religiousSignal.intensity) / 3;
    const intensitySpread = Math.max(
      Math.abs(chessSignal.intensity - avgIntensity),
      Math.abs(musicSignal.intensity - avgIntensity),
      Math.abs(religiousSignal.intensity - avgIntensity),
    );
    const intensityAlignment = 1 - intensitySpread;

    // Overall alignment
    const alignment = (phaseAlignment + 1) / 2 * 0.4 + // Normalize phase to 0-1
      Math.max(0, harmonicAlignment) * 0.35 +
      intensityAlignment * 0.25;

    // Determine photon state from interference
    const photonState = alignment > 0.7 ? 'constructive' :
      alignment > 0.4 ? 'partial' : 'destructive';

    // Find the most recent resonance for context
    const lastResonance = this.resonanceHistory[this.resonanceHistory.length - 1];

    return {
      alignment,
      dominantParable: lastResonance?.parable.name || 'The Mustard Seed',
      musicalMode: lastResonance?.musicalExpression.mode || 'ionian',
      chessArchetype: lastResonance?.parable.chessArchetypes[0] || 'unknown',
      photonState,
      word: lastResonance?.word || 'The pattern speaks through silence',
    };
  }

  /**
   * Get the word/lesson for a chess game based on its archetype and phase.
   * This is what gets stored in the lesson_learned column.
   */
  getGameWord(
    archetype: string,
    moveNumber: number,
    totalMoves: number,
    temporalFlow: { early: number; mid: number; late: number },
    intensity: number,
    momentum: number,
  ): string {
    const resonance = this.findResonance(
      archetype, temporalFlow, intensity, momentum, moveNumber, totalMoves
    );

    if (!resonance) {
      return `Move ${moveNumber}: The position speaks in a language not yet mapped`;
    }

    const phase = resonance.narrativePhase;
    return `[${resonance.parable.name}] ${resonance.word} ` +
      `(${resonance.musicalExpression.mode} ${resonance.musicalExpression.tempo}, ` +
      `${resonance.photonState} photon, alignment: ${(resonance.harmonicAlignment * 100).toFixed(0)}%)`;
  }

  getResonanceHistory(): TemporalResonance[] {
    return [...this.resonanceHistory];
  }

  getParableDistribution(): Record<string, number> {
    const dist: Record<string, number> = {};
    for (const r of this.resonanceHistory) {
      dist[r.parable.name] = (dist[r.parable.name] || 0) + 1;
    }
    return dist;
  }
}

export const parableTemporalBridge = new ParableTemporalBridge();
