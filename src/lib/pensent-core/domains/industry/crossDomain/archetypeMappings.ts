/**
 * Cross-Domain Archetype Mappings
 * Pre-computed correlations between chess patterns and industry archetypes
 */

import type { IndustryVertical } from '../types';

export interface ChessArchetypeMapping {
  chessArchetype: string;
  industryMappings: Array<{
    industry: IndustryVertical;
    archetype: string;
    correlationStrength: number;
    rationale: string;
  }>;
}

/**
 * Pre-computed cross-domain archetype correlations
 * Based on temporal signature similarity analysis
 */
export const CROSS_DOMAIN_MAPPINGS: ChessArchetypeMapping[] = [
  {
    chessArchetype: 'aggressive_attacker',
    industryMappings: [
      {
        industry: 'cybersecurity',
        archetype: 'lateral_movement',
        correlationStrength: 0.87,
        rationale: 'Both show rapid, directional penetration into opponent territory'
      },
      {
        industry: 'fintech',
        archetype: 'velocity_attack',
        correlationStrength: 0.82,
        rationale: 'Fast, forcing sequences designed to overwhelm defenses'
      },
      {
        industry: 'manufacturing',
        archetype: 'thermal_runaway',
        correlationStrength: 0.71,
        rationale: 'Cascading, accelerating pattern with critical endpoint'
      }
    ]
  },
  {
    chessArchetype: 'positional_squeeze',
    industryMappings: [
      {
        industry: 'supply_chain',
        archetype: 'single_point_failure',
        correlationStrength: 0.89,
        rationale: 'Gradual restriction of options until collapse is inevitable'
      },
      {
        industry: 'manufacturing',
        archetype: 'lubrication_starvation',
        correlationStrength: 0.78,
        rationale: 'Slow degradation through resource deprivation'
      },
      {
        industry: 'healthcare',
        archetype: 'respiratory_decline',
        correlationStrength: 0.74,
        rationale: 'Progressive reduction in vital capacity'
      }
    ]
  },
  {
    chessArchetype: 'fortress_defense',
    industryMappings: [
      {
        industry: 'supply_chain',
        archetype: 'resilient_network',
        correlationStrength: 0.92,
        rationale: 'Robust, multi-layered structure resistant to attacks'
      },
      {
        industry: 'manufacturing',
        archetype: 'stable_operation',
        correlationStrength: 0.88,
        rationale: 'All systems balanced within safe parameters'
      },
      {
        industry: 'cybersecurity',
        archetype: 'normal_variance',
        correlationStrength: 0.85,
        rationale: 'Healthy baseline with no anomalous patterns'
      }
    ]
  },
  {
    chessArchetype: 'tactical_explosion',
    industryMappings: [
      {
        industry: 'healthcare',
        archetype: 'sepsis_precursor',
        correlationStrength: 0.91,
        rationale: 'Sudden, cascading system failure from stable baseline'
      },
      {
        industry: 'manufacturing',
        archetype: 'bearing_degradation',
        correlationStrength: 0.84,
        rationale: 'Hidden buildup leading to sudden critical failure'
      },
      {
        industry: 'fintech',
        archetype: 'geographic_impossible',
        correlationStrength: 0.79,
        rationale: 'Sudden break from all normal patterns'
      }
    ]
  },
  {
    chessArchetype: 'opening_trap',
    industryMappings: [
      {
        industry: 'fintech',
        archetype: 'synthetic_identity',
        correlationStrength: 0.86,
        rationale: 'Appears legitimate but conceals malicious intent'
      },
      {
        industry: 'cybersecurity',
        archetype: 'reconnaissance_sweep',
        correlationStrength: 0.77,
        rationale: 'Preparation phase before main attack'
      },
      {
        industry: 'supply_chain',
        archetype: 'bullwhip_cascade',
        correlationStrength: 0.72,
        rationale: 'Small initial signal amplified into major disruption'
      }
    ]
  }
];
