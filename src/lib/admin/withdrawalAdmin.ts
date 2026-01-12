import { supabase } from '@/integrations/supabase/client';

export interface WithdrawalRequest {
  id: string;
  user_id: string;
  amount_cents: number;
  status: 'pending' | 'approved' | 'rejected' | 'completed' | 'cancelled';
  payout_method: string;
  payout_details: {
    method?: string;
    email?: string;
    notes?: string;
  } | null;
  admin_notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  user_email?: string;
  user_display_name?: string;
  wallet_total_earned?: number;
  wallet_total_withdrawn?: number;
}

// Get all withdrawal requests (admin only)
export async function getAllWithdrawalRequests(
  status?: string
): Promise<{ data: WithdrawalRequest[]; error: Error | null }> {
  try {
    let query = supabase
      .from('withdrawal_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) throw error;

    // Get user details for each request
    const userIds = [...new Set((data || []).map(r => r.user_id))];
    
    // Get profiles
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, display_name')
      .in('user_id', userIds);

    // Get wallets
    const { data: wallets } = await supabase
      .from('user_wallets')
      .select('user_id, total_earned_cents, total_withdrawn_cents')
      .in('user_id', userIds);

    const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
    const walletMap = new Map(wallets?.map(w => [w.user_id, w]) || []);

    const enrichedData = (data || []).map(r => ({
      ...r,
      payout_details: r.payout_details as WithdrawalRequest['payout_details'],
      user_display_name: profileMap.get(r.user_id)?.display_name || 'Unknown User',
      wallet_total_earned: walletMap.get(r.user_id)?.total_earned_cents || 0,
      wallet_total_withdrawn: walletMap.get(r.user_id)?.total_withdrawn_cents || 0,
    })) as WithdrawalRequest[];

    return { data: enrichedData, error: null };
  } catch (error) {
    return { data: [], error: error as Error };
  }
}

// Approve a withdrawal request
export async function approveWithdrawal(
  requestId: string,
  adminNotes?: string
): Promise<{ success: boolean; error: Error | null }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('withdrawal_requests')
      .update({
        status: 'approved',
        admin_notes: adminNotes || null,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', requestId)
      .eq('status', 'pending');

    if (error) throw error;
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: error as Error };
  }
}

// Reject a withdrawal request
export async function rejectWithdrawal(
  requestId: string,
  adminNotes: string
): Promise<{ success: boolean; error: Error | null }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    if (!adminNotes) {
      throw new Error('Rejection reason is required');
    }

    const { error } = await supabase
      .from('withdrawal_requests')
      .update({
        status: 'rejected',
        admin_notes: adminNotes,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', requestId)
      .eq('status', 'pending');

    if (error) throw error;
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: error as Error };
  }
}

// Mark withdrawal as completed (after manual payout)
export async function completeWithdrawal(
  requestId: string,
  adminNotes?: string
): Promise<{ success: boolean; error: Error | null }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Get the request details first
    const { data: request, error: fetchError } = await supabase
      .from('withdrawal_requests')
      .select('*')
      .eq('id', requestId)
      .eq('status', 'approved')
      .single();

    if (fetchError || !request) {
      throw new Error('Request not found or not in approved status');
    }

    // Update request to completed
    const { error: updateError } = await supabase
      .from('withdrawal_requests')
      .update({
        status: 'completed',
        admin_notes: adminNotes ? `${request.admin_notes || ''}\n---\n${adminNotes}` : request.admin_notes,
        completed_at: new Date().toISOString(),
      })
      .eq('id', requestId);

    if (updateError) throw updateError;

    // Update user's wallet (deduct withdrawn amount)
    // This needs to be done via service role, so we'll use an edge function
    const { error: walletError } = await supabase.functions.invoke('process-withdrawal', {
      body: { 
        request_id: requestId,
        user_id: request.user_id,
        amount_cents: request.amount_cents
      }
    });

    if (walletError) {
      console.error('Wallet update error:', walletError);
      // Don't throw - the withdrawal is marked complete, wallet update can be retried
    }

    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: error as Error };
  }
}

// Get withdrawal stats
export async function getWithdrawalStats(): Promise<{
  data: {
    pending_count: number;
    pending_amount: number;
    approved_count: number;
    approved_amount: number;
    completed_total: number;
    rejected_count: number;
  } | null;
  error: Error | null;
}> {
  try {
    const { data, error } = await supabase
      .from('withdrawal_requests')
      .select('status, amount_cents');

    if (error) throw error;

    const stats = {
      pending_count: 0,
      pending_amount: 0,
      approved_count: 0,
      approved_amount: 0,
      completed_total: 0,
      rejected_count: 0,
    };

    (data || []).forEach(r => {
      switch (r.status) {
        case 'pending':
          stats.pending_count++;
          stats.pending_amount += r.amount_cents;
          break;
        case 'approved':
          stats.approved_count++;
          stats.approved_amount += r.amount_cents;
          break;
        case 'completed':
          stats.completed_total += r.amount_cents;
          break;
        case 'rejected':
          stats.rejected_count++;
          break;
      }
    });

    return { data: stats, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}
