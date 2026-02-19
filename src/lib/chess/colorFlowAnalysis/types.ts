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
  
  /** Enhanced 8-quadrant profile (when available from enhanced extractor) */
  enhancedProfile?: EnhancedQuadrantProfileData;
  
  /** 6-layer enhanced signals (when available from enhanced extractor) */
  enhancedSignals?: EnhancedSignalsData;
  
  /** Position complexity score (avg visits per square, from enhanced extractor) */
  complexity?: number;
  
  /** Color richness (ratio of piece types present, from enhanced extractor) */
  colorRichness?: number;
}

/** Inline types so we don't create circular imports with enhancedSignatureExtractor */
export interface EnhancedQuadrantProfileData {
  q1_kingside_white: number;
  q2_queenside_white: number;
  q3_kingside_black: number;
  q4_queenside_black: number;
  q5_center_white: number;
  q6_center_black: number;
  q7_extended_kingside: number;
  q8_extended_queenside: number;
  bishop_dominance: number;
  knight_dominance: number;
  rook_dominance: number;
  queen_dominance: number;
  pawn_advancement: number;
  temporalFlow: { early: number; mid: number; late: number };
}

export interface EnhancedSignalsData {
  coordination: { batteryScore: number; doubledRookScore: number; minorPieceHarmony: number; multiPieceAttackZones: number; coordinationScore: number };
  squareControl: { whiteInfluence: number; blackInfluence: number; contestedSquares: number; centerControlDelta: number; kingsideControlDelta: number; queensideControlDelta: number; controlScore: number };
  trajectories: { whiteDistance: number; blackDistance: number; avgMobility: number; forwardBias: number; mobilityScore: number };
  kingSafety: { whitePawnShield: number; blackPawnShield: number; whiteKingExposure: number; blackKingExposure: number; castled: { white: boolean; black: boolean }; kingSafetyDelta: number };
  pawnStructure: { whiteIslands: number; blackIslands: number; whiteDoubled: number; blackDoubled: number; whitePassed: number; blackPassed: number; whiteConnected: number; blackConnected: number; structureScore: number };
  captureGraph: { totalCaptures: number; capturesByWhite: number; capturesByBlack: number; earlyCaptures: number; materialTension: number; sacrificeIndicators: number; exchangeScore: number };
  negativeSpace?: { backRankPressure: number; whiteKingZoneShadow: number; blackKingZoneShadow: number; whiteInvasionShadow: number; blackInvasionShadow: number; voidTension: number; negativeSpaceBalance: number; emptySquareCount: number };
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
  // Base archetypes (4-quadrant compatible)
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
  // Enhanced 8-quadrant archetypes (piece-type + spatial resolution)
  | 'kingside_rook_lift_blitz'    // Rook lift + pawn storm on kingside
  | 'kingside_knight_charge'      // Knight-led kingside attack
  | 'kingside_bishop_battery'     // Bishop pair aiming at kingside
  | 'queenside_bishop_squeeze'    // Bishop pair constricting queenside
  | 'queenside_queen_seventh'     // Early queen activity on queenside
  | 'queenside_rook_majority'     // Rook-driven queenside pressure
  | 'queenside_pressure'          // General queenside pressure
  | 'central_knight_outpost'      // Knight dominance in center
  | 'central_bishop_cross'        // Bishop pair controlling center
  | 'central_pawn_roller'         // Central pawn advance
  | 'kingside_expansion'          // Wing expansion kingside
  | 'wing_bishop_deployment'      // Bishop pair on wings
  | 'wing_play'                   // General wing expansion
  | 'bishop_pair_mastery'         // Bishop pair dominance pattern
  | 'knight_complex_superiority'  // Knight superiority over bishops
  | 'rook_activity_maximum'       // Maximum rook activity
  | 'pawn_storm_assault'          // Advanced pawn storm
  | 'minor_piece_coordination'    // Bishop + knight working together
  | 'rook_wing_domination'        // Rook + wing control
  | 'center_kingside_break'       // Central to kingside transition
  | 'passed_pawn_race'            // Passed pawn endgame
  | 'development_focus'           // Early development priority
  | 'middlegame_complexity'       // Complex middlegame position
  // v3: Signal-enriched archetypes (6-layer analysis)
  | 'sacrificial_kingside_assault'  // Sacrifice + high tension on kingside
  | 'sacrificial_queenside_break'   // Sacrifice + high tension on queenside
  | 'king_hunt'                     // Exposed king + coordinated attack
  | 'kingside_coordinated_siege'    // Multi-piece coordinated kingside pressure
  | 'queenside_coordinated_siege'   // Multi-piece coordinated queenside pressure
  | 'central_space_advantage'       // Center control + high mobility
  | 'rook_behind_passer'            // Rook supporting passed pawn
  | 'structural_pressure'           // Exploiting weak pawn structure
  | 'tactical_melee'                // High tension + mobility + aggression
  | 'queenside_expansion'           // Wing expansion queenside
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
