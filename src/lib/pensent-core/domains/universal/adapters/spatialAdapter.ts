/**
 * Spatial Domain Adapter
 * 
 * 3D temporal pattern recognition for physical spaces
 * Extends the 2D chess color flow system to volumetric analysis
 * 
 * Applications:
 * - Architecture: Building occupancy flows, structural stress patterns
 * - Urban Planning: Traffic density, population migration
 * - Drone Fleets: Swarm coordination, collision avoidance
 * - VR/AR: User movement heatmaps, gaze tracking
 * - Geography: Satellite change detection, terrain erosion
 * 
 * Patent-Pending: En Pensent 3D Color Flow Technology
 */

import type { DomainSignature } from '../types';

// 3D point with temporal tracking
export interface SpatialPoint {
  x: number;        // 0-1 normalized
  y: number;        // 0-1 normalized  
  z: number;        // 0-1 normalized
  timestamp: number;
  intensity: number; // Activity density at this point
  color: string;    // QR color code
}

// Volumetric cell in 3D octree
export interface OctreeCell {
  x: number;        // Octant X (0-7)
  y: number;        // Octant Y (0-7)
  z: number;        // Octant Z (0-7)
  occupancy: number; // 0-1 density
  flowVector: {     // Direction of movement through cell
    dx: number;
    dy: number;
    dz: number;
  };
  visitHistory: Array<{
    timestamp: number;
    intensity: number;
    source: string; // 'human', 'vehicle', 'drone', etc.
  }>;
}

// Spatial data input
export interface SpatialData {
  points: SpatialPoint[];
  bounds: {
    min: { x: number; y: number; z: number };
    max: { x: number; y: number; z: number };
  };
  timeRange: {
    start: number;
    end: number;
  };
  metadata?: {
    location?: string;
    type?: 'building' | 'urban' | 'terrain' | 'drone_swarm' | 'vr_space';
    scale?: 'micro' | 'human' | 'architectural' | 'urban' | 'geographic';
  };
}

// Spatial archetypes
export type SpatialArchetype = 
  | 'architectural_cascade'      // Multi-level vertical flow
  | 'urban_sprawl'               // Horizontal expansion pattern
  | 'drone_swarm'                // Coordinated 3D movement
  | 'concentrated_core'          // High density center
  | 'dispersed_periphery'        // Spread to edges
  | 'vertical_channel'           // Elevator/stairwell patterns
  | 'circulatory_loop'           // Circular pedestrian flow
  | 'collision_avoidance'        // Near-miss patterns
  | 'thermal_rising'             // Heat-driven convection
  | 'settling_sediment'          // Gravity-driven settling
  | 'explosive_dispersal'        // Rapid outward expansion
  | 'vacuum_compression';        // Inward collapse pattern

// Archetype definitions with visual colors
export const SPATIAL_ARCHETYPES: Record<SpatialArchetype, {
  description: string;
  color: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  typicalDuration: number; // minutes
}> = {
  architectural_cascade: {
    description: 'Vertical movement through building levels - people flow like water',
    color: '#3B82F6', // Blue
    riskLevel: 'low',
    typicalDuration: 15
  },
  urban_sprawl: {
    description: 'Horizontal expansion pattern - cities growing outward',
    color: '#10B981', // Green
    riskLevel: 'medium',
    typicalDuration: 1440 // 24 hours
  },
  drone_swarm: {
    description: 'Coordinated 3D movement with collision avoidance',
    color: '#8B5CF6', // Purple
    riskLevel: 'high',
    typicalDuration: 30
  },
  concentrated_core: {
    description: 'High density center with radial distribution',
    color: '#EF4444', // Red
    riskLevel: 'medium',
    typicalDuration: 60
  },
  dispersed_periphery: {
    description: 'Activity concentrated at edges, empty center',
    color: '#F59E0B', // Amber
    riskLevel: 'low',
    typicalDuration: 120
  },
  vertical_channel: {
    description: 'Elevator/stairwell bottleneck patterns',
    color: '#06B6D4', // Cyan
    riskLevel: 'high',
    typicalDuration: 5
  },
  circulatory_loop: {
    description: 'Circular pedestrian/vehicle flow patterns',
    color: '#84CC16', // Lime
    riskLevel: 'low',
    typicalDuration: 20
  },
  collision_avoidance: {
    description: 'Near-miss events indicating coordination stress',
    color: '#DC2626', // Dark red
    riskLevel: 'critical',
    typicalDuration: 1
  },
  thermal_rising: {
    description: 'Heat-driven convection currents',
    color: '#F97316', // Orange
    riskLevel: 'medium',
    typicalDuration: 10
  },
  settling_sediment: {
    description: 'Gravity-driven settling in fluids or powders',
    color: '#78716C', // Gray
    riskLevel: 'low',
    typicalDuration: 60
  },
  explosive_dispersal: {
    description: 'Rapid outward expansion from point source',
    color: '#7C2D12', // Dark red
    riskLevel: 'critical',
    typicalDuration: 0.5
  },
  vacuum_compression: {
    description: 'Inward collapse toward center',
    color: '#1E3A5F', // Navy
    riskLevel: 'high',
    typicalDuration: 2
  }
};

/**
 * Build 8x8x8 octree from spatial points
 */
function buildOctree(data: SpatialData): OctreeCell[][][] {
  const octree: OctreeCell[][][] = Array(8).fill(null).map(() =>
    Array(8).fill(null).map(() =>
      Array(8).fill(null).map((_, z) => ({
        x: 0, y: 0, z,
        occupancy: 0,
        flowVector: { dx: 0, dy: 0, dz: 0 },
        visitHistory: []
      }))
    )
  );

  // Populate octree with points
  data.points.forEach(point => {
    const octX = Math.min(7, Math.floor(point.x * 8));
    const octY = Math.min(7, Math.floor(point.y * 8));
    const octZ = Math.min(7, Math.floor(point.z * 8));

    const cell = octree[octX][octY][octZ];
    cell.occupancy = Math.min(1, cell.occupancy + point.intensity * 0.1);
    cell.visitHistory.push({
      timestamp: point.timestamp,
      intensity: point.intensity,
      source: 'unknown'
    });

    // Calculate flow vector from sequential points
    if (cell.visitHistory.length > 1) {
      const prev = cell.visitHistory[cell.visitHistory.length - 2];
      const curr = cell.visitHistory[cell.visitHistory.length - 1];
      cell.flowVector = {
        dx: (curr.timestamp - prev.timestamp) > 0 ? point.x - (octX / 8) : 0,
        dy: (curr.timestamp - prev.timestamp) > 0 ? point.y - (octY / 8) : 0,
        dz: (curr.timestamp - prev.timestamp) > 0 ? point.z - (octZ / 8) : 0
      };
    }
  });

  return octree;
}

/**
 * Generate 3D fingerprint hash
 */
function generate3DFingerprint(octree: OctreeCell[][][]): string {
  const occupancyMap: string[] = [];
  
  for (let x = 0; x < 8; x++) {
    for (let y = 0; y < 8; y++) {
      for (let z = 0; z < 8; z++) {
        const cell = octree[x][y][z];
        const flowDir = cell.flowVector.dx + cell.flowVector.dy + cell.flowVector.dz > 0 ? 'f' : 's';
        occupancyMap.push(`${Math.round(cell.occupancy * 9)}${flowDir}`);
      }
    }
  }

  const mapString = occupancyMap.join('');
  let hash = 0;
  for (let i = 0; i < mapString.length; i++) {
    const char = mapString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }

  return `sp-3d-${Math.abs(hash).toString(36).substring(0, 8)}`;
}

/**
 * Calculate quadrant profile for 3D space
 */
function calculate3DQuadrantProfile(octree: OctreeCell[][][]): {
  aggressive: number;    // X-axis penetration (forward)
  defensive: number;     // Y-axis spread (lateral)
  tactical: number;      // Z-axis elevation (vertical)
  strategic: number;     // Volume density (overall)
} {
  let xActivity = 0, yActivity = 0, zActivity = 0, totalOccupancy = 0;

  for (let x = 0; x < 8; x++) {
    for (let y = 0; y < 8; y++) {
      for (let z = 0; z < 8; z++) {
        const cell = octree[x][y][z];
        xActivity += cell.occupancy * (x / 8); // Weight by X position
        yActivity += cell.occupancy * (y / 8); // Weight by Y position
        zActivity += cell.occupancy * (z / 8); // Weight by Z position
        totalOccupancy += cell.occupancy;
      }
    }
  }

  const volume = 8 * 8 * 8;
  const density = totalOccupancy / volume;

  return {
    aggressive: Math.min(1, xActivity / (totalOccupancy || 1)),
    defensive: Math.min(1, yActivity / (totalOccupancy || 1)),
    tactical: Math.min(1, zActivity / (totalOccupancy || 1)),
    strategic: density
  };
}

/**
 * Calculate temporal flow in 3 phases
 */
function calculate3DTemporalFlow(
  data: SpatialData,
  octree: OctreeCell[][][]
): {
  early: number;   // Setup/entry phase
  mid: number;     // Active occupancy
  late: number;    // Exit/settling
} {
  const duration = data.timeRange.end - data.timeRange.start;
  const earlyCutoff = data.timeRange.start + duration * 0.25;
  const lateCutoff = data.timeRange.end - duration * 0.25;

  let earlyIntensity = 0, midIntensity = 0, lateIntensity = 0;

  data.points.forEach(point => {
    if (point.timestamp <= earlyCutoff) {
      earlyIntensity += point.intensity;
    } else if (point.timestamp >= lateCutoff) {
      lateIntensity += point.intensity;
    } else {
      midIntensity += point.intensity;
    }
  });

  const total = earlyIntensity + midIntensity + lateIntensity || 1;

  return {
    early: earlyIntensity / total,
    mid: midIntensity / total,
    late: lateIntensity / total
  };
}

/**
 * Find critical moments (sudden density shifts)
 */
function find3DCriticalMoments(data: SpatialData): Array<{
  timestamp: number;
  shiftMagnitude: number;
  location: { x: number; y: number; z: number };
  description: string;
}> {
  const moments: Array<{
    timestamp: number;
    shiftMagnitude: number;
    location: { x: number; y: number; z: number };
    description: string;
  }> = [];

  // Sort points by time
  const sortedPoints = [...data.points].sort((a, b) => a.timestamp - b.timestamp);
  
  // Calculate global occupancy per time slice (1-second bins)
  const timeSlices = new Map<number, number>();
  sortedPoints.forEach(point => {
    const second = Math.floor(point.timestamp / 1000);
    timeSlices.set(second, (timeSlices.get(second) || 0) + point.intensity);
  });

  const sortedSeconds = Array.from(timeSlices.keys()).sort((a, b) => a - b);
  
  for (let i = 1; i < sortedSeconds.length; i++) {
    const prev = timeSlices.get(sortedSeconds[i - 1]) || 0;
    const curr = timeSlices.get(sortedSeconds[i]) || 0;
    const shift = Math.abs(curr - prev);
    
    if (shift > prev * 0.5) { // 50% change threshold
      // Find approximate location of the shift
      const shiftPoints = sortedPoints.filter(p => 
        Math.floor(p.timestamp / 1000) === sortedSeconds[i]
      );
      const avgLocation = shiftPoints.length > 0 ? {
        x: shiftPoints.reduce((sum, p) => sum + p.x, 0) / shiftPoints.length,
        y: shiftPoints.reduce((sum, p) => sum + p.y, 0) / shiftPoints.length,
        z: shiftPoints.reduce((sum, p) => sum + p.z, 0) / shiftPoints.length
      } : { x: 0.5, y: 0.5, z: 0.5 };

      moments.push({
        timestamp: sortedSeconds[i] * 1000,
        shiftMagnitude: shift,
        location: avgLocation,
        description: curr > prev ? 'Sudden influx detected' : 'Rapid evacuation pattern'
      });
    }
  }

  return moments.slice(0, 5); // Top 5 critical moments
}

/**
 * Classify spatial archetype
 */
function classifySpatialArchetype(
  octree: OctreeCell[][][],
  quadrant: { aggressive: number; defensive: number; tactical: number; strategic: number }
): SpatialArchetype {
  // Check for collision avoidance (rapid vector changes)
  let vectorChanges = 0;
  for (let x = 0; x < 8; x++) {
    for (let y = 0; y < 8; y++) {
      for (let z = 0; z < 8; z++) {
        const cell = octree[x][y][z];
        if (cell.visitHistory.length > 1) {
          const vectorMag = Math.sqrt(
            cell.flowVector.dx ** 2 + 
            cell.flowVector.dy ** 2 + 
            cell.flowVector.dz ** 2
          );
          if (vectorMag > 0.5) vectorChanges++;
        }
      }
    }
  }
  
  if (vectorChanges > 20) return 'collision_avoidance';

  // Check for concentrated core vs dispersed periphery
  const centerOccupancy = octree[3][3][3].occupancy + octree[4][4][4].occupancy;
  const edgeOccupancy = 
    octree[0][0][0].occupancy + octree[7][7][7].occupancy +
    octree[0][7][0].occupancy + octree[7][0][7].occupancy;
  
  if (centerOccupancy > edgeOccupancy * 2) return 'concentrated_core';
  if (edgeOccupancy > centerOccupancy * 2) return 'dispersed_periphery';

  // Check vertical vs horizontal dominance
  if (quadrant.tactical > quadrant.aggressive && quadrant.tactical > quadrant.defensive) {
    return quadrant.strategic > 0.5 ? 'architectural_cascade' : 'vertical_channel';
  }

  // Check for swarm patterns (distributed but coordinated)
  const activeCells = octree.flat(2).filter(c => c.occupancy > 0.1).length;
  if (activeCells > 200 && quadrant.strategic < 0.3) return 'drone_swarm';

  // Check for urban sprawl (horizontal expansion)
  if (quadrant.defensive > quadrant.aggressive && quadrant.defensive > quadrant.tactical) {
    return 'urban_sprawl';
  }

  // Check for circulatory (circular movement)
  const circularVectors = octree.flat(2).filter(c => {
    const mag = Math.sqrt(c.flowVector.dx ** 2 + c.flowVector.dy ** 2);
    return mag > 0.1 && Math.abs(c.flowVector.dz) < 0.1; // Horizontal flow
  }).length;
  if (circularVectors > activeCells * 0.6) return 'circulatory_loop';

  // Default to architectural cascade
  return 'architectural_cascade';
}

/**
 * Extract complete 3D spatial signature
 */
export function extractSpatialSignature(data: SpatialData): DomainSignature & {
  fingerprint: string;
  archetype: SpatialArchetype;
  criticalMoments: Array<{
    timestamp: number;
    shiftMagnitude: number;
    location: { x: number; y: number; z: number };
    description: string;
  }>;
  octree: OctreeCell[][][];
  dominantAxis: 'x' | 'y' | 'z' | 'balanced';
} {
  const octree = buildOctree(data);
  const quadrantProfile = calculate3DQuadrantProfile(octree);
  const temporalFlow = calculate3DTemporalFlow(data, octree);
  const criticalMoments = find3DCriticalMoments(data);
  const archetype = classifySpatialArchetype(octree, quadrantProfile);
  const fingerprint = generate3DFingerprint(octree);

  // Calculate intensity
  const totalOccupancy = octree.flat(2).reduce((sum, cell) => sum + cell.occupancy, 0);
  const intensity = Math.min(1, totalOccupancy / (8 * 8 * 8));

  // Determine dominant axis
  const maxVal = Math.max(quadrantProfile.aggressive, quadrantProfile.defensive, quadrantProfile.tactical);
  let dominantAxis: 'x' | 'y' | 'z' | 'balanced' = 'balanced';
  if (maxVal === quadrantProfile.aggressive) dominantAxis = 'x';
  else if (maxVal === quadrantProfile.defensive) dominantAxis = 'y';
  else if (maxVal === quadrantProfile.tactical) dominantAxis = 'z';

  return {
    domain: 'chess', // Using closest available - will add 'spatial' to types
    quadrantProfile: {
      aggressive: quadrantProfile.aggressive,
      defensive: quadrantProfile.defensive,
      tactical: quadrantProfile.tactical,
      strategic: quadrantProfile.strategic
    },
    temporalFlow,
    intensity,
    momentum: intensity * 0.8,
    volatility: criticalMoments.length / 5,
    dominantFrequency: totalOccupancy,
    harmonicResonance: 1 - Math.abs(quadrantProfile.aggressive - quadrantProfile.defensive),
    phaseAlignment: (quadrantProfile.tactical + quadrantProfile.strategic) / 2,
    extractedAt: Date.now(),
    fingerprint,
    archetype,
    criticalMoments,
    octree,
    dominantAxis
  };
}

/**
 * Predict spatial outcome based on archetype
 */
export function predictSpatialOutcome(
  signature: ReturnType<typeof extractSpatialSignature>
): {
  predictedOutcome: 'stable' | 'congestion' | 'evacuation' | 'collision' | 'optimal';
  confidence: number;
  timeToEvent: number; // seconds
  recommendations: string[];
} {
  const archetype = SPATIAL_ARCHETYPES[signature.archetype];
  const riskLevel = archetype.riskLevel;

  let predictedOutcome: 'stable' | 'congestion' | 'evacuation' | 'collision' | 'optimal';
  let recommendations: string[] = [];

  switch (signature.archetype) {
    case 'collision_avoidance':
      predictedOutcome = 'collision';
      recommendations = [
        'Implement coordinated routing protocol',
        'Reduce simultaneous active agents by 30%',
        'Add vertical separation layers'
      ];
      break;
    case 'concentrated_core':
      predictedOutcome = signature.intensity > 0.8 ? 'congestion' : 'stable';
      recommendations = [
        'Open overflow capacity at periphery',
        'Stagger entry times',
        'Activate secondary egress routes'
      ];
      break;
    case 'vertical_channel':
      predictedOutcome = signature.temporalFlow.mid > 0.5 ? 'congestion' : 'stable';
      recommendations = [
        'Activate all elevator banks',
        'Open stairwell bidirectional flow',
        'Implement floor-based timing'
      ];
      break;
    case 'drone_swarm':
      predictedOutcome = signature.volatility > 0.5 ? 'collision' : 'optimal';
      recommendations = [
        'Maintain swarm cohesion algorithms',
        'Pre-position emergency landing zones',
        'Monitor battery depletion timing'
      ];
      break;
    case 'explosive_dispersal':
      predictedOutcome = 'evacuation';
      recommendations = [
        'EMERGENCY: Clear all pathways immediately',
        'Activate emergency egress lighting',
        'Disable all entry points'
      ];
      break;
    default:
      predictedOutcome = 'stable';
      recommendations = [
        'Monitor density levels',
        'Maintain current routing',
        'Prepare contingency capacity'
      ];
  }

  // Confidence based on data quality
  const dataQuality = Math.min(1, signature.criticalMoments.length / 3);
  const patternClarity = 1 - signature.volatility;
  const confidence = (dataQuality * 0.4 + patternClarity * 0.6);

  // Time to event estimation
  const timeToEvent = riskLevel === 'critical' ? 30 :
                      riskLevel === 'high' ? 120 :
                      riskLevel === 'medium' ? 300 : 600;

  return {
    predictedOutcome,
    confidence,
    timeToEvent,
    recommendations
  };
}
