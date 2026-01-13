import { supabase } from '@/integrations/supabase/client';
import { SecurityEvents } from '@/lib/security/auditLog';
export interface WithdrawalRequest {
  id: string;
  user_id: string;
  amount_cents: number;
  status: 'pending' | 'approved' | 'rejected' | 'completed' | 'cancelled';
  payout_method: string;
  payout_details: Record<string, unknown> | null;
  admin_notes: string | null;
  reviewed_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface WithdrawalValidation {
  is_valid: boolean;
  error_message: string | null;
  max_withdrawable_cents: number;
}

// Get withdrawable balance (earned funds only)
export async function getWithdrawableBalance(): Promise<{
  data: number;
  error: Error | null;
}> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .rpc('get_withdrawable_balance', { p_user_id: user.id });

    if (error) throw error;
    return { data: data as number, error: null };
  } catch (error) {
    return { data: 0, error: error as Error };
  }
}

// Validate withdrawal before submitting
export async function validateWithdrawal(amountCents: number): Promise<{
  data: WithdrawalValidation | null;
  error: Error | null;
}> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .rpc('validate_withdrawal_request', { 
        p_user_id: user.id,
        p_amount_cents: amountCents 
      });

    if (error) throw error;
    
    // RPC returns array, get first row
    const result = Array.isArray(data) ? data[0] : data;
    return { data: result as WithdrawalValidation, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

// Create withdrawal request
export async function createWithdrawalRequest(
  amountCents: number,
  payoutDetails?: { method: string; email: string; notes?: string }
): Promise<{
  data: string | null;
  error: Error | null;
}> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .rpc('create_withdrawal_request', {
        p_user_id: user.id,
        p_amount_cents: amountCents,
        p_payout_details: payoutDetails ? JSON.parse(JSON.stringify(payoutDetails)) : null
      });

    if (error) throw error;
    
    // Log security event for withdrawal request
    SecurityEvents.withdrawalRequested(user.id, amountCents);
    
    return { data: data as string, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

// Get user's withdrawal requests
export async function getWithdrawalRequests(): Promise<{
  data: WithdrawalRequest[];
  error: Error | null;
}> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('withdrawal_requests')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data: (data || []) as WithdrawalRequest[], error: null };
  } catch (error) {
    return { data: [], error: error as Error };
  }
}

// Cancel pending withdrawal
export async function cancelWithdrawalRequest(requestId: string): Promise<{
  success: boolean;
  error: Error | null;
}> {
  try {
    const { error } = await supabase
      .from('withdrawal_requests')
      .update({ status: 'cancelled' })
      .eq('id', requestId);

    if (error) throw error;
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: error as Error };
  }
}

// Initiate Stripe deposit
export async function initiateDeposit(amountCents: number): Promise<{
  url: string | null;
  error: Error | null;
}> {
  try {
    const { data, error } = await supabase.functions.invoke('wallet-deposit', {
      body: { amount_cents: amountCents }
    });

    if (error) throw error;
    if (data?.error) throw new Error(data.error);
    
    return { url: data.url, error: null };
  } catch (error) {
    return { url: null, error: error as Error };
  }
}
