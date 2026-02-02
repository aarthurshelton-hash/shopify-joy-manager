/**
 * Database Transaction Utilities
 * 
 * Provides safe transaction handling with automatic rollback
 * for heavy business load scenarios
 */

import { supabase } from '@/integrations/supabase/client';

export interface TransactionOptions {
  maxRetries?: number;
  retryDelayMs?: number;
  timeoutMs?: number;
}

const DEFAULT_OPTIONS: TransactionOptions = {
  maxRetries: 3,
  retryDelayMs: 1000,
  timeoutMs: 30000,
};

/**
 * Execute operations within a database transaction
 * Automatically handles rollback on failure
 */
export async function withTransaction<T>(
  operations: (client: typeof supabase) => Promise<T>,
  options: TransactionOptions = {}
): Promise<{ success: boolean; result?: T; error?: string }> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  for (let attempt = 1; attempt <= opts.maxRetries!; attempt++) {
    try {
      // Start transaction
      const { error: beginError } = await supabase.rpc('begin_transaction');
      if (beginError) throw beginError;
      
      try {
        // Execute operations
        const result = await operations(supabase);
        
        // Commit transaction
        const { error: commitError } = await supabase.rpc('commit_transaction');
        if (commitError) throw commitError;
        
        return { success: true, result };
      } catch (error) {
        // Rollback on error
        await supabase.rpc('rollback_transaction').catch(() => {});
        throw error;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      
      // Check if retryable
      const isRetryable = 
        message.includes('deadlock') ||
        message.includes('lock timeout') ||
        message.includes('connection') ||
        message.includes('network');
      
      if (isRetryable && attempt < opts.maxRetries!) {
        console.log(`[Transaction] Retry ${attempt}/${opts.maxRetries} after error: ${message}`);
        await delay(opts.retryDelayMs! * attempt);
        continue;
      }
      
      return { success: false, error: message };
    }
  }
  
  return { success: false, error: 'Max retries exceeded' };
}

/**
 * Safe update with optimistic locking
 * Prevents lost updates in concurrent scenarios
 */
export async function safeUpdateWithLock<T>(
  table: string,
  id: string,
  updates: Record<string, unknown>,
  versionField: string = 'version'
): Promise<{ success: boolean; data?: T; error?: string }> {
  try {
    // Get current version
    const { data: current, error: fetchError } = await supabase
      .from(table)
      .select(`*, ${versionField}`)
      .eq('id', id)
      .single();
    
    if (fetchError) throw fetchError;
    if (!current) return { success: false, error: 'Record not found' };
    
    const currentVersion = (current as Record<string, unknown>)[versionField] as number || 0;
    
    // Attempt update with version check
    const { data, error } = await supabase
      .from(table)
      .update({
        ...updates,
        [versionField]: currentVersion + 1,
      })
      .eq('id', id)
      .eq(versionField, currentVersion)
      .select()
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return { success: false, error: 'Record was modified by another user' };
      }
      throw error;
    }
    
    return { success: true, data: data as T };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Update failed' 
    };
  }
}

/**
 * Batch insert with chunking
 * Prevents oversized requests for large datasets
 */
export async function batchInsert<T>(
  table: string,
  records: T[],
  chunkSize: number = 100
): Promise<{ success: boolean; inserted: number; error?: string }> {
  let inserted = 0;
  
  try {
    for (let i = 0; i < records.length; i += chunkSize) {
      const chunk = records.slice(i, i + chunkSize);
      
      const { error } = await supabase
        .from(table)
        .insert(chunk);
      
      if (error) throw error;
      inserted += chunk.length;
    }
    
    return { success: true, inserted };
  } catch (error) {
    return { 
      success: false, 
      inserted,
      error: error instanceof Error ? error.message : 'Batch insert failed'
    };
  }
}

/**
 * Delay utility
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Execute with timeout
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number
): Promise<{ success: boolean; result?: T; error?: string }> {
  try {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Operation timed out')), timeoutMs);
    });
    
    const result = await Promise.race([promise, timeoutPromise]);
    return { success: true, result };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Operation failed'
    };
  }
}

/**
 * Safe RPC call with retry
 */
export async function safeRpc<T>(
  rpcName: string,
  params: Record<string, unknown>,
  maxRetries: number = 3
): Promise<{ success: boolean; data?: T; error?: string }> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const { data, error } = await supabase.rpc(rpcName, params);
      
      if (error) throw error;
      
      return { success: true, data: data as T };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      
      if (attempt < maxRetries) {
        console.log(`[RPC ${rpcName}] Retry ${attempt}/${maxRetries}`);
        await delay(1000 * attempt);
        continue;
      }
      
      return { success: false, error: message };
    }
  }
  
  return { success: false, error: 'Max retries exceeded' };
}
