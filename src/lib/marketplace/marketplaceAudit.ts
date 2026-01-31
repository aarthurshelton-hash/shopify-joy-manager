/**
 * Marketplace Audit System
 * Comprehensive logging for security and compliance
 */

import { supabase } from '@/integrations/supabase/client';

export type ResourceType = 'listing' | 'visualization' | 'payment' | 'transfer' | 'asset' | 'user';
export type AuditSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface AuditEvent {
  id: string;
  userId: string | null;
  action: string;
  resourceType: ResourceType;
  resourceId: string | null;
  metadata: Record<string, unknown>;
  ipAddress: string | null;
  userAgent: string | null;
  severity: AuditSeverity;
  createdAt: Date;
}

export interface AuditEventInput {
  userId?: string;
  action: string;
  resourceType: ResourceType;
  resourceId?: string;
  metadata?: Record<string, unknown>;
  severity?: AuditSeverity;
}

// Action to severity mapping
const SEVERITY_MAP: Record<string, AuditSeverity> = {
  // High severity actions
  'purchase_completed': 'medium',
  'purchase_failed': 'high',
  'listing_fraud_detected': 'critical',
  'suspicious_transfer': 'critical',
  'rate_limit_exceeded': 'high',
  'unauthorized_access': 'critical',
  'payment_refunded': 'high',
  
  // Medium severity actions
  'listing_created': 'low',
  'listing_updated': 'low',
  'listing_cancelled': 'low',
  'transfer_completed': 'medium',
  'offer_made': 'low',
  'offer_accepted': 'medium',
  'offer_rejected': 'low',
  
  // Low severity actions
  'listing_viewed': 'low',
  'search_performed': 'low',
  'profile_updated': 'low'
};

export class MarketplaceAuditor {
  /**
   * Logs an audit event to the database
   */
  static async log(event: AuditEventInput): Promise<string | null> {
    try {
      // Determine severity from action if not provided
      const severity = event.severity || SEVERITY_MAP[event.action] || 'low';
      
      const { data, error } = await supabase.rpc('log_marketplace_audit', {
        p_user_id: event.userId || null,
        p_action: event.action,
        p_resource_type: event.resourceType,
        p_resource_id: event.resourceId || null,
        p_metadata: JSON.parse(JSON.stringify(event.metadata || {})),
        p_severity: severity,
        p_ip_address: null, // Will be set by edge function if needed
        p_user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null
      });
      
      if (error) {
        console.error('[MarketplaceAuditor] Log failed:', error);
        return null;
      }
      
      // For critical events, also log to console
      if (severity === 'critical') {
        console.error('[CRITICAL AUDIT EVENT]', {
          action: event.action,
          resourceType: event.resourceType,
          resourceId: event.resourceId,
          metadata: event.metadata
        });
      }
      
      return data as string;
    } catch (error) {
      console.error('[MarketplaceAuditor] Error:', error);
      return null;
    }
  }

  /**
   * Logs a listing creation event
   */
  static async logListingCreated(
    userId: string,
    listingId: string,
    priceCents: number,
    visualizationId: string
  ): Promise<void> {
    const severity: AuditSeverity = priceCents > 50000 ? 'medium' : 'low';
    
    await this.log({
      userId,
      action: 'listing_created',
      resourceType: 'listing',
      resourceId: listingId,
      metadata: {
        price_cents: priceCents,
        visualization_id: visualizationId
      },
      severity
    });
  }

  /**
   * Logs a purchase completion event
   */
  static async logPurchaseCompleted(
    buyerId: string,
    listingId: string,
    sellerId: string,
    amountCents: number,
    visualizationId: string
  ): Promise<void> {
    const severity: AuditSeverity = amountCents > 100000 ? 'high' : 'medium';
    
    await this.log({
      userId: buyerId,
      action: 'purchase_completed',
      resourceType: 'payment',
      resourceId: listingId,
      metadata: {
        seller_id: sellerId,
        amount_cents: amountCents,
        visualization_id: visualizationId
      },
      severity
    });
  }

  /**
   * Logs a failed purchase attempt
   */
  static async logPurchaseFailed(
    userId: string,
    listingId: string,
    reason: string,
    amountCents?: number
  ): Promise<void> {
    await this.log({
      userId,
      action: 'purchase_failed',
      resourceType: 'payment',
      resourceId: listingId,
      metadata: {
        reason,
        amount_cents: amountCents
      },
      severity: 'high'
    });
  }

  /**
   * Logs a transfer event
   */
  static async logTransfer(
    fromUserId: string,
    toUserId: string,
    visualizationId: string,
    transferType: string
  ): Promise<void> {
    await this.log({
      userId: fromUserId,
      action: 'transfer_completed',
      resourceType: 'transfer',
      resourceId: visualizationId,
      metadata: {
        to_user_id: toUserId,
        transfer_type: transferType
      },
      severity: 'medium'
    });
  }

  /**
   * Logs suspicious activity detection
   */
  static async logSuspiciousActivity(
    userId: string | undefined,
    reason: string,
    details: Record<string, unknown>
  ): Promise<void> {
    await this.log({
      userId,
      action: 'suspicious_activity_detected',
      resourceType: 'user',
      metadata: {
        reason,
        ...details
      },
      severity: 'critical'
    });
  }

  /**
   * Logs rate limit exceeded
   */
  static async logRateLimitExceeded(
    userId: string,
    action: string,
    limit: number
  ): Promise<void> {
    await this.log({
      userId,
      action: 'rate_limit_exceeded',
      resourceType: 'user',
      metadata: {
        blocked_action: action,
        limit
      },
      severity: 'high'
    });
  }

  /**
   * Query recent audit events (admin only)
   */
  static async getRecentEvents(
    options: {
      limit?: number;
      severity?: AuditSeverity;
      action?: string;
      userId?: string;
    } = {}
  ): Promise<AuditEvent[]> {
    try {
      let query = supabase
        .from('marketplace_audit_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(options.limit || 50);
      
      if (options.severity) {
        query = query.eq('severity', options.severity);
      }
      
      if (options.action) {
        query = query.eq('action', options.action);
      }
      
      if (options.userId) {
        query = query.eq('user_id', options.userId);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('[MarketplaceAuditor] Query failed:', error);
        return [];
      }
      
      return (data || []).map(event => ({
        id: event.id,
        userId: event.user_id,
        action: event.action,
        resourceType: event.resource_type as ResourceType,
        resourceId: event.resource_id,
        metadata: event.metadata as Record<string, unknown>,
        ipAddress: event.ip_address,
        userAgent: event.user_agent,
        severity: event.severity as AuditSeverity,
        createdAt: new Date(event.created_at)
      }));
    } catch (error) {
      console.error('[MarketplaceAuditor] Query error:', error);
      return [];
    }
  }

  /**
   * Get summary statistics for monitoring
   */
  static async getStats(hours: number = 24): Promise<{
    totalEvents: number;
    criticalEvents: number;
    highEvents: number;
    purchases: number;
    failedPurchases: number;
  }> {
    try {
      const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
      
      const { data, error } = await supabase
        .from('marketplace_audit_events')
        .select('action, severity')
        .gte('created_at', since);
      
      if (error) {
        console.error('[MarketplaceAuditor] Stats query failed:', error);
        return {
          totalEvents: 0,
          criticalEvents: 0,
          highEvents: 0,
          purchases: 0,
          failedPurchases: 0
        };
      }
      
      const events = data || [];
      
      return {
        totalEvents: events.length,
        criticalEvents: events.filter(e => e.severity === 'critical').length,
        highEvents: events.filter(e => e.severity === 'high').length,
        purchases: events.filter(e => e.action === 'purchase_completed').length,
        failedPurchases: events.filter(e => e.action === 'purchase_failed').length
      };
    } catch (error) {
      console.error('[MarketplaceAuditor] Stats error:', error);
      return {
        totalEvents: 0,
        criticalEvents: 0,
        highEvents: 0,
        purchases: 0,
        failedPurchases: 0
      };
    }
  }
}

export default MarketplaceAuditor;
