import { supabase } from '@/integrations/supabase/client';

export interface FlaggedContent {
  id: string;
  content_type: string;
  content_id: string | null;
  content_text: string | null;
  content_image_url: string | null;
  user_id: string;
  reason: string;
  severity: 'low' | 'medium' | 'high';
  status: 'pending' | 'approved' | 'rejected' | 'banned';
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface BannedUser {
  id: string;
  user_id: string;
  reason: string;
  banned_by: string;
  banned_at: string;
  expires_at: string | null;
  offense_count: number;
}

export interface UserOffense {
  id: string;
  user_id: string;
  flagged_content_id: string | null;
  offense_type: 'warning' | 'temp_ban' | 'permanent_ban';
  notes: string | null;
  created_by: string;
  created_at: string;
}

/**
 * Flag content for admin review
 */
export async function flagContent(
  contentType: string,
  userId: string,
  reason: string,
  options?: {
    contentId?: string;
    contentText?: string;
    contentImageUrl?: string;
    severity?: 'low' | 'medium' | 'high';
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('flagged_content')
      .insert({
        content_type: contentType,
        content_id: options?.contentId || null,
        content_text: options?.contentText || null,
        content_image_url: options?.contentImageUrl || null,
        user_id: userId,
        reason,
        severity: options?.severity || 'medium',
        status: 'pending',
      });

    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    console.error('Error flagging content:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Check if user is currently banned
 */
export async function checkUserBanStatus(userId: string): Promise<{
  isBanned: boolean;
  reason?: string;
  expiresAt?: string | null;
}> {
  try {
    const { data, error } = await supabase
      .from('banned_users')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      return { isBanned: false };
    }

    // Check if ban has expired
    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      return { isBanned: false };
    }

    return {
      isBanned: true,
      reason: data.reason,
      expiresAt: data.expires_at,
    };
  } catch (error) {
    console.error('Error checking ban status:', error);
    return { isBanned: false };
  }
}

/**
 * Get user's offense count
 */
export async function getUserOffenseCount(userId: string): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('user_offenses')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (error) throw error;
    return count || 0;
  } catch (error) {
    console.error('Error getting offense count:', error);
    return 0;
  }
}

/**
 * Get pending flagged content for admin review
 */
export async function getPendingFlaggedContent(): Promise<FlaggedContent[]> {
  try {
    const { data, error } = await supabase
      .from('flagged_content')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as FlaggedContent[];
  } catch (error) {
    console.error('Error getting flagged content:', error);
    return [];
  }
}

/**
 * Review flagged content (admin action)
 */
export async function reviewFlaggedContent(
  flagId: string,
  decision: 'approved' | 'rejected' | 'banned',
  reviewerId: string,
  notes?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('flagged_content')
      .update({
        status: decision,
        reviewed_by: reviewerId,
        reviewed_at: new Date().toISOString(),
        review_notes: notes || null,
      })
      .eq('id', flagId);

    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    console.error('Error reviewing content:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Ban a user (admin action)
 */
export async function banUser(
  userId: string,
  reason: string,
  bannedBy: string,
  options?: {
    expiresAt?: Date; // null = permanent
    offenseCount?: number;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if already banned
    const { data: existing } = await supabase
      .from('banned_users')
      .select('id, offense_count')
      .eq('user_id', userId)
      .maybeSingle();

    if (existing) {
      // Update existing ban
      const { error } = await supabase
        .from('banned_users')
        .update({
          reason,
          banned_by: bannedBy,
          banned_at: new Date().toISOString(),
          expires_at: options?.expiresAt?.toISOString() || null,
          offense_count: (existing.offense_count || 1) + 1,
        })
        .eq('id', existing.id);

      if (error) throw error;
    } else {
      // Create new ban
      const { error } = await supabase
        .from('banned_users')
        .insert({
          user_id: userId,
          reason,
          banned_by: bannedBy,
          expires_at: options?.expiresAt?.toISOString() || null,
          offense_count: options?.offenseCount || 1,
        });

      if (error) throw error;
    }

    // Record the offense
    await supabase.from('user_offenses').insert({
      user_id: userId,
      offense_type: options?.expiresAt ? 'temp_ban' : 'permanent_ban',
      notes: reason,
      created_by: bannedBy,
    });

    return { success: true };
  } catch (error: any) {
    console.error('Error banning user:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Unban a user (admin action)
 */
export async function unbanUser(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('banned_users')
      .delete()
      .eq('user_id', userId);

    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    console.error('Error unbanning user:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get all banned users (admin)
 */
export async function getBannedUsers(): Promise<BannedUser[]> {
  try {
    const { data, error } = await supabase
      .from('banned_users')
      .select('*')
      .order('banned_at', { ascending: false });

    if (error) throw error;
    return (data || []) as BannedUser[];
  } catch (error) {
    console.error('Error getting banned users:', error);
    return [];
  }
}

/**
 * Issue a warning (admin action)
 */
export async function issueWarning(
  userId: string,
  flaggedContentId: string | null,
  notes: string,
  adminId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.from('user_offenses').insert({
      user_id: userId,
      flagged_content_id: flaggedContentId,
      offense_type: 'warning',
      notes,
      created_by: adminId,
    });

    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    console.error('Error issuing warning:', error);
    return { success: false, error: error.message };
  }
}
