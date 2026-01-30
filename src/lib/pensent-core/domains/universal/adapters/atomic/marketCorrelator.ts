/**
 * Market Correlator Module
 * 
 * Generates atomic data correlated to market conditions.
 */

import type { AtomicData } from './types';
import type { PeriodicGroup } from './periodicPatterns';
import type { OrbitalType, SpinType } from './quantumPatterns';

/**
 * Generate atomic data correlated to market conditions
 */
export function generateMarketCorrelatedAtomicData(
  marketMomentum: number,
  marketVolatility: number,
  marketDirection: 'up' | 'down' | 'sideways'
): AtomicData {
  // Map market state to atomic properties
  const elementGroup = selectElementGroup(marketVolatility, marketDirection);
  const principalLevel = calculatePrincipalLevel(marketMomentum);
  const orbitalType = selectOrbitalType(marketVolatility);
  const spin = selectSpin(marketDirection);
  
  return {
    elementGroup,
    quantumState: {
      principalLevel,
      orbitalType,
      spin,
    },
    spectralEnergy: marketMomentum,
    stabilityIndex: 1 - marketVolatility,
    reactivityPotential: marketVolatility,
    resonanceFrequency: marketMomentum * 1000,
  };
}

/**
 * Select element group based on market volatility and direction
 */
function selectElementGroup(
  volatility: number, 
  direction: 'up' | 'down' | 'sideways'
): PeriodicGroup {
  if (volatility > 0.8) {
    return direction === 'up' ? 'alkaliMetals' : 'halogens';
  }
  if (volatility < 0.3) {
    return 'nobleGases';
  }
  if (volatility > 0.6) {
    return 'transitionMetals';
  }
  return 'alkalineEarth';
}

/**
 * Calculate principal quantum level from momentum
 */
function calculatePrincipalLevel(momentum: number): number {
  return Math.min(5, Math.max(1, Math.ceil(momentum * 5)));
}

/**
 * Select orbital type from volatility
 */
function selectOrbitalType(volatility: number): OrbitalType {
  if (volatility < 0.25) return 's';
  if (volatility < 0.5) return 'p';
  if (volatility < 0.75) return 'd';
  return 'f';
}

/**
 * Select spin from market direction
 */
function selectSpin(direction: 'up' | 'down' | 'sideways'): SpinType {
  switch (direction) {
    case 'up': return 'up';
    case 'down': return 'down';
    default: return 'paired';
  }
}
