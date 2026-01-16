/**
 * Codebase Synchronization Hook
 * 
 * Ensures all code readers and analyzers evaluate the precise CURRENT state
 * with cache invalidation, version tracking, and future-state awareness.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface CodebaseState {
  version: string;
  timestamp: Date;
  fileCount: number;
  totalLines: number;
  lastModified: Date;
  checksum: string;
}

export interface SyncStatus {
  isSynced: boolean;
  isStale: boolean;
  staleDuration: number; // seconds
  pendingChanges: number;
  lastSync: Date | null;
  nextScheduledSync: Date | null;
}

export interface FutureStateProjection {
  predictedChanges: string[];
  confidenceScore: number;
  estimatedImpact: 'low' | 'medium' | 'high';
  suggestedPreemptiveActions: string[];
}

// Generate a checksum from file content to detect changes
function generateChecksum(content: string): string {
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36).toUpperCase();
}

// File cache with invalidation support
const fileCache = new Map<string, {
  content: string;
  timestamp: number;
  version: number;
}>();

// Global version counter for cache invalidation
let globalVersion = 0;

export function useCodebaseSync() {
  const [codebaseState, setCodebaseState] = useState<CodebaseState | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isSynced: false,
    isStale: false,
    staleDuration: 0,
    pendingChanges: 0,
    lastSync: null,
    nextScheduledSync: null
  });
  const [futureProjection, setFutureProjection] = useState<FutureStateProjection | null>(null);
  
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const staleCheckRef = useRef<NodeJS.Timeout | null>(null);
  
  // Invalidate all cached files to force fresh reads
  const invalidateCache = useCallback(() => {
    globalVersion++;
    fileCache.clear();
    console.log('[CodebaseSync] Cache invalidated, version:', globalVersion);
    
    setSyncStatus(prev => ({
      ...prev,
      isStale: true,
      pendingChanges: prev.pendingChanges + 1
    }));
  }, []);
  
  // Get fresh file content with cache-busting
  const getFreshFileContent = useCallback(async (
    path: string,
    loader: () => Promise<string>
  ): Promise<string> => {
    const cached = fileCache.get(path);
    
    // Use cache only if version matches and within 5-second window
    if (cached && cached.version === globalVersion && Date.now() - cached.timestamp < 5000) {
      return cached.content;
    }
    
    // Force fresh load
    const content = await loader();
    
    fileCache.set(path, {
      content,
      timestamp: Date.now(),
      version: globalVersion
    });
    
    return content;
  }, []);
  
  // Synchronize codebase state
  const syncCodebaseState = useCallback(async (
    files: Map<string, string>
  ): Promise<CodebaseState> => {
    const allContent = Array.from(files.values()).join('\n');
    const checksum = generateChecksum(allContent);
    const totalLines = allContent.split('\n').length;
    
    const state: CodebaseState = {
      version: `v${globalVersion}.${Date.now().toString(36)}`,
      timestamp: new Date(),
      fileCount: files.size,
      totalLines,
      lastModified: new Date(),
      checksum
    };
    
    setCodebaseState(state);
    setSyncStatus(prev => ({
      ...prev,
      isSynced: true,
      isStale: false,
      staleDuration: 0,
      lastSync: new Date(),
      nextScheduledSync: new Date(Date.now() + 60000)
    }));
    
    return state;
  }, []);
  
  // Analyze and project future state changes
  const projectFutureState = useCallback((
    currentIssues: Array<{ type: string; severity: string; file?: string }>
  ): FutureStateProjection => {
    const predictedChanges: string[] = [];
    const suggestedPreemptiveActions: string[] = [];
    
    // Analyze current issues to predict future changes
    const criticalIssues = currentIssues.filter(i => i.severity === 'critical' || i.severity === 'high');
    const complexityIssues = currentIssues.filter(i => i.type === 'complexity-hotspot');
    const densityIssues = currentIssues.filter(i => i.type === 'low-density');
    
    if (criticalIssues.length > 0) {
      predictedChanges.push(`${criticalIssues.length} critical fixes will trigger cascade updates`);
      suggestedPreemptiveActions.push('Address critical issues before other changes to prevent merge conflicts');
    }
    
    if (complexityIssues.length > 0) {
      predictedChanges.push(`${complexityIssues.length} files likely to be refactored into smaller modules`);
      suggestedPreemptiveActions.push('Pre-create modular folder structure for complex files');
    }
    
    if (densityIssues.length > 0) {
      predictedChanges.push(`${densityIssues.length} files will receive En Pensent pattern integration`);
      suggestedPreemptiveActions.push('Import core SDK types in low-density files');
    }
    
    // Calculate confidence based on issue patterns
    const confidenceScore = Math.min(0.95, 0.6 + (currentIssues.length * 0.05));
    
    // Estimate impact
    const estimatedImpact = criticalIssues.length > 2 ? 'high' 
      : criticalIssues.length > 0 || complexityIssues.length > 1 ? 'medium' 
      : 'low';
    
    const projection: FutureStateProjection = {
      predictedChanges,
      confidenceScore,
      estimatedImpact,
      suggestedPreemptiveActions
    };
    
    setFutureProjection(projection);
    return projection;
  }, []);
  
  // Register with evolution system
  const registerWithEvolution = useCallback(async (
    analysisResult: {
      archetype: string;
      intensity: number;
      issues: number;
      fingerprint: string;
    }
  ) => {
    try {
      await supabase.from('evolution_state').insert({
        state_type: 'codebase_sync',
        genes: {
          archetype: analysisResult.archetype,
          intensity: analysisResult.intensity,
          issue_count: analysisResult.issues,
          fingerprint: analysisResult.fingerprint,
          global_version: globalVersion
        },
        generation: globalVersion,
        fitness_score: analysisResult.intensity * 100,
        last_mutation_at: new Date().toISOString()
      } as any);
      
      console.log('[CodebaseSync] Registered with evolution system');
    } catch (err) {
      console.warn('[CodebaseSync] Evolution registration failed:', err);
    }
  }, []);
  
  // Check for staleness periodically
  useEffect(() => {
    staleCheckRef.current = setInterval(() => {
      if (syncStatus.lastSync) {
        const staleDuration = Math.floor((Date.now() - syncStatus.lastSync.getTime()) / 1000);
        setSyncStatus(prev => ({
          ...prev,
          staleDuration,
          isStale: staleDuration > 120 // Stale after 2 minutes
        }));
      }
    }, 10000);
    
    return () => {
      if (staleCheckRef.current) {
        clearInterval(staleCheckRef.current);
      }
    };
  }, [syncStatus.lastSync]);
  
  // Get global version for external consumers
  const getGlobalVersion = useCallback(() => globalVersion, []);
  
  // Force a complete refresh
  const forceRefresh = useCallback(() => {
    invalidateCache();
    return globalVersion;
  }, [invalidateCache]);
  
  return {
    codebaseState,
    syncStatus,
    futureProjection,
    invalidateCache,
    getFreshFileContent,
    syncCodebaseState,
    projectFutureState,
    registerWithEvolution,
    getGlobalVersion,
    forceRefresh
  };
}

// Export singleton for cross-component access
export const codebaseSyncManager = {
  invalidateCache: () => {
    globalVersion++;
    fileCache.clear();
  },
  getVersion: () => globalVersion,
  clearCache: () => fileCache.clear()
};
