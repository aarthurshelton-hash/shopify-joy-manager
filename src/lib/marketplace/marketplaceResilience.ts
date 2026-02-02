/**
 * Marketplace Resilience Utilities
 * 
 * Provides inventory locking, rate limiting, and queue management
 * for heavy business load scenarios
 */

import { supabase } from '@/integrations/supabase/client';

// Inventory Lock Types
export interface InventoryLock {
  resourceType: 'listing' | 'print_variant' | 'book_slot';
  resourceId: string;
  userId: string;
  expiresAt: Date;
}

// Rate Limit Tracking
interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Acquire inventory lock to prevent overselling
 * Uses database-level locking for consistency
 */
export async function acquireInventoryLock(
  resourceType: string,
  resourceId: string,
  userId: string,
  ttlSeconds: number = 300
): Promise<{ success: boolean; lockId?: string; error?: string }> {
  try {
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
    
    const { data, error } = await supabase
      .from('inventory_locks')
      .insert({
        resource_type: resourceType,
        resource_id: resourceId,
        user_id: userId,
        expires_at: expiresAt.toISOString(),
      })
      .select('id')
      .single();
    
    if (error) {
      // Check if it's a unique constraint violation (already locked)
      if (error.code === '23505') {
        // Check if existing lock has expired
        const { data: existingLock } = await supabase
          .from('inventory_locks')
          .select('expires_at, user_id')
          .eq('resource_type', resourceType)
          .eq('resource_id', resourceId)
          .single();
        
        if (existingLock && new Date(existingLock.expires_at) < new Date()) {
          // Lock expired, delete it and retry
          await supabase
            .from('inventory_locks')
            .delete()
            .eq('resource_type', resourceType)
            .eq('resource_id', resourceId);
          
          // Retry once
          return acquireInventoryLock(resourceType, resourceId, userId, ttlSeconds);
        }
        
        return { success: false, error: 'Resource temporarily unavailable' };
      }
      throw error;
    }
    
    return { success: true, lockId: data.id };
  } catch (error) {
    console.error('[InventoryLock] Failed to acquire lock:', error);
    return { success: false, error: 'Failed to lock resource' };
  }
}

/**
 * Release inventory lock
 */
export async function releaseInventoryLock(lockId: string): Promise<void> {
  try {
    await supabase
      .from('inventory_locks')
      .delete()
      .eq('id', lockId);
  } catch (error) {
    console.error('[InventoryLock] Failed to release lock:', error);
  }
}

/**
 * Check rate limit for an action
 * Implements sliding window rate limiting
 */
export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(key);
  
  if (!entry || now > entry.resetAt) {
    // New window
    const resetAt = now + windowMs;
    rateLimitStore.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: maxRequests - 1, resetAt };
  }
  
  if (entry.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }
  
  entry.count++;
  return { allowed: true, remaining: maxRequests - entry.count, resetAt: entry.resetAt };
}

/**
 * Clean up expired rate limit entries
 */
export function cleanupRateLimits(): void {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore) {
    if (now > entry.resetAt) {
      rateLimitStore.delete(key);
    }
  }
}

// Clean up every 5 minutes
setInterval(cleanupRateLimits, 5 * 60 * 1000);

/**
 * Execute with automatic inventory lock
 * Automatically releases lock when done
 */
export async function withInventoryLock<T>(
  resourceType: string,
  resourceId: string,
  userId: string,
  fn: () => Promise<T>,
  ttlSeconds: number = 300
): Promise<{ success: boolean; result?: T; error?: string }> {
  const lock = await acquireInventoryLock(resourceType, resourceId, userId, ttlSeconds);
  
  if (!lock.success) {
    return { success: false, error: lock.error };
  }
  
  try {
    const result = await fn();
    return { success: true, result };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Operation failed';
    return { success: false, error: message };
  } finally {
    if (lock.lockId) {
      await releaseInventoryLock(lock.lockId);
    }
  }
}

/**
 * Queue item for async processing
 * Used for book generation and other heavy operations
 */
export async function queueForProcessing(
  queueName: string,
  payload: Record<string, unknown>,
  priority: number = 0
): Promise<{ success: boolean; jobId?: string; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('processing_queue')
      .insert({
        queue_name: queueName,
        payload,
        priority,
        status: 'pending',
        attempts: 0,
        max_attempts: 3,
      })
      .select('id')
      .single();
    
    if (error) throw error;
    
    return { success: true, jobId: data.id };
  } catch (error) {
    console.error('[Queue] Failed to queue item:', error);
    return { success: false, error: 'Failed to queue item' };
  }
}

/**
 * Get queue status
 */
export async function getQueueStatus(
  queueName: string
): Promise<{ pending: number; processing: number; failed: number }> {
  try {
    const { data, error } = await supabase
      .from('processing_queue')
      .select('status')
      .eq('queue_name', queueName);
    
    if (error) throw error;
    
    const counts = { pending: 0, processing: 0, failed: 0 };
    for (const item of data || []) {
      counts[item.status as keyof typeof counts]++;
    }
    
    return counts;
  } catch (error) {
    console.error('[Queue] Failed to get status:', error);
    return { pending: 0, processing: 0, failed: 0 };
  }
}

/**
 * Distributed lock using database
 * For critical sections that need cluster-wide locking
 */
export async function withDistributedLock<T>(
  lockName: string,
  ttlSeconds: number,
  fn: () => Promise<T>
): Promise<{ success: boolean; result?: T; error?: string }> {
  const lockKey = `distributed:${lockName}`;
  const acquired = await acquireInventoryLock('distributed', lockKey, 'system', ttlSeconds);
  
  if (!acquired.success) {
    return { success: false, error: 'Could not acquire distributed lock' };
  }
  
  try {
    const result = await fn();
    return { success: true, result };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Operation failed';
    return { success: false, error: message };
  } finally {
    if (acquired.lockId) {
      await releaseInventoryLock(acquired.lockId);
    }
  }
}
