/**
 * Unified Evolution System
 * The Code is the BLOOD - The Market is the NERVOUS SYSTEM
 * When code evolves, the entire En Pensent universe adapts
 */

import { useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface EvolutionEvent {
  type: 'code_analysis' | 'code_fix' | 'pattern_discovered' | 'archetype_shift' | 'market_sync';
  source: 'code' | 'market' | 'chess';
  data: Record<string, unknown>;
  timestamp: Date;
}

export interface UnifiedState {
  codeHealth: number; // 0-100
  marketSync: number; // 0-100
  patternAlignment: number; // 0-100
  lastEvolution: Date | null;
  evolutionCount: number;
}

// Simple event emitter for cross-domain communication
type EvolutionListener = (event: EvolutionEvent) => void;
const evolutionListeners: Set<EvolutionListener> = new Set();

export function subscribeToEvolution(listener: EvolutionListener): () => void {
  evolutionListeners.add(listener);
  return () => evolutionListeners.delete(listener);
}

function broadcastEvolution(event: EvolutionEvent) {
  evolutionListeners.forEach(listener => listener(event));
}

export function useUnifiedEvolution() {
  const { toast } = useToast();
  const stateRef = useRef<UnifiedState>({
    codeHealth: 100,
    marketSync: 100,
    patternAlignment: 100,
    lastEvolution: null,
    evolutionCount: 0
  });
  
  // Emit evolution event across the entire universe
  const emitEvolution = useCallback(async (event: EvolutionEvent) => {
    console.log('[UnifiedEvolution] Emitting:', event.type, 'from', event.source);
    
    // Broadcast to local listeners
    broadcastEvolution(event);
    
    // Persist to database for cross-session learning
    try {
      const evolutionData = {
        state_type: 'unified_evolution',
        genes: {
          code_health: stateRef.current.codeHealth,
          market_sync: stateRef.current.marketSync,
          pattern_alignment: stateRef.current.patternAlignment,
          last_event: event
        },
        generation: stateRef.current.evolutionCount + 1,
        fitness_score: (stateRef.current.codeHealth + stateRef.current.marketSync + stateRef.current.patternAlignment) / 3,
        last_mutation_at: new Date().toISOString()
      };
      
      const { error } = await supabase
        .from('evolution_state')
        .insert(evolutionData as any);
      
      if (error) {
        console.warn('[UnifiedEvolution] Insert warning:', error.message);
      }
      
      stateRef.current.evolutionCount++;
      stateRef.current.lastEvolution = new Date();
    } catch (err) {
      console.error('[UnifiedEvolution] Failed to persist:', err);
    }
  }, []);
  
  // Code was analyzed - propagate learnings
  const onCodeAnalyzed = useCallback(async (analysisResult: {
    archetype: string;
    health: number;
    recommendations: string[];
  }) => {
    stateRef.current.codeHealth = analysisResult.health;
    
    await emitEvolution({
      type: 'code_analysis',
      source: 'code',
      data: analysisResult,
      timestamp: new Date()
    });
    
    // Broadcast market recalibration
    broadcastEvolution({
      type: 'market_sync',
      source: 'code',
      data: {
        trigger: 'code_analysis',
        codeArchetype: analysisResult.archetype,
        healthFactor: analysisResult.health / 100
      },
      timestamp: new Date()
    });
    
    toast({
      title: '🧬 Universe Synchronized',
      description: `Code patterns propagated. Market calibration updated.`
    });
  }, [emitEvolution, toast]);
  
  // Code was fixed - auto-evolve the system
  const onCodeFixed = useCallback(async (fix: {
    file: string;
    issue: string;
    resolution: string;
  }) => {
    // Increase code health
    stateRef.current.codeHealth = Math.min(100, stateRef.current.codeHealth + 5);
    
    await emitEvolution({
      type: 'code_fix',
      source: 'code',
      data: fix,
      timestamp: new Date()
    });
    
    // Broadcast pattern learned
    broadcastEvolution({
      type: 'pattern_discovered',
      source: 'code',
      data: {
        domain: 'code',
        pattern: fix.issue,
        resolution: fix.resolution,
        impact: 'positive'
      },
      timestamp: new Date()
    });
  }, [emitEvolution]);
  
  // New pattern discovered
  const onPatternDiscovered = useCallback(async (pattern: {
    domain: string;
    signature: string;
    confidence: number;
  }) => {
    stateRef.current.patternAlignment = Math.min(100, stateRef.current.patternAlignment + 2);
    
    await emitEvolution({
      type: 'pattern_discovered',
      source: pattern.domain as 'code' | 'market' | 'chess',
      data: pattern,
      timestamp: new Date()
    });
  }, [emitEvolution]);
  
  // Market synced successfully
  const onMarketSynced = useCallback(async (syncData: {
    accuracy: number;
    correlations: number;
    ticksProcessed: number;
  }) => {
    stateRef.current.marketSync = syncData.accuracy;
    
    await emitEvolution({
      type: 'market_sync',
      source: 'market',
      data: syncData,
      timestamp: new Date()
    });
  }, [emitEvolution]);
  
  // Get current unified state
  const getUnifiedState = useCallback(() => {
    return { ...stateRef.current };
  }, []);
  
  return {
    emitEvolution,
    onCodeAnalyzed,
    onCodeFixed,
    onPatternDiscovered,
    onMarketSynced,
    getUnifiedState,
    subscribeToEvolution
  };
}
