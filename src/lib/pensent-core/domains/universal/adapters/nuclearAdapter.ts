/**
 * Nuclear Domain Adapter
 * 
 * Temporal pattern recognition for nuclear reactor operations
 * Fission, fusion, and radioactive decay analysis
 * 
 * Applications:
 * - Nuclear power plants: Reactor health, fuel rod integrity
 * - Fusion research: Tokamak plasma stability, confinement quality  
 * - Radiation detection: Isotope identification, contamination spread
 * - Nuclear medicine: PET tracer flow, radiotherapy dose patterns
 * - Waste storage: Long-term decay monitoring, geological stability
 * 
 * Patent-Pending: En Pensent™ Nuclear Temporal Analysis
 */

import type { DomainSignature } from '../types';

// Nuclear reactor telemetry point
export interface NuclearPoint {
  timestamp: number;
  
  // Core metrics
  neutronFlux: number;        // Neutrons per cm² per second (normalized 0-1)
  powerLevel: number;          // % of rated thermal power
  coolantTemp: number;         // Outlet temperature (normalized)
  controlRodPosition: number;  // 0-1 (fully withdrawn to fully inserted)
  
  // Fuel metrics
  fuelBurnup: number;         // GWd/MTU (normalized)
  xenonPoisoning: number;      // Xe-135 reactivity impact
  samariumPoisoning: number;   // Sm-149 reactivity impact
  
  // Safety metrics
  radiationLevel: number;      // REM/hour at containment boundary
  pressure: number;            // Primary coolant pressure (normalized)
  flowRate: number;            // Coolant circulation rate
  
  // Location in core (for spatial analysis)
  fuelAssemblyX: number;       // 0-15 (fuel assembly grid)
  fuelAssemblyY: number;       // 0-15
  axialZone: number;          // 0-9 (bottom to top of core)
}

// Fuel assembly state
export interface FuelAssembly {
  x: number;
  y: number;
  burnup: number;
  powerDensity: number;
  voidFraction: number;        // Steam voids in coolant
  claddingIntegrity: number;   // 1 = perfect, 0 = failed
  history: Array<{
    timestamp: number;
    powerLevel: number;
    temperature: number;
  }>;
}

// Nuclear reactor data input
export interface NuclearData {
  reactorType: 'pwr' | 'bwr' | 'candu' | 'htgr' | 'sfr' | 'fusion_tokamak' | 'fusion_stellarator';
  powerRating: number;         // MW thermal
  fuelType: 'uo2' | 'mox' | 'th232' | 'triso' | 'metallic' | 'dt_fusion' | 'dd_fusion';
  
  points: NuclearPoint[];
  assemblies: FuelAssembly[];
  
  timeRange: {
    start: number;
    end: number;
  };
  
  metadata?: {
    facilityName?: string;
    reactorId?: string;
    operatingLicense?: string;
    safetySystems?: string[];
  };
}

// Nuclear archetypes (reactor operating modes)
export type NuclearArchetype =
 | 'controlled_burn'            // Normal steady-state operation
 | 'power_ascension'            // Ramping up from startup
 | 'power_reduction'            // Ramping down for maintenance
 | 'xenon_transient'            // Post-shutdown xenon buildup
 | 'load_following'             // Adjusting to grid demand
 | 'refueling_outage'           // Partial core replacement
 | 'emergency_scram'            // Rapid shutdown
 | 'cooldown_phase'             // Decay heat removal
 | 'cold_shutdown'              // Long-term maintenance
 | 'approach_to_critical'       // First startup sequence
 | 'thermal_cascade'           // Temperature instability
 | 'neutron_oscillation'        // Flux instability
 | 'fuel_failure_detected'      // Cladding breach
 | 'coolant_voiding'            // Loss of coolant condition
 | 'fusion_ignition'            // Fusion plasma sustained
 | 'magnetic_disruption'        // Tokamak plasma collapse
 | 'tritium_breeding'          // Fusion fuel cycle
 | 'decay_heat_management';    // Post-shutdown cooling

// Archetype definitions with safety colors
export const NUCLEAR_ARCHETYPES: Record<NuclearArchetype, {
  description: string;
  color: string;
  safetyLevel: 'normal' | 'caution' | 'alert' | 'emergency' | 'critical';
  typicalDuration: number; // minutes
  requiresAction: boolean;
}> = {
  controlled_burn: {
    description: 'Normal steady-state operation at power',
    color: '#22C55E', // Green
    safetyLevel: 'normal',
    typicalDuration: 1440, // 24 hours
    requiresAction: false
  },
  power_ascension: {
    description: 'Controlled ramp to operating power',
    color: '#3B82F6', // Blue
    safetyLevel: 'caution',
    typicalDuration: 180,
    requiresAction: false
  },
  power_reduction: {
    description: 'Controlled power decrease',
    color: '#60A5FA', // Light blue
    safetyLevel: 'caution',
    typicalDuration: 120,
    requiresAction: false
  },
  xenon_transient: {
    description: 'Post-shutdown xenon-135 buildup, can prevent restart',
    color: '#F59E0B', // Amber
    safetyLevel: 'alert',
    typicalDuration: 1440, // 24-72 hours
    requiresAction: true
  },
  load_following: {
    description: 'Adjusting output to match electrical grid demand',
    color: '#84CC16', // Lime
    safetyLevel: 'normal',
    typicalDuration: 60,
    requiresAction: false
  },
  refueling_outage: {
    description: 'Partial core replacement, maintenance',
    color: '#6366F1', // Indigo
    safetyLevel: 'caution',
    typicalDuration: 10080, // 1 week
    requiresAction: false
  },
  emergency_scram: {
    description: 'Rapid control rod insertion, emergency shutdown',
    color: '#EF4444', // Red
    safetyLevel: 'emergency',
    typicalDuration: 5,
    requiresAction: true
  },
  cooldown_phase: {
    description: 'Removing decay heat post-shutdown',
    color: '#F97316', // Orange
    safetyLevel: 'alert',
    typicalDuration: 2880, // 48 hours
    requiresAction: true
  },
  cold_shutdown: {
    description: 'Long-term maintenance mode',
    color: '#94A3B8', // Gray
    safetyLevel: 'normal',
    typicalDuration: 43200, // 30 days
    requiresAction: false
  },
  approach_to_critical: {
    description: 'First criticality during startup',
    color: '#8B5CF6', // Purple
    safetyLevel: 'caution',
    typicalDuration: 60,
    requiresAction: true
  },
  thermal_cascade: {
    description: 'Temperature feedback instability',
    color: '#DC2626', // Dark red
    safetyLevel: 'critical',
    typicalDuration: 2,
    requiresAction: true
  },
  neutron_oscillation: {
    description: 'Flux instability, spatial power oscillations',
    color: '#DC2626', // Dark red
    safetyLevel: 'critical',
    typicalDuration: 1,
    requiresAction: true
  },
  fuel_failure_detected: {
    description: 'Cladding breach, fission product release',
    color: '#991B1B', // Very dark red
    safetyLevel: 'emergency',
    typicalDuration: 30,
    requiresAction: true
  },
  coolant_voiding: {
    description: 'Loss of coolant condition, potential meltdown',
    color: '#7F1D1D', // Darkest red
    safetyLevel: 'critical',
    typicalDuration: 0.5,
    requiresAction: true
  },
  fusion_ignition: {
    description: 'Sustained fusion plasma, energy gain',
    color: '#A855F7', // Purple
    safetyLevel: 'normal',
    typicalDuration: 300,
    requiresAction: false
  },
  magnetic_disruption: {
    description: 'Plasma collapse in tokamak',
    color: '#F59E0B', // Amber
    safetyLevel: 'alert',
    typicalDuration: 0.1,
    requiresAction: true
  },
  tritium_breeding: {
    description: 'Lithium blanket producing fusion fuel',
    color: '#06B6D4', // Cyan
    safetyLevel: 'normal',
    typicalDuration: 1440,
    requiresAction: false
  },
  decay_heat_management: {
    description: 'Long-term post-shutdown cooling',
    color: '#FBBF24', // Yellow
    safetyLevel: 'caution',
    typicalDuration: 20160, // 2 weeks
    requiresAction: true
  }
};

/**
 * Build 16x16 fuel assembly grid (simplified core model)
 */
function buildCoreGrid(data: NuclearData): FuelAssembly[][] {
  const grid: FuelAssembly[][] = Array(16).fill(null).map((_, x) =>
    Array(16).fill(null).map((_, y) => {
      const assemblyData = data.assemblies.find(a => a.x === x && a.y === y);
      return assemblyData || {
        x, y,
        burnup: 0,
        powerDensity: 0,
        voidFraction: 0,
        claddingIntegrity: 1,
        history: []
      };
    })
  );

  // Update with telemetry points
  data.points.forEach(point => {
    const asmX = Math.min(15, Math.floor(point.fuelAssemblyX));
    const asmY = Math.min(15, Math.floor(point.fuelAssemblyY));
    
    if (grid[asmX] && grid[asmX][asmY]) {
      const assembly = grid[asmX][asmY];
      assembly.powerDensity = Math.max(assembly.powerDensity, point.powerLevel);
      assembly.burnup = Math.max(assembly.burnup, point.fuelBurnup);
      
      assembly.history.push({
        timestamp: point.timestamp,
        powerLevel: point.powerLevel,
        temperature: point.coolantTemp
      });
    }
  });

  return grid;
}

/**
 * Generate nuclear fingerprint hash
 */
function generateNuclearFingerprint(grid: FuelAssembly[][]): string {
  const burnupMap: string[] = [];
  
  for (let x = 0; x < 16; x++) {
    for (let y = 0; y < 16; y++) {
      const assembly = grid[x][y];
      const powerChar = assembly.powerDensity > 0.8 ? 'H' :
                       assembly.powerDensity > 0.5 ? 'M' :
                       assembly.powerDensity > 0.2 ? 'L' : 'N';
      burnupMap.push(`${Math.round(assembly.burnup * 9)}${powerChar}`);
    }
  }

  const mapString = burnupMap.join('');
  let hash = 0;
  for (let i = 0; i < mapString.length; i++) {
    const char = mapString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }

  return `nuc-${Math.abs(hash).toString(36).substring(0, 8)}`;
}

/**
 * Calculate quadrant profile for reactor core
 */
function calculateNuclearQuadrantProfile(grid: FuelAssembly[][]): {
  aggressive: number;    // High power density regions
  defensive: number;     // Low burnup/fresh fuel regions  
  tactical: number;      // Central control rod influence
  strategic: number;     // Overall core burnup uniformity
} {
  let highPower = 0, lowBurnup = 0, centerInfluence = 0, uniformity = 0;
  let totalAssemblies = 0;

  for (let x = 0; x < 16; x++) {
    for (let y = 0; y < 16; y++) {
      const assembly = grid[x][y];
      totalAssemblies++;
      
      // High power = aggressive (fission rate)
      if (assembly.powerDensity > 0.7) highPower++;
      
      // Low burnup = defensive (fresh fuel safety margin)
      if (assembly.burnup < 0.3) lowBurnup++;
      
      // Center influence based on distance from core center
      const centerDist = Math.sqrt(Math.pow(x - 7.5, 2) + Math.pow(y - 7.5, 2));
      centerInfluence += assembly.powerDensity * (1 - centerDist / 11);
      
      // Uniformity (variance from average)
      uniformity += assembly.powerDensity;
    }
  }

  const avgPower = uniformity / totalAssemblies;
  const variance = grid.flat().reduce((sum, a) => 
    sum + Math.pow(a.powerDensity - avgPower, 2), 0
  ) / totalAssemblies;

  return {
    aggressive: Math.min(1, highPower / (totalAssemblies * 0.3)),
    defensive: Math.min(1, lowBurnup / (totalAssemblies * 0.4)),
    tactical: Math.min(1, centerInfluence / (totalAssemblies * 0.5)),
    strategic: 1 - Math.min(1, variance * 4) // Higher variance = lower strategic
  };
}

/**
 * Calculate temporal flow for reactor phases
 */
function calculateNuclearTemporalFlow(data: NuclearData): {
  early: number;   // Startup/approach to critical
  mid: number;     // Power operation
  late: number;    // Shutdown/cooldown
} {
  const duration = data.timeRange.end - data.timeRange.start;
  
  let startupEnergy = 0, operationEnergy = 0, shutdownEnergy = 0;

  data.points.forEach(point => {
    const timeProgress = (point.timestamp - data.timeRange.start) / duration;
    
    if (timeProgress < 0.2) {
      startupEnergy += point.powerLevel * point.neutronFlux;
    } else if (timeProgress > 0.8) {
      shutdownEnergy += point.powerLevel * point.neutronFlux;
    } else {
      operationEnergy += point.powerLevel * point.neutronFlux;
    }
  });

  const total = startupEnergy + operationEnergy + shutdownEnergy || 1;

  return {
    early: startupEnergy / total,
    mid: operationEnergy / total,
    late: shutdownEnergy / total
  };
}

/**
 * Find critical moments (power excursions, transients)
 */
function findNuclearCriticalMoments(data: NuclearData): Array<{
  timestamp: number;
  powerChange: number;
  rodMovement: number;
  xenonImpact: number;
  description: string;
}> {
  const moments: Array<{
    timestamp: number;
    powerChange: number;
    rodMovement: number;
    xenonImpact: number;
    description: string;
  }> = [];

  // Sort by time
  const sortedPoints = [...data.points].sort((a, b) => a.timestamp - b.timestamp);

  for (let i = 1; i < sortedPoints.length; i++) {
    const prev = sortedPoints[i - 1];
    const curr = sortedPoints[i];
    
    const powerChange = Math.abs(curr.powerLevel - prev.powerLevel);
    const rodMovement = Math.abs(curr.controlRodPosition - prev.controlRodPosition);
    const xenonChange = Math.abs(curr.xenonPoisoning - prev.xenonPoisoning);
    
    // Detect significant events
    if (powerChange > 0.2 || rodMovement > 0.3 || xenonChange > 0.15) {
      let description = '';
      
      if (powerChange > 0.5 && curr.powerLevel < 0.1) {
        description = 'Emergency scram detected';
      } else if (rodMovement > 0.5) {
        description = 'Control rod transient';
      } else if (xenonChange > 0.2) {
        description = 'Xenon oscillation event';
      } else if (powerChange > 0.2) {
        description = curr.powerLevel > prev.powerLevel 
          ? 'Power ascension ramp' 
          : 'Power reduction sequence';
      } else {
        description = 'Minor transient';
      }
      
      moments.push({
        timestamp: curr.timestamp,
        powerChange,
        rodMovement,
        xenonImpact: xenonChange,
        description
      });
    }
  }

  return moments.slice(0, 10); // Top 10 critical events
}

/**
 * Classify nuclear archetype
 */
function classifyNuclearArchetype(
  data: NuclearData,
  temporalFlow: { early: number; mid: number; late: number },
  quadrant: { aggressive: number; defensive: number; tactical: number; strategic: number },
  moments: ReturnType<typeof findNuclearCriticalMoments>
): NuclearArchetype {
  // Check for emergencies first
  const scramEvents = moments.filter(m => m.description.includes('scram'));
  if (scramEvents.length > 0) return 'emergency_scram';
  
  const thermalEvents = moments.filter(m => m.description.includes('oscillation'));
  if (thermalEvents.length > 2) return 'neutron_oscillation';

  // Check xenon conditions
  const recentXenon = data.points.slice(-10).reduce((sum, p) => sum + p.xenonPoisoning, 0) / 10;
  if (recentXenon > 0.5 && temporalFlow.late > 0.3) return 'xenon_transient';

  // Check fusion conditions
  if (data.reactorType.includes('fusion')) {
    const avgTemp = data.points.reduce((sum, p) => sum + p.coolantTemp, 0) / data.points.length;
    if (avgTemp > 0.8) return 'fusion_ignition';
    
    const disruptions = moments.filter(m => m.powerChange > 0.8).length;
    if (disruptions > 3) return 'magnetic_disruption';
    
    return 'tritium_breeding';
  }

  // Check operating phase
  if (temporalFlow.early > 0.5) {
    if (quadrant.defensive > 0.7) return 'approach_to_critical';
    return 'power_ascension';
  }
  
  if (temporalFlow.late > 0.4) {
    if (quadrant.aggressive < 0.1) return 'cold_shutdown';
    if (quadrant.aggressive < 0.3) return 'decay_heat_management';
    return 'cooldown_phase';
  }

  // Check for load following
  const powerVariance = moments.length > 0 ? 
    moments.filter(m => m.powerChange > 0.1).length / moments.length : 0;
  if (powerVariance > 0.3) return 'load_following';

  // Check burnup patterns
  const avgBurnup = data.points.reduce((sum, p) => sum + p.fuelBurnup, 0) / data.points.length;
  if (avgBurnup < 0.1) return 'refueling_outage';

  // Default to controlled operation
  return 'controlled_burn';
}

/**
 * Extract complete nuclear signature
 */
export function extractNuclearSignature(data: NuclearData): DomainSignature & {
  fingerprint: string;
  archetype: NuclearArchetype;
  criticalMoments: Array<{
    timestamp: number;
    powerChange: number;
    rodMovement: number;
    xenonImpact: number;
    description: string;
  }>;
  coreGrid: FuelAssembly[][];
  reactivityTrend: 'rising' | 'falling' | 'stable';
  safetyMargin: number;
} {
  const coreGrid = buildCoreGrid(data);
  const quadrantProfile = calculateNuclearQuadrantProfile(coreGrid);
  const temporalFlow = calculateNuclearTemporalFlow(data);
  const criticalMoments = findNuclearCriticalMoments(data);
  const archetype = classifyNuclearArchetype(data, temporalFlow, quadrantProfile, criticalMoments);
  const fingerprint = generateNuclearFingerprint(coreGrid);

  // Calculate intensity (average power)
  const avgPower = data.points.reduce((sum, p) => sum + p.powerLevel, 0) / data.points.length;
  const intensity = avgPower;

  // Reactivity trend
  const earlyPower = data.points.slice(0, Math.floor(data.points.length * 0.2))
    .reduce((sum, p) => sum + p.powerLevel, 0) / (data.points.length * 0.2);
  const latePower = data.points.slice(-Math.floor(data.points.length * 0.2))
    .reduce((sum, p) => sum + p.powerLevel, 0) / (data.points.length * 0.2);
  
  let reactivityTrend: 'rising' | 'falling' | 'stable';
  if (latePower > earlyPower * 1.1) reactivityTrend = 'rising';
  else if (latePower < earlyPower * 0.9) reactivityTrend = 'falling';
  else reactivityTrend = 'stable';

  // Safety margin (distance from safety limits)
  const maxTemp = Math.max(...data.points.map(p => p.coolantTemp));
  const minRod = Math.min(...data.points.map(p => p.controlRodPosition));
  const safetyMargin = Math.min(
    (1 - maxTemp) * 0.5 + minRod * 0.5,
    1 - (criticalMoments.length / 10)
  );

  return {
    domain: 'chess',
    quadrantProfile: {
      aggressive: quadrantProfile.aggressive,
      defensive: quadrantProfile.defensive,
      tactical: quadrantProfile.tactical,
      strategic: quadrantProfile.strategic
    },
    temporalFlow,
    intensity,
    momentum: intensity * (reactivityTrend === 'rising' ? 1.2 : reactivityTrend === 'falling' ? 0.8 : 1.0),
    volatility: criticalMoments.length / 5,
    dominantFrequency: avgPower,
    harmonicResonance: 1 - Math.abs(quadrantProfile.aggressive - quadrantProfile.defensive),
    phaseAlignment: safetyMargin,
    extractedAt: Date.now(),
    fingerprint,
    archetype,
    criticalMoments,
    coreGrid,
    reactivityTrend,
    safetyMargin
  };
}

/**
 * Predict nuclear outcome
 */
export function predictNuclearOutcome(
  signature: ReturnType<typeof extractNuclearSignature>
): {
  predictedOutcome: 'stable_operation' | 'controlled_shutdown' | 'maintenance_required' | 'safety_alert' | 'emergency_scram';
  confidence: number;
  timeToEvent: number; // minutes
  recommendations: string[];
  regulatoryActions: string[];
} {
  const archetype = NUCLEAR_ARCHETYPES[signature.archetype];
  const safetyLevel = archetype.safetyLevel;

  let predictedOutcome: 'stable_operation' | 'controlled_shutdown' | 'maintenance_required' | 'safety_alert' | 'emergency_scram';
  let recommendations: string[] = [];
  let regulatoryActions: string[] = [];

  switch (signature.archetype) {
    case 'emergency_scram':
    case 'thermal_cascade':
    case 'neutron_oscillation':
    case 'fuel_failure_detected':
    case 'coolant_voiding':
      predictedOutcome = 'emergency_scram';
      recommendations = [
        'SCRAM REACTOR IMMEDIATELY',
        'Activate emergency core cooling systems',
        'Notify reactor operator and safety committee',
        'Begin emergency classification procedure'
      ];
      regulatoryActions = [
        'Report to NRC within 4 hours (10 CFR 50.72)',
        'Initiate root cause analysis',
        'Notify state and local authorities'
      ];
      break;

    case 'xenon_transient':
      predictedOutcome = 'controlled_shutdown';
      recommendations = [
        'Maintain shutdown until xenon decays (40-72 hours)',
        'Monitor secondary shutdown margin',
        'Prepare for restart only with excess reactivity'
      ];
      regulatoryActions = [
        'Document in operating log',
        'Technical specification review required'
      ];
      break;

    case 'fusion_ignition':
      predictedOutcome = 'stable_operation';
      recommendations = [
        'Maintain plasma current and confinement',
        'Monitor Q-factor (fusion gain)',
        'Optimize tritium burnup fraction',
        'Record achievement for ITER milestones'
      ];
      regulatoryActions = [
        'Report to DOE Office of Science',
        'Update fusion energy roadmap'
      ];
      break;

    case 'magnetic_disruption':
      predictedOutcome = 'maintenance_required';
      recommendations = [
        'Re-establish plasma equilibrium',
        'Check magnet coil integrity',
        'Clear disruptions before next pulse',
        'Update disruption prediction model'
      ];
      regulatoryActions = [
        'Document in experimental log',
        'Review plasma control algorithms'
      ];
      break;

    case 'controlled_burn':
    case 'load_following':
      predictedOutcome = 'stable_operation';
      recommendations = [
        `Maintain current power level: ${Math.round(signature.intensity * 100)}%`,
        'Monitor for xenon buildup during load changes',
        'Track fuel burnup and shuffle schedule',
        'Continue normal surveillance'
      ];
      regulatoryActions = [
        'Routine operational monitoring',
        '30-day report of power history'
      ];
      break;

    default:
      predictedOutcome = 'stable_operation';
      recommendations = [
        'Continue current operating mode',
        'Monitor safety margin: ' + Math.round(signature.safetyMargin * 100) + '%',
        'Watch for trend changes',
        'Prepare for next maintenance window'
      ];
      regulatoryActions = [
        'Normal operational reporting'
      ];
  }

  // Confidence based on data quality
  const dataQuality = Math.min(1, signature.criticalMoments.length / 5);
  const patternClarity = 1 - signature.volatility;
  const confidence = (dataQuality * 0.3 + patternClarity * 0.4 + signature.safetyMargin * 0.3);

  // Time to event
  const timeToEvent = safetyLevel === 'critical' ? 0.5 :
                      safetyLevel === 'emergency' ? 5 :
                      safetyLevel === 'alert' ? 60 :
                      safetyLevel === 'caution' ? 240 : 1440;

  return {
    predictedOutcome,
    confidence,
    timeToEvent,
    recommendations,
    regulatoryActions
  };
}
