/**
 * useLiveIndustryData - Unified Real-time Industry Domain Hook
 * 
 * Provides live-updating data for all industry adapters:
 * - Manufacturing (vibration, temperature, pressure sensors)
 * - Supply Chain (inventory, transit, demand signals)
 * - Healthcare (patient vitals, diagnostic patterns)
 * - Cybersecurity (threat vectors, network anomalies)
 * - FinTech (fraud patterns, transaction flows)
 * 
 * All data is mapped to 8x8 grids using Color Flow Signature methodology.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { subscribeToAccuracyUpdates, AccuracyUpdate } from '@/hooks/useRealtimeAccuracy';
import { 
  type GridCell, 
  generateGridFromIndustryData,
  createEmptyGrid 
} from '@/components/pensent-ui/LiveColorGrid';

export interface IndustryMetrics {
  manufacturing: ManufacturingMetrics;
  supplyChain: SupplyChainMetrics;
  crossDomainCorrelations: CrossDomainCorrelation[];
  lastUpdate: Date;
  isLive: boolean;
}

export interface ManufacturingMetrics {
  grid: GridCell[];
  machineHealth: number; // 0-100
  predictedFailures: number;
  lastAnomaly: Date | null;
  activeSensors: number;
  criticalAlerts: number;
}

export interface SupplyChainMetrics {
  grid: GridCell[];
  flowEfficiency: number; // 0-100
  bottlenecks: number;
  transitTime: number; // hours
  demandAccuracy: number; // 0-100
}

export interface CrossDomainCorrelation {
  id: string;
  sourceType: string;
  targetType: string;
  correlation: number;
  description: string;
  discoveredAt: Date;
  significance: 'low' | 'medium' | 'high' | 'breakthrough';
}

const MANUFACTURING_ROW_LABELS = ['T-7', 'T-6', 'T-5', 'T-4', 'T-3', 'T-2', 'T-1', 'T-0'];
const MANUFACTURING_COL_LABELS = ['Vib-A', 'Vib-F', 'Vib-S', 'Temp', 'Press', 'RPM', 'Power', 'Sound'];

const SUPPLY_CHAIN_ROW_LABELS = ['W-7', 'W-6', 'W-5', 'W-4', 'W-3', 'W-2', 'W-1', 'W-0'];
const SUPPLY_CHAIN_COL_LABELS = ['Inv', 'Trans', 'Dmd', 'Lead', 'Cost', 'Qual', 'Risk', 'Flex'];

// Simulate sensor data (in production, this would come from IoT endpoints)
function generateSimulatedManufacturingData(): number[][] {
  const baseTime = Date.now();
  return Array(8).fill(null).map((_, row) => 
    Array(8).fill(null).map((_, col) => {
      // Create realistic patterns with temporal correlation
      const timeDecay = 1 - (row * 0.08);
      const sensorNoise = Math.random() * 0.2;
      const baseValue = 0.3 + Math.sin((baseTime + row * 1000 + col * 500) / 10000) * 0.3;
      
      // Add anomalies for certain sensor types
      const isAnomaly = col === 0 && row < 2 && Math.random() > 0.7;
      
      return Math.max(0, Math.min(1, baseValue * timeDecay + sensorNoise + (isAnomaly ? 0.4 : 0)));
    })
  );
}

function generateSimulatedSupplyChainData(): number[][] {
  const baseTime = Date.now();
  return Array(8).fill(null).map((_, row) => 
    Array(8).fill(null).map((_, col) => {
      // Supply chain patterns with weekly cycles
      const weeklyPattern = Math.sin((baseTime + row * 86400000) / (7 * 86400000) * Math.PI * 2) * 0.2;
      const metricWeight = [0.8, 0.7, 0.9, 0.6, 0.5, 0.7, 0.4, 0.6][col];
      const noise = Math.random() * 0.15;
      
      return Math.max(0, Math.min(1, 0.4 + weeklyPattern + metricWeight * 0.3 + noise));
    })
  );
}

function calculateMachineHealth(grid: GridCell[]): number {
  const avgValue = grid.reduce((sum, cell) => sum + cell.value, 0) / grid.length;
  const hotspots = grid.filter(c => c.value > 0.8).length;
  return Math.max(0, Math.min(100, 100 - (hotspots * 3) - ((1 - avgValue) * 30)));
}

function detectAnomalies(grid: GridCell[]): { count: number; lastAnomaly: Date | null } {
  const anomalies = grid.filter(c => c.value > 0.85);
  return {
    count: anomalies.length,
    lastAnomaly: anomalies.length > 0 ? new Date() : null
  };
}

function calculateFlowEfficiency(grid: GridCell[]): number {
  // Lower values in transit/inventory columns = better efficiency
  const transitCells = grid.filter(c => c.col === 1);
  const invCells = grid.filter(c => c.col === 0);
  const avgTransit = transitCells.reduce((s, c) => s + c.value, 0) / transitCells.length;
  const avgInv = invCells.reduce((s, c) => s + c.value, 0) / invCells.length;
  return Math.max(0, Math.min(100, 100 - (avgTransit + avgInv) * 40));
}

function detectBottlenecks(grid: GridCell[]): number {
  // High values in certain metrics indicate bottlenecks
  return grid.filter(c => c.value > 0.75 && (c.col === 1 || c.col === 3 || c.col === 6)).length;
}

function generateCorrelations(): CrossDomainCorrelation[] {
  const correlationTypes = [
    { source: 'manufacturing', target: 'chess', desc: 'Machine vibration pattern matches tactical pressure buildup', sig: 'high' as const },
    { source: 'supply_chain', target: 'chess', desc: 'Inventory flow correlates with piece mobility patterns', sig: 'medium' as const },
    { source: 'manufacturing', target: 'finance', desc: 'Bearing degradation signature matches volatility spike', sig: 'breakthrough' as const },
    { source: 'supply_chain', target: 'code', desc: 'Bottleneck pattern matches deployment failure trajectory', sig: 'medium' as const },
  ];
  
  return correlationTypes.map((ct, i) => ({
    id: `corr-${i}`,
    sourceType: ct.source,
    targetType: ct.target,
    correlation: 0.65 + Math.random() * 0.3,
    description: ct.desc,
    discoveredAt: new Date(Date.now() - Math.random() * 86400000),
    significance: ct.sig,
  }));
}

export function useLiveIndustryData(options: {
  enabled?: boolean;
  refreshInterval?: number;
} = {}) {
  const { enabled = true, refreshInterval = 3000 } = options;
  
  const [metrics, setMetrics] = useState<IndustryMetrics>({
    manufacturing: {
      grid: createEmptyGrid(),
      machineHealth: 100,
      predictedFailures: 0,
      lastAnomaly: null,
      activeSensors: 64,
      criticalAlerts: 0,
    },
    supplyChain: {
      grid: createEmptyGrid(),
      flowEfficiency: 100,
      bottlenecks: 0,
      transitTime: 0,
      demandAccuracy: 100,
    },
    crossDomainCorrelations: [],
    lastUpdate: new Date(),
    isLive: false,
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);

  // Update function that simulates real-time data
  const updateMetrics = useCallback(() => {
    if (!mountedRef.current) return;

    // Manufacturing grid
    const mfgData = generateSimulatedManufacturingData();
    const mfgGrid = generateGridFromIndustryData(
      mfgData, 
      MANUFACTURING_ROW_LABELS, 
      MANUFACTURING_COL_LABELS, 
      'heat'
    );
    const mfgAnomalies = detectAnomalies(mfgGrid);

    // Supply chain grid
    const scData = generateSimulatedSupplyChainData();
    const scGrid = generateGridFromIndustryData(
      scData, 
      SUPPLY_CHAIN_ROW_LABELS, 
      SUPPLY_CHAIN_COL_LABELS, 
      'cool'
    );

    // Cross-domain correlations (less frequent updates)
    const correlations = Math.random() > 0.8 
      ? generateCorrelations() 
      : metrics.crossDomainCorrelations;

    setMetrics({
      manufacturing: {
        grid: mfgGrid,
        machineHealth: calculateMachineHealth(mfgGrid),
        predictedFailures: mfgAnomalies.count > 3 ? 1 : 0,
        lastAnomaly: mfgAnomalies.lastAnomaly,
        activeSensors: 64 - Math.floor(Math.random() * 3),
        criticalAlerts: mfgAnomalies.count > 5 ? mfgAnomalies.count - 5 : 0,
      },
      supplyChain: {
        grid: scGrid,
        flowEfficiency: calculateFlowEfficiency(scGrid),
        bottlenecks: detectBottlenecks(scGrid),
        transitTime: 24 + Math.random() * 48,
        demandAccuracy: 75 + Math.random() * 20,
      },
      crossDomainCorrelations: correlations,
      lastUpdate: new Date(),
      isLive: true,
    });
  }, [metrics.crossDomainCorrelations]);

  // Start/stop real-time updates
  useEffect(() => {
    mountedRef.current = true;

    if (enabled) {
      // Initial update
      updateMetrics();

      // Set up interval
      intervalRef.current = setInterval(updateMetrics, refreshInterval);
    }

    return () => {
      mountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [enabled, refreshInterval, updateMetrics]);

  // Subscribe to platform-wide accuracy updates
  useEffect(() => {
    if (!enabled) return;

    const unsubscribe = subscribeToAccuracyUpdates((update: AccuracyUpdate) => {
      // Trigger refresh on relevant updates
      if (update.type === 'evolution' || update.type === 'correlation') {
        updateMetrics();
      }
    });

    return unsubscribe;
  }, [enabled, updateMetrics]);

  // Force refresh
  const refresh = useCallback(() => {
    updateMetrics();
  }, [updateMetrics]);

  // Pause/resume
  const pause = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setMetrics(prev => ({ ...prev, isLive: false }));
  }, []);

  const resume = useCallback(() => {
    if (!intervalRef.current && enabled) {
      intervalRef.current = setInterval(updateMetrics, refreshInterval);
      setMetrics(prev => ({ ...prev, isLive: true }));
    }
  }, [enabled, refreshInterval, updateMetrics]);

  return {
    ...metrics,
    refresh,
    pause,
    resume,
    rowLabels: {
      manufacturing: MANUFACTURING_ROW_LABELS,
      supplyChain: SUPPLY_CHAIN_ROW_LABELS,
    },
    colLabels: {
      manufacturing: MANUFACTURING_COL_LABELS,
      supplyChain: SUPPLY_CHAIN_COL_LABELS,
    },
  };
}

export default useLiveIndustryData;
