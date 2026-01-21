/**
 * AutoEvolutionProvider - v6.96-PERSISTENT
 * 
 * CRITICAL FIX: Previous version (v6.95) had timers that stopped on page reload.
 * 
 * v6.96 CHANGES:
 * - Removed startedRef guard that prevented restarts
 * - Added visibility change handler to resume when tab becomes active
 * - Added periodic heartbeat to detect stalls
 * - Immediate start on mount (no 8s delay that causes missed starts)
 */

import { useEffect, useRef } from 'react';
import {
  startAutoEvolution,
  getEvolutionState,
  subscribeToEvolution,
} from '@/lib/chess/autoEvolutionEngine';
import { supabase } from '@/integrations/supabase/client';

const AUTO_EVOLUTION_VERSION = "6.96-PERSISTENT";

interface AutoEvolutionProviderProps {
  children: React.ReactNode;
  autoStart?: boolean;
}

export function AutoEvolutionProvider({ 
  children, 
  autoStart = true,
}: AutoEvolutionProviderProps) {
  const initRef = useRef(false);
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    if (!autoStart) return;
    
    // Prevent double-init in strict mode, but allow restart after page reload
    if (initRef.current) return;
    initRef.current = true;
    
    console.log(`[v6.96-PERSISTENT] AutoEvolutionProvider mounted`);
    
    // Subscribe to events for logging
    const unsubscribe = subscribeToEvolution((state, event, data) => {
      if (event === 'cloud_batch_complete' || event === 'local_batch_complete') {
        console.log(`[v6.96-PERSISTENT] ✅ Batch complete: +${data?.count} predictions (session: ${state.sessionPredictions})`);
        logEvolutionEvent(event, data);
      } else if (event === 'recovery_complete') {
        console.log(`[v6.96-PERSISTENT] 🔄 Recovery #${data?.count} complete`);
      } else if (event === 'cloud_batch_error' || event === 'local_batch_error') {
        console.error(`[v6.96-PERSISTENT] ❌ Batch error:`, data?.error);
        logEvolutionEvent('batch_error', { error: String(data?.error) });
      }
    });
    
    // IMMEDIATE START - no delay
    const startEngine = async () => {
      const state = getEvolutionState();
      if (state.isRunning) {
        console.log('[v6.96-PERSISTENT] Engine already running');
        return;
      }
      
      console.log(`[v6.96-PERSISTENT] ========================================`);
      console.log(`[v6.96-PERSISTENT] 🚀 AUTO-STARTING EVOLUTION PIPELINE`);
      console.log(`[v6.96-PERSISTENT] Version: ${AUTO_EVOLUTION_VERSION}`);
      console.log(`[v6.96-PERSISTENT] Time: ${new Date().toISOString()}`);
      console.log(`[v6.96-PERSISTENT] ========================================`);
      
      try {
        await startAutoEvolution();
        
        const newState = getEvolutionState();
        console.log(`[v6.96-PERSISTENT] ✅ Engine running: ${newState.isRunning}`);
        
        await logEvolutionEvent('auto_start', { 
          version: AUTO_EVOLUTION_VERSION,
          totalPredictions: newState.totalPredictions 
        });
        
      } catch (err) {
        console.error('[v6.96-PERSISTENT] ❌ Failed to auto-start:', err);
        // Retry after 30s
        setTimeout(startEngine, 30000);
      }
    };
    
    // Start immediately
    startEngine();
    
    // HEARTBEAT: Check every 5 min if engine stopped and restart it
    heartbeatRef.current = setInterval(async () => {
      const state = getEvolutionState();
      if (!state.isRunning) {
        console.warn('[v6.96-PERSISTENT] ⚠️ Heartbeat detected engine stopped, restarting...');
        await startEngine();
      } else {
        console.log(`[v6.96-PERSISTENT] 💓 Heartbeat OK - Session: ${state.sessionPredictions} predictions`);
      }
    }, 5 * 60 * 1000);
    
    // VISIBILITY HANDLER: Resume when tab becomes visible
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        console.log('[v6.96-PERSISTENT] Tab became visible, checking engine...');
        const state = getEvolutionState();
        if (!state.isRunning) {
          console.warn('[v6.96-PERSISTENT] Engine not running, restarting...');
          await startEngine();
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      unsubscribe();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
      }
      // Note: We do NOT stop the engine on unmount - it should keep running
    };
  }, [autoStart]);
  
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
        state_type: `v6.96_${event}`,
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
    console.warn('[v6.96-PERSISTENT] Event log failed:', err);
  }
}

export default AutoEvolutionProvider;
