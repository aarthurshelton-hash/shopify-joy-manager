/**
 * Rate Limiter for Vision Marketplace
 * Prevents abuse by limiting request frequency
 */

import { supabase } from '@/integrations/supabase/client';

export interface RateLimitConfig {
  windowMinutes: number;
  maxRequests: number;
  skipSuccessfulRequests: boolean;
  skipFailedRequests: boolean;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  limit: number;
}

// Default rate limits for different actions
export const RATE_LIMITS: Record<string, RateLimitConfig> = {
  'marketplace-purchase': {
    windowMinutes: 60,
    maxRequests: 10,
    skipSuccessfulRequests: false,
    skipFailedRequests: true
  },
  'create-listing': {
    windowMinutes: 60,
    maxRequests: 10,
    skipSuccessfulRequests: false,
    skipFailedRequests: true
  },
  'update-listing': {
    windowMinutes: 60,
    maxRequests: 20,
    skipSuccessfulRequests: false,
    skipFailedRequests: true
  },
  'transfer-visualization': {
    windowMinutes: 1440, // 24 hours
    maxRequests: 3,
    skipSuccessfulRequests: false,
    skipFailedRequests: false
  },
  'make-offer': {
    windowMinutes: 60,
    maxRequests: 20,
    skipSuccessfulRequests: false,
    skipFailedRequests: true
  },
  'report-content': {
    windowMinutes: 60,
    maxRequests: 5,
    skipSuccessfulRequests: false,
    skipFailedRequests: false
  }
};

export class RateLimiter {
  /**
   * Check if a user can perform an action based on rate limits
   * Uses the database function for atomic checking and recording
   */
  static async checkLimit(
    userId: string,
    action: string,
    resourceId?: string
  ): Promise<RateLimitResult> {
    const config = RATE_LIMITS[action];
    
    if (!config) {
      // No rate limit configured for this action
      return {
        allowed: true,
        remaining: Infinity,
        resetAt: new Date(),
        limit: Infinity
      };
    }
    
    try {
      const { data, error } = await supabase.rpc('check_rate_limit', {
        p_user_id: userId,
        p_action: action,
        p_resource_id: resourceId || null,
        p_window_minutes: config.windowMinutes,
        p_max_requests: config.maxRequests
      });
      
      if (error) {
        console.error('[RateLimiter] Database error:', error);
        // On error, allow the request but log the issue
        return {
          allowed: true,
          remaining: config.maxRequests,
          resetAt: new Date(Date.now() + config.windowMinutes * 60 * 1000),
          limit: config.maxRequests
        };
      }
      
      const result = data as {
        allowed: boolean;
        remaining: number;
        reset_at: string;
        limit: number;
      };
      
      return {
        allowed: result.allowed,
        remaining: result.remaining,
        resetAt: new Date(result.reset_at),
        limit: result.limit
      };
    } catch (error) {
      console.error('[RateLimiter] Error:', error);
      // On error, allow but log
      return {
        allowed: true,
        remaining: config.maxRequests,
        resetAt: new Date(Date.now() + config.windowMinutes * 60 * 1000),
        limit: config.maxRequests
      };
    }
  }

  /**
   * Get the current rate limit status without incrementing the counter
   */
  static async getStatus(
    userId: string,
    action: string
  ): Promise<{ current: number; limit: number; windowMinutes: number }> {
    const config = RATE_LIMITS[action];
    
    if (!config) {
      return { current: 0, limit: Infinity, windowMinutes: 0 };
    }
    
    try {
      const windowStart = new Date(Date.now() - config.windowMinutes * 60 * 1000);
      
      const { count, error } = await supabase
        .from('rate_limits')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('action', action)
        .gte('created_at', windowStart.toISOString());
      
      if (error) {
        console.error('[RateLimiter] Status check error:', error);
        return { current: 0, limit: config.maxRequests, windowMinutes: config.windowMinutes };
      }
      
      return {
        current: count ?? 0,
        limit: config.maxRequests,
        windowMinutes: config.windowMinutes
      };
    } catch (error) {
      console.error('[RateLimiter] Status error:', error);
      return { current: 0, limit: config.maxRequests, windowMinutes: config.windowMinutes };
    }
  }

  /**
   * Format rate limit info for user display
   */
  static formatLimitMessage(result: RateLimitResult, action: string): string {
    if (result.allowed) {
      return `${result.remaining} ${action} requests remaining`;
    }
    
    const resetIn = Math.ceil((result.resetAt.getTime() - Date.now()) / 60000);
    return `Rate limit exceeded for ${action}. Try again in ${resetIn} minutes.`;
  }

  /**
   * Check if rate limiting is configured for an action
   */
  static hasLimit(action: string): boolean {
    return action in RATE_LIMITS;
  }

  /**
   * Get the config for an action
   */
  static getConfig(action: string): RateLimitConfig | undefined {
    return RATE_LIMITS[action];
  }
}

export default RateLimiter;
