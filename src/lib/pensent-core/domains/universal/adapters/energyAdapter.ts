/**
 * Energy Domain Adapter
 * 
 * Temporal pattern recognition for power systems and energy grids
 * Load forecasting, grid stability, renewable optimization
 * 
 * Applications:
 * - Grid load forecasting: Peak demand prediction, load balancing
 * - Renewable integration: Solar/wind forecasting, storage optimization
 * - Power quality: Frequency stability, voltage regulation patterns
 * - Smart buildings: HVAC optimization, demand response
 * - Electric vehicles: Charging patterns, grid impact
 * - Energy trading: Price volatility, arbitrage opportunities
 * 
 * Patent-Pending: En Pensent™ Energy Temporal Analysis
 */

import type { DomainSignature } from '../types';

// Energy telemetry point
export interface EnergyPoint {
  timestamp: number;
  
  // Grid metrics
  totalDemand: number;         // MW (normalized 0-1)
  totalSupply: number;         // MW (normalized)
  frequency: number;           // Hz (normalized around 50/60Hz)
  voltage: number;             // kV (normalized)
  
  // Generation mix
  fossilFuelGen: number;       // Coal, gas, oil (normalized)
  nuclearGen: number;          // Nuclear (normalized)
  hydroGen: number;            // Hydroelectric (normalized)
  windGen: number;             // Wind power (normalized)
  solarGen: number;            // Solar PV (normalized)
  storageDischarge: number;    // Battery/pumped hydro (normalized)
  
  // Grid stress indicators
  spinningReserve: number;     // Available backup (normalized)
  transmissionLoad: number;    // Line loading (normalized)
  congestionIndex: number;     // Transmission constraints (normalized)
  
  // Market/pricing
  spotPrice: number;           // $/MWh (normalized)
  priceVolatility: number;     // Standard deviation (normalized)
  
  // Demand response
  demandResponseActive: number; // Load curtailment (normalized)
  storageSOC: number;          // State of charge (0-1)
  evChargingLoad: number;      // EV charging (normalized)
  
  // Weather impact on renewables
  solarIrradiance: number;     // W/m2 (normalized)
  windSpeed: number;           // m/s (normalized)
  temperature: number;           // Affects HVAC demand (normalized)
}

// Generation unit status
export interface GenerationUnit {
  type: 'coal' | 'gas' | 'nuclear' | 'hydro' | 'wind' | 'solar' | 'battery';
  capacity: number;            // MW (normalized)
  currentOutput: number;       // MW (normalized)
  efficiency: number;          // 0-1
  availability: number;        // 0-1 (uptime)
  rampRate: number;            // MW/min (normalized)
}

// Energy system data
export interface EnergyData {
  gridId: string;
  region: string;
  interconnection: 'eastern' | 'western' | 'texas' | 'quebec' | 'european';
  
  points: EnergyPoint[];
  units: GenerationUnit[];
  
  timeRange: {
    start: number;
    end: number;
  };
  
  metadata?: {
    operator?: string;
    renewablesTarget?: number; // % target
    peakDemand?: number;       // MW
    totalCapacity?: number;    // MW
  };
}

// Energy archetypes (grid operating modes)
export type EnergyArchetype =
  | 'baseload_dominance'       // Traditional steady generation
  | 'renewable_surge'          // High wind/solar penetration
  | 'duck_curve'               // Solar ramp evening peak
  | 'peak_demand_stress'       // Maximum demand period
  | 'storage_discharge_peak'   // Battery supporting peak
  | 'grid_emergency'           // Conservation voltage reduction
  | 'frequency_instability'    // Generation-load mismatch
  | 'price_volatility_spike'   // Market disruption
  | 'renewable_curtailment'    // Excess generation wasted
  | 'transmission_congestion'  // Grid bottleneck
  | 'demand_response_event'    // Load curtailment active
  | 'blackstart_recovery'      // Grid restoration post-blackout
  | 'morning_ramp'             // Fast demand increase
  | 'evening_peak'             // Daily maximum load
  | 'minimum_load_night'       // Overnight low demand
  | 'solar_noon_surplus'       // Midday overgeneration
  | 'wind_oscillation'         // Rapid wind output changes
  | 'intertie_stress'          // Import/export limits reached
  | 'nuclear_outage'           // Base load unit offline
  | 'coal_retirement_gaps';     // Missing capacity from shutdowns

// Archetype definitions with grid stability implications
export const ENERGY_ARCHETYPES: Record<EnergyArchetype, {
  description: string;
  color: string;
  stabilityLevel: 'stable' | 'managed' | 'constrained' | 'critical' | 'emergency';
  typicalDuration: number; // minutes
  interventionRequired: boolean;
}> = {
  baseload_dominance: {
    description: 'Traditional steady generation with predictable output',
    color: '#3B82F6', // Blue
    stabilityLevel: 'stable',
    typicalDuration: 1440, // 24 hours
    interventionRequired: false
  },
  renewable_surge: {
    description: 'High wind/solar penetration challenging grid balance',
    color: '#22C55E', // Green
    stabilityLevel: 'managed',
    typicalDuration: 180,
    interventionRequired: false
  },
  duck_curve: {
    description: 'Solar ramp causing evening peak demand mismatch',
    color: '#F59E0B', // Amber
    stabilityLevel: 'constrained',
    typicalDuration: 120,
    interventionRequired: true
  },
  peak_demand_stress: {
    description: 'Maximum demand period approaching capacity limits',
    color: '#EF4444', // Red
    stabilityLevel: 'critical',
    typicalDuration: 60,
    interventionRequired: true
  },
  storage_discharge_peak: {
    description: 'Battery supporting peak demand, discharging rapidly',
    color: '#8B5CF6', // Purple
    stabilityLevel: 'constrained',
    typicalDuration: 90,
    interventionRequired: true
  },
  grid_emergency: {
    description: 'Conservation voltage reduction, load shedding imminent',
    color: '#7F1D1D', // Dark red
    stabilityLevel: 'emergency',
    typicalDuration: 30,
    interventionRequired: true
  },
  frequency_instability: {
    description: 'Generation-load mismatch causing frequency deviation',
    color: '#DC2626', // Red
    stabilityLevel: 'emergency',
    typicalDuration: 5,
    interventionRequired: true
  },
  price_volatility_spike: {
    description: 'Market disruption with extreme price swings',
    color: '#A855F7', // Violet
    stabilityLevel: 'critical',
    typicalDuration: 15,
    interventionRequired: false
  },
  renewable_curtailment: {
    description: 'Excess generation must be wasted due to grid limits',
    color: '#F97316', // Orange
    stabilityLevel: 'constrained',
    typicalDuration: 240,
    interventionRequired: true
  },
  transmission_congestion: {
    description: 'Grid bottleneck preventing power flow to demand',
    color: '#6366F1', // Indigo
    stabilityLevel: 'constrained',
    typicalDuration: 180,
    interventionRequired: true
  },
  demand_response_event: {
    description: 'Load curtailment active, customers reducing use',
    color: '#06B6D4', // Cyan
    stabilityLevel: 'managed',
    typicalDuration: 120,
    interventionRequired: false
  },
  blackstart_recovery: {
    description: 'Grid restoration following blackout',
    color: '#1E3A5F', // Navy
    stabilityLevel: 'emergency',
    typicalDuration: 360,
    interventionRequired: true
  },
  morning_ramp: {
    description: 'Fast demand increase as businesses open',
    color: '#84CC16', // Lime
    stabilityLevel: 'managed',
    typicalDuration: 180,
    interventionRequired: false
  },
  evening_peak: {
    description: 'Daily maximum load period',
    color: '#B91C1C', // Dark red
    stabilityLevel: 'constrained',
    typicalDuration: 120,
    interventionRequired: true
  },
  minimum_load_night: {
    description: 'Overnight low demand with baseload inflexibility',
    color: '#1E40AF', // Deep blue
    stabilityLevel: 'managed',
    typicalDuration: 360,
    interventionRequired: false
  },
  solar_noon_surplus: {
    description: 'Midday overgeneration from solar PV',
    color: '#EAB308', // Yellow
    stabilityLevel: 'constrained',
    typicalDuration: 120,
    interventionRequired: true
  },
  wind_oscillation: {
    description: 'Rapid wind output changes requiring fast ramping',
    color: '#14B8A6', // Teal
    stabilityLevel: 'managed',
    typicalDuration: 60,
    interventionRequired: false
  },
  intertie_stress: {
    description: 'Import/export limits reached on transmission ties',
    color: '#7C3AED', // Purple
    stabilityLevel: 'constrained',
    typicalDuration: 90,
    interventionRequired: true
  },
  nuclear_outage: {
    description: 'Base load unit offline, capacity shortage',
    color: '#BE185D', // Pink
    stabilityLevel: 'critical',
    typicalDuration: 2880,
    interventionRequired: true
  },
  coal_retirement_gaps: {
    description: 'Missing capacity from plant shutdowns',
    color: '#78716C', // Gray
    stabilityLevel: 'constrained',
    typicalDuration: 4320,
    interventionRequired: true
  }
};

// Type exports
export type { EnergyData, EnergyPoint, GenerationUnit, EnergyArchetype };
export { ENERGY_ARCHETYPES };
