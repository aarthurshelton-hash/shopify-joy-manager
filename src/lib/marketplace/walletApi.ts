import { supabase } from '@/integrations/supabase/client';

export interface UserWallet {
  id: string;
  user_id: string;
  balance_cents: number;
  total_deposited_cents: number;
  total_withdrawn_cents: number;
  total_earned_cents: number;
  total_spent_cents: number;
  created_at: string;
  updated_at: string;
}

export interface WalletTransaction {
  id: string;
  user_id: string;
  transaction_type: 'deposit' | 'withdrawal' | 'sale' | 'purchase' | 'platform_fee';
  amount_cents: number;
  balance_after_cents: number;
  related_listing_id: string | null;
  counterparty_id: string | null;
  description: string | null;
  created_at: string;
}

// Get or create user wallet
export async function getUserWallet(): Promise<{
  data: UserWallet | null;
  error: Error | null;
}> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .rpc('get_or_create_wallet', { p_user_id: user.id });

    if (error) throw error;
    return { data: data as UserWallet, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

// Get wallet transaction history
export async function getWalletTransactions(limit = 50): Promise<{
  data: WalletTransaction[];
  error: Error | null;
}> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('wallet_transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return { data: (data || []) as WalletTransaction[], error: null };
  } catch (error) {
    return { data: [], error: error as Error };
  }
}

// Purchase a listing using wallet balance
export async function purchaseWithWallet(
  listingId: string,
  agreedPriceCents: number
): Promise<{
  success: boolean;
  error: Error | null;
}> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .rpc('process_marketplace_sale', {
        p_listing_id: listingId,
        p_buyer_id: user.id,
        p_sale_price_cents: agreedPriceCents,
      });

    if (error) throw error;
    return { success: data === true, error: null };
  } catch (error) {
    return { success: false, error: error as Error };
  }
}

// Format balance for display
export function formatBalance(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}
