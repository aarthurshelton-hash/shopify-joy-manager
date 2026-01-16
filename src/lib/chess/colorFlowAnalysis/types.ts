/**
 * Color Flow Analysis Types
 * 
 * Patent-Pending Technology: En Pensent™ Color Flow Signatures
 */

// ===================== COLOR FLOW SIGNATURE TYPES =====================

export interface ColorFlowSignature {
  /** Unique hash representing the complete color pattern */
  fingerprint: string;
  
  /** Dominant territorial owner across the game */
  dominantSide: 'white' | 'black' | 'contested';
  
  /** How the territory shifted over time */
  flowDirection: 'kingside' | 'queenside' | 'central' | 'balanced' | 'diagonal';
  
  /** Intensity of color concentration (0-100) */
  intensity: number;
  
  /** Detected strategic archetype */
  archetype: StrategicArchetype;
  
  /** Color distribution across board quadrants */
  quadrantProfile: QuadrantProfile;
  
  /** Evolution of color intensity over game phases */
  temporalFlow: TemporalFlow;
  
  /** Key moments where color balance shifted dramatically */
  criticalMoments: CriticalMoment[];
}

export interface QuadrantProfile {
  /** Quadrant scores: -100 (black dominant) to +100 (white dominant) */
  kingsideWhite: number;   // e1-h4
  kingsideBlack: number;   // e5-h8
  queensideWhite: number;  // a1-d4
  queensideBlack: number;  // a5-d8
  center: number;          // d4-e5 core
}

export interface TemporalFlow {
  /** Opening phase color balance (moves 1-10) */
  opening: number;
  /** Middlegame color balance (moves 11-25) */
  middlegame: number;
  /** Endgame color balance (moves 26+) */
  endgame: number;
  /** Rate of territory change per move */
  volatility: number;
}

export interface CriticalMoment {
  moveNumber: number;
  shiftMagnitude: number;
  description: string;
  squaresAffected: string[];
}

// ===================== STRATEGIC ARCHETYPES =====================

export type StrategicArchetype = 
  | 'kingside_attack'      // Heavy color concentration on kingside
  | 'queenside_expansion'  // Progressive queenside color flow
  | 'central_domination'   // Dense center color presence
  | 'prophylactic_defense' // Balanced, low-intensity defense
  | 'pawn_storm'           // Linear pawn color trails
  | 'piece_harmony'        // Coordinated piece color overlaps
  | 'opposite_castling'    // Split color territories
  | 'closed_maneuvering'   // Low piece movement, subtle shifts
  | 'open_tactical'        // High volatility, capture-heavy
  | 'endgame_technique'    // Sparse, precise color placement
  | 'sacrificial_attack'   // Asymmetric color exchange patterns
  | 'positional_squeeze'   // Gradual territorial encroachment
  | 'unknown';

export interface ArchetypeDefinition {
  id: StrategicArchetype;
  name: string;
  description: string;
  colorCharacteristics: string;
  historicalWinRate: number; // Based on archetype pattern outcomes
  predictedOutcome: 'white_favored' | 'black_favored' | 'balanced';
  lookaheadConfidence: number; // How far ahead this pattern predicts (moves)
}

// ===================== PREDICTION TYPES =====================

export interface ColorFlowPrediction {
  /** Predicted game outcome based on color flow */
  predictedWinner: 'white' | 'black' | 'draw';
  /** Confidence in prediction (0-100) */
  confidence: number;
  /** How many moves ahead this prediction is reliable */
  lookaheadMoves: number;
  /** Strategic continuation advice */
  strategicGuidance: string[];
  /** Squares that will likely become critical */
  futureCriticalSquares: string[];
  /** Expected color flow evolution */
  expectedEvolution: string;
}
