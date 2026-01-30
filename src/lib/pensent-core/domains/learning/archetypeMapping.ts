/**
 * Archetype Mapping Constants
 * 
 * Cross-domain archetype transfer mappings for En Pensent™ learning
 */

// Universal pattern equivalence weights
export const DOMAIN_EXCHANGE_WEIGHTS = {
  chess: { code: 0.8, market: 1.2 },
  code: { chess: 1.25, market: 0.95 },
  market: { chess: 0.85, code: 1.05 },
} as const;

// Archetype mappings for cross-domain transfer
export const ARCHETYPE_TRANSFER_MAP: Record<string, Record<string, string[]>> = {
  // Chess archetypes → Other domains
  kingside_attack: {
    code: ['feature_sprint', 'rapid_growth'],
    market: ['breakout_bullish', 'momentum_surge'],
  },
  queenside_attack: {
    code: ['architecture_shift', 'refactoring_surge'],
    market: ['accumulation', 'distribution'],
  },
  central_domination: {
    code: ['core_fortress', 'pattern_master'],
    market: ['consolidation', 'uptrend'],
  },
  piece_activity: {
    code: ['modular_army', 'microservice_swarm'],
    market: ['high_volatility', 'momentum_surge'],
  },
  pawn_structure: {
    code: ['stable_evolution', 'maintenance_mode'],
    market: ['accumulation', 'low_volatility'],
  },
  endgame_technique: {
    code: ['technical_debt', 'legacy_guardian'],
    market: ['distribution', 'reversal_bullish'],
  },
  prophylaxis: {
    code: ['balanced_portfolio', 'stable_evolution'],
    market: ['consolidation', 'low_volatility'],
  },
  space_advantage: {
    code: ['pattern_master', 'core_fortress'],
    market: ['uptrend', 'accumulation'],
  },
  material_advantage: {
    code: ['rapid_growth', 'feature_sprint'],
    market: ['breakout_bullish', 'uptrend'],
  },
  dynamic_play: {
    code: ['refactoring_surge', 'architecture_shift'],
    market: ['high_volatility', 'reversal_bullish'],
  },
  positional_squeeze: {
    code: ['technical_debt', 'complexity_wave'],
    market: ['accumulation', 'consolidation'],
  },
  tactical_chaos: {
    code: ['bug_fix_cycle', 'complexity_wave'],
    market: ['high_volatility', 'reversal_bearish'],
  },
};

// 64-square correlation matrix (Chess squares → Code metrics → Market sectors)
export const SQUARE_METRIC_SECTOR_MAP = {
  // Center squares (d4, d5, e4, e5) = Core SDK = Large-cap tech
  center: { codeCategory: 'core-sdk', marketSector: 'technology' },
  // Kingside (f-h files) = UI/UX = Consumer discretionary
  kingside: { codeCategory: 'ui-components', marketSector: 'consumer' },
  // Queenside (a-c files) = Infrastructure = Utilities/Energy
  queenside: { codeCategory: 'infrastructure', marketSector: 'utilities' },
  // King position = Security = Financial services
  kingZone: { codeCategory: 'security', marketSector: 'financials' },
};

/**
 * Find chess equivalents for a given archetype
 */
export function findChessEquivalents(archetype: string): string[] {
  for (const [chessArch, mappings] of Object.entries(ARCHETYPE_TRANSFER_MAP)) {
    if (mappings.code?.includes(archetype) || mappings.market?.includes(archetype)) {
      return [chessArch];
    }
  }
  return [];
}

/**
 * Find market equivalents for a given archetype
 */
export function findMarketEquivalents(archetype: string): string[] {
  const mappings = ARCHETYPE_TRANSFER_MAP[archetype];
  return mappings?.market || [];
}

/**
 * Find code equivalents for a given archetype
 */
export function findCodeEquivalents(archetype: string): string[] {
  const codeArchetypes: string[] = [];
  for (const mappings of Object.values(ARCHETYPE_TRANSFER_MAP)) {
    if (mappings.market?.includes(archetype)) {
      codeArchetypes.push(...(mappings.code || []));
    }
  }
  return [...new Set(codeArchetypes)];
}
