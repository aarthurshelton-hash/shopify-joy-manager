/**
 * Code-to-Chess Pattern Matcher
 * 
 * Maps code patterns to chess strategic equivalents,
 * enabling cross-domain pattern transfer.
 * 
 * This is the key innovation: proving that code architecture
 * and chess strategy follow the same universal patterns.
 */

import { CodeFlowSignature } from './signatureExtractor';
import { CodeArchetype } from './archetypeClassifier';
import { StrategicArchetype } from '@/lib/chess/colorFlowAnalysis/types';

/**
 * Mapping between code and chess patterns
 */
export interface CodeChessMapping {
  /** Code archetype */
  codeArchetype: CodeArchetype;
  
  /** Equivalent chess archetype */
  chessArchetype: StrategicArchetype;
  
  /** Mapping confidence */
  confidence: number;
  
  /** Strategic insights from the mapping */
  insights: CrossDomainInsight[];
  
  /** Recommended actions from chess strategy */
  chessInspiredActions: string[];
  
  /** Quadrant correspondence */
  quadrantMapping: QuadrantCorrespondence;
}

export interface CrossDomainInsight {
  source: 'code' | 'chess';
  insight: string;
  applicability: number; // 0-100
}

export interface QuadrantCorrespondence {
  // Code territory → Chess territory
  coreTerritory: 'king_safety' | 'center_control' | 'development';
  mobilityZone: 'queen_activity' | 'piece_coordination' | 'space';
  structuralPower: 'pawn_structure' | 'piece_placement' | 'outposts';
  tacticalSupport: 'piece_harmony' | 'tactical_threats' | 'prophylaxis';
}

// Mapping table: Code Archetype → Chess Archetype
const ARCHETYPE_MAPPINGS: Record<CodeArchetype, StrategicArchetype> = {
  core_fortress: 'prophylactic_defense',
  rapid_expansion: 'queenside_expansion',
  pattern_master: 'piece_harmony',
  modular_army: 'central_domination',
  monolith_giant: 'closed_maneuvering',
  microservice_swarm: 'open_tactical',
  hybrid_fusion: 'positional_squeeze',
  technical_debt: 'sacrificial_attack', // Must sacrifice to recover
  emerging_startup: 'pawn_storm',
  legacy_evolution: 'endgame_technique',
  innovation_lab: 'opposite_castling',
  production_stable: 'prophylactic_defense',
};

// Chess-inspired actions for each code archetype
const CHESS_INSPIRED_ACTIONS: Record<CodeArchetype, string[]> = {
  core_fortress: [
    'Strengthen king safety (core module protection)',
    'Control key squares (API boundaries)',
    'Maintain pawn structure (type safety)',
  ],
  rapid_expansion: [
    'Push pawns forward (ship features)',
    'Create passed pawns (standalone modules)',
    'Queenside attack (expand functionality)',
  ],
  pattern_master: [
    'Coordinate pieces (pattern integration)',
    'Control diagonals (cross-cutting concerns)',
    'Create outposts (reusable abstractions)',
  ],
  modular_army: [
    'Central control (shared patterns)',
    'Piece development (module creation)',
    'Castle early (establish foundations)',
  ],
  monolith_giant: [
    'Pawn breaks (refactor boundaries)',
    'Open lines (create interfaces)',
    'Exchange pieces (reduce coupling)',
  ],
  microservice_swarm: [
    'Tactical alertness (monitoring)',
    'Piece coordination (service mesh)',
    'Calculate variations (integration tests)',
  ],
  hybrid_fusion: [
    'Positional squeeze (gradual improvement)',
    'Prophylaxis (prevent regressions)',
    'Improve worst piece (fix weakest module)',
  ],
  technical_debt: [
    'Exchange sacrifice (remove bad code)',
    'Pawn compensation (add tests)',
    'Activity over material (velocity over features)',
  ],
  emerging_startup: [
    'Rapid development (ship fast)',
    'Pawn storm (feature blitz)',
    'King safety later (refactor later)',
  ],
  legacy_evolution: [
    'Endgame technique (migration precision)',
    'Convert advantage (preserve knowledge)',
    'Simplify position (reduce complexity)',
  ],
  innovation_lab: [
    'Opposite-side attacks (parallel experiments)',
    'Calculate deeply (prototype testing)',
    'Accept gambits (try new approaches)',
  ],
  production_stable: [
    'Prophylaxis (prevent bugs)',
    'Quiet moves (maintenance)',
    'Fortress building (security hardening)',
  ],
};

/**
 * Match code patterns to chess equivalents
 */
export function matchCodeToChessPatterns(
  signature: CodeFlowSignature,
  codeArchetype: CodeArchetype
): CodeChessMapping {
  const chessArchetype = ARCHETYPE_MAPPINGS[codeArchetype];
  const chessActions = CHESS_INSPIRED_ACTIONS[codeArchetype];
  
  // Calculate confidence based on signature clarity
  const confidence = Math.min(100, signature.intensity * 1.2);
  
  // Generate cross-domain insights
  const insights = generateInsights(signature, codeArchetype, chessArchetype);
  
  // Determine quadrant correspondence
  const quadrantMapping = mapQuadrants(signature);
  
  return {
    codeArchetype,
    chessArchetype,
    confidence,
    insights,
    chessInspiredActions: chessActions,
    quadrantMapping,
  };
}

/**
 * Generate insights from the cross-domain mapping
 */
function generateInsights(
  signature: CodeFlowSignature,
  codeArchetype: CodeArchetype,
  chessArchetype: StrategicArchetype
): CrossDomainInsight[] {
  const insights: CrossDomainInsight[] = [];
  const quadrant = signature.quadrantProfile;
  
  // Core territory insight
  if (quadrant.coreTerritory > 70) {
    insights.push({
      source: 'code',
      insight: 'Strong core suggests prophylactic defense strategy - protect critical paths',
      applicability: 85,
    });
  }
  
  // Mobility insight
  if (quadrant.mobilityZone > 60) {
    insights.push({
      source: 'chess',
      insight: 'High UI mobility mirrors queen activity - maintain flexibility but avoid overextension',
      applicability: 75,
    });
  }
  
  // Structural insight
  if (quadrant.structuralPower < 50) {
    insights.push({
      source: 'chess',
      insight: 'Weak pawn structure (hooks/stores) - consider strengthening state management',
      applicability: 80,
    });
  }
  
  // Temporal insight
  if (signature.temporalFlow.velocity > 5) {
    insights.push({
      source: 'code',
      insight: 'High velocity matches rapid expansion - ensure you castle (stabilize) before attacking',
      applicability: 70,
    });
  }
  
  return insights;
}

/**
 * Map code quadrants to chess territorial concepts
 */
function mapQuadrants(signature: CodeFlowSignature): QuadrantCorrespondence {
  const quadrant = signature.quadrantProfile;
  
  return {
    coreTerritory: quadrant.coreTerritory > 70
      ? 'king_safety'
      : quadrant.coreTerritory > 50
        ? 'center_control'
        : 'development',
    
    mobilityZone: quadrant.mobilityZone > 70
      ? 'queen_activity'
      : quadrant.mobilityZone > 50
        ? 'piece_coordination'
        : 'space',
    
    structuralPower: quadrant.structuralPower > 70
      ? 'pawn_structure'
      : quadrant.structuralPower > 50
        ? 'piece_placement'
        : 'outposts',
    
    tacticalSupport: quadrant.tacticalSupport > 70
      ? 'piece_harmony'
      : quadrant.tacticalSupport > 50
        ? 'tactical_threats'
        : 'prophylaxis',
  };
}
