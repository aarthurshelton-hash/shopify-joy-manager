import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';

export type SecurityEventCategory = 
  | 'authentication'
  | 'authorization'
  | 'data_access'
  | 'data_modification'
  | 'marketplace'
  | 'subscription'
  | 'moderation'
  | 'admin_action'
  | 'withdrawal'
  | 'general';

export type SecuritySeverity = 'info' | 'warn' | 'error' | 'critical';

export interface SecurityEventOptions {
  actionType: string;
  actionCategory?: SecurityEventCategory;
  userId?: string;
  adminId?: string;
  targetType?: string;
  targetId?: string;
  metadata?: Record<string, Json>;
  severity?: SecuritySeverity;
}

// Log security event using the database function
export async function logSecurityEvent(options: SecurityEventOptions): Promise<string | null> {
  try {
    const { data, error } = await supabase.rpc('log_security_event', {
      p_action_type: options.actionType,
      p_action_category: options.actionCategory || 'general',
      p_user_id: options.userId || null,
      p_admin_id: options.adminId || null,
      p_target_type: options.targetType || null,
      p_target_id: options.targetId || null,
      p_ip_address: null, // Server-side only for security
      p_user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
      p_metadata: (options.metadata || {}) as Json,
      p_severity: options.severity || 'info',
    });

    if (error) {
      console.error('Error logging security event:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error logging security event:', error);
    return null;
  }
}

// Convenience functions for common security events
export const SecurityEvents = {
  // Authentication events
  userSignUp: (userId: string, metadata?: Record<string, Json>) =>
    logSecurityEvent({
      actionType: 'user_signup',
      actionCategory: 'authentication',
      userId,
      metadata,
      severity: 'info',
    }),

  userSignIn: (userId: string, metadata?: Record<string, Json>) =>
    logSecurityEvent({
      actionType: 'user_signin',
      actionCategory: 'authentication',
      userId,
      metadata,
      severity: 'info',
    }),

  userSignOut: (userId: string) =>
    logSecurityEvent({
      actionType: 'user_signout',
      actionCategory: 'authentication',
      userId,
      severity: 'info',
    }),

  signInFailed: (email: string, reason: string) =>
    logSecurityEvent({
      actionType: 'signin_failed',
      actionCategory: 'authentication',
      metadata: { email, reason },
      severity: 'warn',
    }),

  mfaEnabled: (userId: string) =>
    logSecurityEvent({
      actionType: 'mfa_enabled',
      actionCategory: 'authentication',
      userId,
      severity: 'info',
    }),

  mfaVerified: (userId: string) =>
    logSecurityEvent({
      actionType: 'mfa_verified',
      actionCategory: 'authentication',
      userId,
      severity: 'info',
    }),

  // Marketplace events
  visionListed: (userId: string, visualizationId: string, priceCents: number) =>
    logSecurityEvent({
      actionType: 'vision_listed',
      actionCategory: 'marketplace',
      userId,
      targetType: 'visualization',
      targetId: visualizationId,
      metadata: { price_cents: priceCents },
      severity: 'info',
    }),

  visionPurchased: (buyerId: string, sellerId: string, visualizationId: string, priceCents: number) =>
    logSecurityEvent({
      actionType: 'vision_purchased',
      actionCategory: 'marketplace',
      userId: buyerId,
      targetType: 'visualization',
      targetId: visualizationId,
      metadata: { seller_id: sellerId, price_cents: priceCents },
      severity: 'info',
    }),

  // Subscription events
  subscriptionCreated: (userId: string, productId: string) =>
    logSecurityEvent({
      actionType: 'subscription_created',
      actionCategory: 'subscription',
      userId,
      metadata: { product_id: productId },
      severity: 'info',
    }),

  subscriptionCancelled: (userId: string) =>
    logSecurityEvent({
      actionType: 'subscription_cancelled',
      actionCategory: 'subscription',
      userId,
      severity: 'warn',
    }),

  // Withdrawal events
  withdrawalRequested: (userId: string, amountCents: number) =>
    logSecurityEvent({
      actionType: 'withdrawal_requested',
      actionCategory: 'withdrawal',
      userId,
      metadata: { amount_cents: amountCents },
      severity: 'info',
    }),

  withdrawalApproved: (adminId: string, userId: string, withdrawalId: string, amountCents: number) =>
    logSecurityEvent({
      actionType: 'withdrawal_approved',
      actionCategory: 'withdrawal',
      userId,
      adminId,
      targetType: 'withdrawal',
      targetId: withdrawalId,
      metadata: { amount_cents: amountCents },
      severity: 'warn',
    }),

  withdrawalRejected: (adminId: string, userId: string, withdrawalId: string, reason: string) =>
    logSecurityEvent({
      actionType: 'withdrawal_rejected',
      actionCategory: 'withdrawal',
      userId,
      adminId,
      targetType: 'withdrawal',
      targetId: withdrawalId,
      metadata: { reason },
      severity: 'warn',
    }),

  // Admin events
  adminAction: (adminId: string, actionType: string, targetType: string, targetId: string, metadata?: Record<string, Json>) =>
    logSecurityEvent({
      actionType,
      actionCategory: 'admin_action',
      adminId,
      targetType,
      targetId,
      metadata,
      severity: 'warn',
    }),

  userBanned: (adminId: string, userId: string, reason: string) =>
    logSecurityEvent({
      actionType: 'user_banned',
      actionCategory: 'moderation',
      userId,
      adminId,
      metadata: { reason },
      severity: 'critical',
    }),

  contentFlagged: (userId: string, contentId: string, reason: string) =>
    logSecurityEvent({
      actionType: 'content_flagged',
      actionCategory: 'moderation',
      userId,
      targetType: 'content',
      targetId: contentId,
      metadata: { reason },
      severity: 'warn',
    }),

  // Data access events
  sensitiveDataAccessed: (userId: string, dataType: string, targetId?: string) =>
    logSecurityEvent({
      actionType: 'sensitive_data_accessed',
      actionCategory: 'data_access',
      userId,
      targetType: dataType,
      targetId,
      severity: 'info',
    }),
};
