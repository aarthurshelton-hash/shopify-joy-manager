/**
 * AutoEvolutionProvider - v6.95-AUTOSTART
 * 
 * Automatically starts the evolution pipeline when the app loads.
 * This ensures continuous data absorption without manual intervention.
 */

import { useEffect, useRef } from 'react';
import {
  startAutoEvolution,
  stopAutoEvolution,
  subscribeToEvolution,
  getEvolutionState,
} from '@/lib/chess/autoEvolutionEngine';
import { supabase } from '@/integrations/supabase/client';

const AUTO_EVOLUTION_VERSION = "6.95-AUTOSTART";

interface AutoEvolutionProviderProps {
  children: React.ReactNode;
  autoStart?: boolean;
  delayMs?: number; // Delay before auto-starting (gives app time to load)
}

export function AutoEvolutionProvider({ 
  children, 
  autoStart = true,
  delayMs = 5000 // Wait 5s for app to fully load
}: AutoEvolutionProviderProps) {
  const startedRef = useRef(false);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  
  useEffect(() => {
    if (!autoStart || startedRef.current) return;
    
    console.log(`[v6.95-AUTOSTART] AutoEvolutionProvider mounted, will start in ${delayMs}ms...`);
    
    // Subscribe to events for logging
    unsubscribeRef.current = subscribeToEvolution((state, event, data) => {
      if (event === 'cloud_batch_complete' || event === 'local_batch_complete') {
        console.log(`[v6.95-AUTOSTART] ✅ Batch complete: +${data?.count} predictions (session: ${state.sessionPredictions})`);
        
        // Log to database for verification
        logEvolutionEvent(event, data);
      } else if (event === 'recovery_complete') {
        console.log(`[v6.95-AUTOSTART] 🔄 Recovery #${data?.count} complete`);
      } else if (event === 'cloud_batch_error' || event === 'local_batch_error') {
        console.error(`[v6.95-AUTOSTART] ❌ Batch error:`, data?.error);
      }
    });
    
    // Delayed start to ensure app is fully loaded
    const startTimer = setTimeout(async () => {
      const state = getEvolutionState();
      if (state.isRunning) {
        console.log('[v6.95-AUTOSTART] Already running, skipping auto-start');
        return;
      }
      
      console.log(`[v6.95-AUTOSTART] ========================================`);
      console.log(`[v6.95-AUTOSTART] 🚀 AUTO-STARTING EVOLUTION PIPELINE`);
      console.log(`[v6.95-AUTOSTART] Version: ${AUTO_EVOLUTION_VERSION}`);
      console.log(`[v6.95-AUTOSTART] ========================================`);
      
      try {
        await startAutoEvolution();
        startedRef.current = true;
        
        // Verify it started
        const newState = getEvolutionState();
        console.log(`[v6.95-AUTOSTART] ✅ Engine running: ${newState.isRunning}`);
        console.log(`[v6.95-AUTOSTART] Session predictions: ${newState.sessionPredictions}`);
        console.log(`[v6.95-AUTOSTART] Total predictions: ${newState.totalPredictions}`);
        
        // Log start event
        await logEvolutionEvent('auto_start', { 
          version: AUTO_EVOLUTION_VERSION,
          totalPredictions: newState.totalPredictions 
        });
        
      } catch (err) {
        console.error('[v6.95-AUTOSTART] ❌ Failed to auto-start:', err);
      }
    }, delayMs);
    
    return () => {
      clearTimeout(startTimer);
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
      // Note: We do NOT stop the engine on unmount - it should keep running
    };
  }, [autoStart, delayMs]);
  
  return <>{children}</>;
}

/**
 * Log evolution events to database for verification and tracking
 */
async function logEvolutionEvent(event: string, data?: Record<string, unknown>) {
  try {
    await supabase
      .from('evolution_state')
      .insert({
        state_type: `autostart_event_${event}`,
        genes: {
          version: AUTO_EVOLUTION_VERSION,
          event,
          timestamp: new Date().toISOString(),
          ...data
        },
        fitness_score: 100,
        generation: 0,
      });
  } catch (err) {
    // Silent fail - this is just for verification logging
    console.warn('[v6.95-AUTOSTART] Event log failed:', err);
  }
}

export default AutoEvolutionProvider;
