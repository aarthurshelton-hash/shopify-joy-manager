/**
 * Climate Domain Adapter
 * 
 * Temporal pattern recognition for atmospheric and environmental data
 * Weather patterns, climate change, extreme event prediction
 * 
 * Applications:
 * - Weather forecasting: Storm prediction, temperature trends
 * - Climate monitoring: Long-term pattern shifts, anomaly detection
 * - Agriculture: Growing season prediction, frost warnings
 * - Disaster preparedness: Hurricane, flood, wildfire prediction
 * - Energy demand: Heating/cooling load forecasting
 * - Air quality: Pollution pattern recognition, health alerts
 * 
 * Patent-Pending: En Pensent™ Climate Temporal Analysis
 */

import type { DomainSignature } from '../types';

// Climate telemetry point
export interface ClimatePoint {
  timestamp: number;
  
  // Temperature
  temperature: number;         // Celsius normalized (-1 to 1 representing -50C to 50C)
  tempTrend: number;           // Rate of change per hour
  heatIndex: number;           // Perceived temperature (normalized)
  
  // Pressure and wind
  barometricPressure: number;  // hPa normalized (980-1050)
  pressureTrend: number;       // Rising/falling indicator
  windSpeed: number;           // m/s normalized (0-50)
  windDirection: number;       // Degrees 0-360
  gustSpeed: number;           // Peak wind (normalized)
  
  // Moisture
  humidity: number;            // Relative humidity 0-1
  dewPoint: number;            // Normalized
  precipitation: number;       // mm/hour (normalized 0-100)
  cloudCover: number;          // 0-1 (clear to overcast)
  
  // Severe weather indicators
  lightningActivity: number;   // Strikes per hour (normalized)
  tornadoVorticity: number;    // Rotation strength (normalized)
  hailProbability: number;     // 0-1
  uvIndex: number;             // 0-11 normalized
  
  // Air quality
  pm25: number;                // Particulate matter (normalized)
  ozone: number;               // O3 levels (normalized)
  aqi: number;                 // Air Quality Index 0-1
  
  // Location
  latitude: number;
  longitude: number;
  elevation: number;          // meters normalized
  region: string;              // Geographic region code
}

// Weather system cell
export interface WeatherCell {
  x: number;                   // Grid X (0-15)
  y: number;                   // Grid Y (0-15)
  pressureCenter: number;      // Low/high pressure intensity
  windField: {
    speed: number;
    direction: number;
  };
  precipitationIntensity: number;
  severity: 'calm' | 'moderate' | 'severe' | 'extreme';
}

// Climate data input
export interface ClimateData {
  region: string;
  climateType: 'temperate' | 'tropical' | 'arid' | 'polar' | 'continental' | 'mediterranean';
  season: 'spring' | 'summer' | 'fall' | 'winter';
  
  points: ClimatePoint[];
  grid: WeatherCell[][];       // 16x16 regional grid
  
  timeRange: {
    start: number;
    end: number;
  };
  
  metadata?: {
    stationId?: string;
    elevation?: number;
    proximityToWater?: 'coastal' | 'inland' | 'lake';
    urbanDensity?: 'rural' | 'suburban' | 'urban';
  };
}

// Climate archetypes (weather patterns)
export type ClimateArchetype =
  | 'high_pressure_dominance'    // Clear stable weather
  | 'low_pressure_approach'        // Storm system incoming
  | 'frontal_passage'            // Sharp transition
  | 'convective_instability'     // Thunderstorm potential
  | 'tropical_cyclogenesis'      // Hurricane formation
  | 'blocking_pattern'           // Stalled weather system
  | 'jet_stream_perturbation'    // Upper atmosphere disruption
  | 'diurnal_variation'          // Day-night temperature swing
  | 'seasonal_transition'        // Spring/fall pattern shift
  | 'heat_dome'                  // Extreme heat event
  | 'polar_vortex_disruption'    // Cold air outbreak
  | 'atmospheric_river'          // Moisture transport corridor
  | 'drought_intensification'    // Prolonged dry period
  | 'monsoonal_burst'            // Heavy seasonal rain
  | 'sand_transport'             // Dust storm pattern
  | 'thermal_inversion'          // Pollution trapping layer
  | 'lightning_supercluster'     // Intense electrical activity
  | 'flash_flood_precursor';     // Rapid rainfall accumulation

// Archetype definitions with alert levels
export const CLIMATE_ARCHETYPES: Record<ClimateArchetype, {
  description: string;
  color: string;
  alertLevel: 'clear' | 'watch' | 'advisory' | 'warning' | 'emergency';
  typicalDuration: number; // hours
  actionRequired: boolean;
}> = {
  high_pressure_dominance: {
    description: 'Clear stable weather with light winds',
    color: '#3B82F6', // Blue
    alertLevel: 'clear',
    typicalDuration: 72,
    actionRequired: false
  },
  low_pressure_approach: {
    description: 'Storm system incoming, deteriorating conditions',
    color: '#F59E0B', // Amber
    alertLevel: 'watch',
    typicalDuration: 24,
    actionRequired: false
  },
  frontal_passage: {
    description: 'Sharp transition between air masses',
    color: '#6366F1', // Indigo
    alertLevel: 'advisory',
    typicalDuration: 6,
    actionRequired: false
  },
  convective_instability: {
    description: 'Thunderstorm potential with rising CAPE',
    color: '#8B5CF6', // Purple
    alertLevel: 'watch',
    typicalDuration: 12,
    actionRequired: false
  },
  tropical_cyclogenesis: {
    description: 'Hurricane/tropical storm formation detected',
    color: '#DC2626', // Red
    alertLevel: 'emergency',
    typicalDuration: 168,
    actionRequired: true
  },
  blocking_pattern: {
    description: 'Stalled weather system causing prolonged conditions',
    color: '#78716C', // Gray
    alertLevel: 'advisory',
    typicalDuration: 336,
    actionRequired: false
  },
  jet_stream_perturbation: {
    description: 'Upper atmosphere disruption affecting surface weather',
    color: '#0EA5E9', // Sky blue
    alertLevel: 'watch',
    typicalDuration: 48,
    actionRequired: false
  },
  diurnal_variation: {
    description: 'Normal day-night temperature and wind swing',
    color: '#22C55E', // Green
    alertLevel: 'clear',
    typicalDuration: 24,
    actionRequired: false
  },
  seasonal_transition: {
    description: 'Spring/fall pattern shift with instability',
    color: '#84CC16', // Lime
    alertLevel: 'advisory',
    typicalDuration: 720,
    actionRequired: false
  },
  heat_dome: {
    description: 'Extreme heat event with dangerous temperatures',
    color: '#7C2D12', // Dark red
    alertLevel: 'emergency',
    typicalDuration: 72,
    actionRequired: true
  },
  polar_vortex_disruption: {
    description: 'Cold air outbreak from arctic intrusion',
    color: '#1E3A8A', // Dark blue
    alertLevel: 'warning',
    typicalDuration: 48,
    actionRequired: true
  },
  atmospheric_river: {
    description: 'Moisture transport corridor bringing heavy rain',
    color: '#0369A1', // Deep blue
    alertLevel: 'warning',
    typicalDuration: 72,
    actionRequired: true
  },
  drought_intensification: {
    description: 'Prolonged dry period with moisture deficit',
    color: '#B45309', // Brown
    alertLevel: 'advisory',
    typicalDuration: 2160,
    actionRequired: false
  },
  monsoonal_burst: {
    description: 'Heavy seasonal rainfall pattern',
    color: '#0C4A6E', // Navy
    alertLevel: 'warning',
    typicalDuration: 96,
    actionRequired: false
  },
  sand_transport: {
    description: 'Dust storm pattern with reduced visibility',
    color: '#A16207', // Yellow-brown
    alertLevel: 'advisory',
    typicalDuration: 12,
    actionRequired: false
  },
  thermal_inversion: {
    description: 'Pollution trapping layer, poor air quality',
    color: '#6B7280', // Gray
    alertLevel: 'advisory',
    typicalDuration: 48,
    actionRequired: false
  },
  lightning_supercluster: {
    description: 'Intense electrical activity cluster',
    color: '#A855F7', // Violet
    alertLevel: 'warning',
    typicalDuration: 3,
    actionRequired: true
  },
  flash_flood_precursor: {
    description: 'Rapid rainfall accumulation, flood risk',
    color: '#1D4ED8', // Royal blue
    alertLevel: 'emergency',
    typicalDuration: 6,
    actionRequired: true
  }
};

/**
 * Build 16x16 weather grid
 */
function buildWeatherGrid(data: ClimateData): WeatherCell[][] {
  return data.grid || Array(16).fill(null).map((_, x) =>
    Array(16).fill(null).map((_, y) => ({
      x, y,
      pressureCenter: 0.5,
      windField: { speed: 0.3, direction: 0 },
      precipitationIntensity: 0,
      severity: 'calm'
    }))
  );
}

/**
 * Generate climate fingerprint
 */
function generateClimateFingerprint(points: ClimatePoint[]): string {
  const recent = points.slice(-12); // Last 12 readings (3 hours at 15-min intervals)
  const avgPressure = recent.reduce((sum, p) => sum + p.barometricPressure, 0) / recent.length;
  const avgTemp = recent.reduce((sum, p) => sum + p.temperature, 0) / recent.length;
  const trend = recent[recent.length - 1].pressureTrend - recent[0].pressureTrend;
  
  const signature = `${Math.round(avgPressure * 100)}-${Math.round(avgTemp * 100)}-${Math.round(trend * 100)}`;
  
  let hash = 0;
  for (let i = 0; i < signature.length; i++) {
    const char = signature.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  return `clm-${Math.abs(hash).toString(36).substring(0, 8)}`;
}

/**
 * Calculate climate quadrant profile
 */
function calculateClimateQuadrantProfile(data: ClimateData): {
  aggressive: number;    // Storm intensity
  defensive: number;     // Stable/pressure ridge
  tactical: number;      // Rapid changes
  strategic: number;     // Long-term trend
} {
  const recentPoints = data.points.slice(-20);
  
  // Storm intensity (aggressive)
  const stormIndicators = recentPoints.filter(p => 
    p.windSpeed > 0.6 || 
    p.precipitation > 0.7 || 
    p.lightningActivity > 0.8
  ).length;
  const aggressive = stormIndicators / recentPoints.length;
  
  // Stable conditions (defensive)
  const stableConditions = recentPoints.filter(p => 
    Math.abs(p.pressureTrend) < 0.1 && 
    p.windSpeed < 0.3 && 
    p.cloudCover < 0.3
  ).length;
  const defensive = stableConditions / recentPoints.length;
  
  // Rapid changes (tactical)
  const rapidChanges = recentPoints.filter(p => 
    Math.abs(p.tempTrend) > 0.5 || 
    Math.abs(p.pressureTrend) > 0.3
  ).length;
  const tactical = rapidChanges / recentPoints.length;
  
  // Long-term trend (strategic)
  const earlyPoints = data.points.slice(0, Math.floor(data.points.length * 0.2));
  const latePoints = data.points.slice(-Math.floor(data.points.length * 0.2));
  const earlyTemp = earlyPoints.reduce((sum, p) => sum + p.temperature, 0) / earlyPoints.length;
  const lateTemp = latePoints.reduce((sum, p) => sum + p.temperature, 0) / latePoints.length;
  const strategic = lateTemp > earlyTemp ? 0.6 : 0.4;
  
  return {
    aggressive: Math.min(1, aggressive),
    defensive: Math.min(1, defensive),
    tactical: Math.min(1, tactical),
    strategic
  };
}

/**
 * Calculate temporal flow for climate phases
 */
function calculateClimateTemporalFlow(data: ClimateData): {
  early: number;   // Pre-event
  mid: number;     // Active weather
  late: number;    // Post-event/recovery
} {
  const duration = data.timeRange.end - data.timeRange.start;
  
  const preEvent = data.points.filter(p => 
    p.precipitation < 0.2 && 
    p.windSpeed < 0.3 && 
    Math.abs(p.pressureTrend) < 0.2
  ).length;
  
  const activeWeather = data.points.filter(p => 
    p.precipitation > 0.3 || 
    p.windSpeed > 0.5 || 
    Math.abs(p.pressureTrend) > 0.3
  ).length;
  
  const postEvent = data.points.filter(p => 
    p.precipitation < 0.2 && 
    (data.points.indexOf(p) > data.points.length * 0.7)
  ).length;
  
  const total = data.points.length || 1;
  
  return {
    early: preEvent / total,
    mid: activeWeather / total,
    late: postEvent / total
  };
}

/**
 * Find critical climate moments
 */
function findClimateCriticalMoments(data: ClimateData): Array<{
  timestamp: number;
  severity: number;
  type: string;
  description: string;
}> {
  const moments: Array<{
    timestamp: number;
    severity: number;
    type: string;
    description: string;
  }> = [];
  
  const sortedPoints = [...data.points].sort((a, b) => a.timestamp - b.timestamp);
  
  for (let i = 1; i < sortedPoints.length; i++) {
    const prev = sortedPoints[i - 1];
    const curr = sortedPoints[i];
    
    // Detect rapid pressure drop (storm approach)
    const pressureDrop = prev.barometricPressure - curr.barometricPressure;
    if (pressureDrop > 0.15) {
      moments.push({
        timestamp: curr.timestamp,
        severity: Math.min(1, pressureDrop * 3),
        type: 'pressure_fall',
        description: 'Rapid barometric pressure drop - storm approaching'
      });
    }
    
    // Detect temperature spike (heat event)
    if (curr.temperature > 0.9 && curr.heatIndex > 0.95) {
      moments.push({
        timestamp: curr.timestamp,
        severity: 0.9,
        type: 'extreme_heat',
        description: 'Dangerous heat index levels'
      });
    }
    
    // Detect severe wind
    if (curr.windSpeed > 0.8 || curr.gustSpeed > 0.9) {
      moments.push({
        timestamp: curr.timestamp,
        severity: Math.max(curr.windSpeed, curr.gustSpeed),
        type: 'severe_wind',
        description: 'Damaging wind gusts detected'
      });
    }
    
    // Detect flash flood conditions
    if (curr.precipitation > 0.8 && prev.precipitation > 0.6) {
      moments.push({
        timestamp: curr.timestamp,
        severity: 0.85,
        type: 'flash_flood_risk',
        description: 'Intense rainfall accumulation'
      });
    }
    
    // Detect lightning supercluster
    if (curr.lightningActivity > 0.9) {
      moments.push({
        timestamp: curr.timestamp,
        severity: 0.8,
        type: 'lightning_burst',
        description: 'Intense electrical activity'
      });
    }
  }
  
  return moments.slice(0, 10);
}

/**
 * Classify climate archetype
 */
function classifyClimateArchetype(
  data: ClimateData,
  quadrant: { aggressive: number; defensive: number; tactical: number; strategic: number },
  moments: ReturnType<typeof findClimateCriticalMoments>
): ClimateArchetype {
  // Check for severe weather first
  const severeWind = moments.filter(m => m.type === 'severe_wind' && m.severity > 0.8).length;
  const extremeHeat = moments.filter(m => m.type === 'extreme_heat').length;
  const flashFlood = moments.filter(m => m.type === 'flash_flood_risk').length;
  const lightningBurst = moments.filter(m => m.type === 'lightning_burst').length;
  
  if (extremeHeat > 2) return 'heat_dome';
  if (flashFlood > 2) return 'flash_flood_precursor';
  if (lightningBurst > 3) return 'lightning_supercluster';
  if (severeWind > 2 && quadrant.aggressive > 0.7) return 'tropical_cyclogenesis';
  
  // Check pressure patterns
  const recentPressure = data.points.slice(-5);
  const avgPressure = recentPressure.reduce((sum, p) => sum + p.barometricPressure, 0) / 5;
  const pressureTrend = recentPressure[recentPressure.length - 1].pressureTrend;
  
  if (avgPressure < 0.3 && pressureTrend < -0.2) return 'low_pressure_approach';
  if (avgPressure > 0.7 && Math.abs(pressureTrend) < 0.1) return 'high_pressure_dominance';
  
  // Check for blocking
  const pressureVariance = Math.max(...recentPressure.map(p => p.barometricPressure)) - 
                          Math.min(...recentPressure.map(p => p.barometricPressure));
  if (pressureVariance < 0.1 && recentPressure.length > 10) return 'blocking_pattern';
  
  // Check rapid changes
  if (quadrant.tactical > 0.6) return 'frontal_passage';
  
  // Check instability
  const instabilityScore = data.points.filter(p => 
    p.temperature > 0.7 && p.humidity > 0.7
  ).length / data.points.length;
  if (instabilityScore > 0.5) return 'convective_instability';
  
  // Check seasonal patterns
  const tempRange = Math.max(...data.points.map(p => p.temperature)) - 
                    Math.min(...data.points.map(p => p.temperature));
  if (tempRange > 0.6 && quadrant.strategic > 0.5) return 'seasonal_transition';
  
  // Default to diurnal if calm
  if (quadrant.defensive > 0.6 && quadrant.tactical < 0.3) {
    return 'diurnal_variation';
  }
  
  return 'high_pressure_dominance';
}

/**
 * Extract complete climate signature
 */
export function extractClimateSignature(data: ClimateData): DomainSignature & {
  fingerprint: string;
  archetype: ClimateArchetype;
  criticalMoments: Array<{
    timestamp: number;
    severity: number;
    type: string;
    description: string;
  }>;
  weatherGrid: WeatherCell[][];
  stormSeverity: number;
}> {
  const weatherGrid = buildWeatherGrid(data);
  const quadrantProfile = calculateClimateQuadrantProfile(data);
  const temporalFlow = calculateClimateTemporalFlow(data);
  const criticalMoments = findClimateCriticalMoments(data);
  const archetype = classifyClimateArchetype(data, quadrantProfile, criticalMoments);
  const fingerprint = generateClimateFingerprint(data.points);
  
  // Calculate intensity (overall storminess)
  const avgStorminess = data.points.reduce((sum, p) => 
    sum + (p.windSpeed + p.precipitation + p.lightningActivity) / 3, 0
  ) / data.points.length;
  const intensity = Math.min(1, avgStorminess);
  
  // Storm severity
  const stormSeverity = Math.max(...criticalMoments.map(m => m.severity), 0);
  
  return {
    domain: 'chess', // Using closest available
    quadrantProfile: {
      aggressive: quadrantProfile.aggressive,
      defensive: quadrantProfile.defensive,
      tactical: quadrantProfile.tactical,
      strategic: quadrantProfile.strategic
    },
    temporalFlow,
    intensity,
    momentum: quadrantProfile.tactical > 0.5 ? 0.7 : 0.3,
    volatility: criticalMoments.length / 5,
    dominantFrequency: data.points.length / ((data.timeRange.end - data.timeRange.start) / 3600000),
    harmonicResonance: 1 - Math.abs(quadrantProfile.aggressive - quadrantProfile.defensive),
    phaseAlignment: quadrantProfile.strategic,
    extractedAt: Date.now(),
    fingerprint,
    archetype,
    criticalMoments,
    weatherGrid,
    stormSeverity
  };
}

/**
 * Predict climate outcome
 */
export function predictClimateOutcome(
  signature: ReturnType<typeof extractClimateSignature>
): {
  predictedOutcome: 'calm' | 'unsettled' | 'stormy' | 'severe' | 'extreme';
  confidence: number;
  timeToEvent: number; // hours
  recommendations: string[];
  alertLevel: 'clear' | 'watch' | 'advisory' | 'warning' | 'emergency';
}> {
  const archetype = CLIMATE_ARCHETYPES[signature.archetype];
  
  let predictedOutcome: 'calm' | 'unsettled' | 'stormy' | 'severe' | 'extreme';
  let recommendations: string[] = [];
  
  switch (signature.archetype) {
    case 'tropical_cyclogenesis':
    case 'heat_dome':
    case 'flash_flood_precursor':
      predictedOutcome = 'extreme';
      recommendations = [
        'EMERGENCY: Issue immediate weather warnings',
        'Activate emergency operations center',
        'Prepare for mass evacuation if tropical system',
        'Set up cooling centers for heat emergencies'
      ];
      break;
      
    case 'lightning_supercluster':
    case 'severe_wind':
    case 'polar_vortex_disruption':
      predictedOutcome = 'severe';
      recommendations = [
        'Issue severe weather warnings',
        'Secure outdoor objects and infrastructure',
        'Activate spotter networks',
        'Prepare emergency shelters'
      ];
      break;
      
    case 'convective_instability':
    case 'atmospheric_river':
    case 'monsoonal_burst':
      predictedOutcome = 'stormy';
      recommendations = [
        'Thunderstorm warnings likely',
        'Monitor for flash flooding',
        'Prepare for power outages',
        'Alert agricultural operations'
      ];
      break;
      
    case 'frontal_passage':
    case 'low_pressure_approach':
      predictedOutcome = 'unsettled';
      recommendations = [
        'Changing weather conditions expected',
        'Advise outdoor event planners',
        'Monitor for rapid temperature changes',
        'Prepare for mixed precipitation'
      ];
      break;
      
    case 'high_pressure_dominance':
    case 'diurnal_variation':
    default:
      predictedOutcome = 'calm';
      recommendations = [
        'Stable weather pattern continues',
        'Favorable conditions for outdoor activities',
        'Normal operations can proceed',
        'No significant weather impacts expected'
      ];
  }
  
  // Confidence based on data
  const dataQuality = Math.min(1, signature.criticalMoments.length / 3);
  const patternClarity = 1 - signature.volatility;
  const confidence = (dataQuality * 0.3 + patternClarity * 0.4 + (1 - signature.stormSeverity) * 0.3);
  
  // Time to event
  const timeToEvent = archetype.alertLevel === 'emergency' ? 6 :
                      archetype.alertLevel === 'warning' ? 12 :
                      archetype.alertLevel === 'advisory' ? 24 :
                      archetype.alertLevel === 'watch' ? 48 : 72;
  
  return {
    predictedOutcome,
    confidence,
    timeToEvent,
    recommendations,
    alertLevel: archetype.alertLevel
  };
}

// Type exports
export type { ClimateData, ClimatePoint, WeatherCell, ClimateArchetype };
