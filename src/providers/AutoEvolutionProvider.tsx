/**
 * AutoEvolutionProvider - v7.0-UNBLOCKABLE
 * 
 * CRITICAL FIX: Previous versions had operations that could hang indefinitely.
 * 
 * v7.0 CHANGES:
 * - All operations have hard timeouts
 * - Faster heartbeat to catch stalls sooner
 * - Immediate recovery on visibility change
 * - Engine reset on consecutive failures
 */

import { useEffect, useRef } from 'react';
import {
  startAutoEvolution,
  getEvolutionState,
  subscribeToEvolution,
} from '@/lib/chess/autoEvolutionEngine';
import { supabase } from '@/integrations/supabase/client';

const AUTO_EVOLUTION_VERSION = "7.0-UNBLOCKABLE";

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
    
    console.log(`[v7.0-UNBLOCKABLE] AutoEvolutionProvider mounted`);
    
    // Subscribe to events for logging
    const unsubscribe = subscribeToEvolution((state, event, data) => {
      if (event === 'cloud_batch_complete' || event === 'local_batch_complete') {
        console.log(`[v7.0-UNBLOCKABLE] ✅ Batch complete: +${data?.count} predictions (session: ${state.sessionPredictions})`);
        logEvolutionEvent(event, data);
      } else if (event === 'recovery_complete') {
        console.log(`[v7.0-UNBLOCKABLE] 🔄 Recovery #${data?.count} complete`);
      } else if (event === 'cloud_batch_error' || event === 'local_batch_error') {
        console.error(`[v7.0-UNBLOCKABLE] ❌ Batch error:`, data?.error);
        logEvolutionEvent('batch_error', { error: String(data?.error) });
      }
    });
    
    // IMMEDIATE START - no delay
    const startEngine = async () => {
      const state = getEvolutionState();
      if (state.isRunning) {
        console.log('[v7.0-UNBLOCKABLE] Engine already running');
        return;
      }
      
      console.log(`[v7.0-UNBLOCKABLE] ========================================`);
      console.log(`[v7.0-UNBLOCKABLE] 🚀 AUTO-STARTING EVOLUTION PIPELINE`);
      console.log(`[v7.0-UNBLOCKABLE] Version: ${AUTO_EVOLUTION_VERSION}`);
      console.log(`[v7.0-UNBLOCKABLE] Time: ${new Date().toISOString()}`);
      console.log(`[v7.0-UNBLOCKABLE] ========================================`);
      
      try {
        // v7.0: Timeout on start operation
        const startPromise = startAutoEvolution();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Start timeout')), 30000)
        );
        
        await Promise.race([startPromise, timeoutPromise]);
        
        const newState = getEvolutionState();
        console.log(`[v7.0-UNBLOCKABLE] ✅ Engine running: ${newState.isRunning}`);
        
        await logEvolutionEvent('auto_start', { 
          version: AUTO_EVOLUTION_VERSION,
          totalPredictions: newState.totalPredictions 
        });
        
      } catch (err) {
        console.error('[v7.0-UNBLOCKABLE] ❌ Failed to auto-start:', err);
        // Retry after 15s (faster retry)
        setTimeout(startEngine, 15000);
      }
    };
    
    // Start immediately
    startEngine();
    
    // HEARTBEAT: Check every 2 min if engine stopped and restart it
    heartbeatRef.current = setInterval(async () => {
      const state = getEvolutionState();
      if (!state.isRunning) {
        console.warn('[v7.0-UNBLOCKABLE] ⚠️ Heartbeat detected engine stopped, restarting...');
        await startEngine();
      } else {
        console.log(`[v7.0-UNBLOCKABLE] 💓 Heartbeat OK - Session: ${state.sessionPredictions} predictions`);
      }
    }, 2 * 60 * 1000);
    
    // VISIBILITY HANDLER: Resume when tab becomes visible
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        console.log('[v7.0-UNBLOCKABLE] Tab became visible, checking engine...');
        const state = getEvolutionState();
        if (!state.isRunning) {
          console.warn('[v7.0-UNBLOCKABLE] Engine not running, restarting...');
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
    // v7.0: Timeout on log operation to prevent hanging
    const insertPromise = supabase
      .from('evolution_state')
      .insert({
        state_type: `v7.0_${event}`,
        genes: {
          version: AUTO_EVOLUTION_VERSION,
          event,
          timestamp: new Date().toISOString(),
          ...data
        },
        fitness_score: 100,
        generation: 0,
      });
    
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Log timeout')), 5000)
    );
    
    await Promise.race([insertPromise, timeoutPromise]);
  } catch (err) {
    // Silent fail - this is just for verification logging
    console.warn('[v7.0-UNBLOCKABLE] Event log failed:', err);
  }
}

export default AutoEvolutionProvider;
