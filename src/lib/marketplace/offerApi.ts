import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';

// Validation schema for offer amount
const offerAmountSchema = z.number()
  .int('Offer must be a whole number of cents')
  .min(0, 'Offer cannot be negative')
  .max(1000000, 'Maximum offer is $10,000');

export interface MarketplaceOffer {
  id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  offer_cents: number;
  status: 'pending' | 'accepted' | 'declined' | 'countered' | 'expired' | 'withdrawn';
  parent_offer_id: string | null;
  expires_at: string;
  message: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  buyer?: { display_name: string | null };
  seller?: { display_name: string | null };
}

// Create a new offer on a listing
export async function createOffer(
  listingId: string,
  sellerId: string,
  offerCents: number,
  message?: string
): Promise<{ data: MarketplaceOffer | null; error: Error | null }> {
  try {
    const validatedOffer = offerAmountSchema.parse(offerCents);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('marketplace_offers')
      .insert({
        listing_id: listingId,
        buyer_id: user.id,
        seller_id: sellerId,
        offer_cents: validatedOffer,
        message: message || null,
      })
      .select()
      .single();

    if (error) throw error;
    return { data: data as MarketplaceOffer, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

// Counter an existing offer (creates new offer linked to parent)
export async function counterOffer(
  parentOfferId: string,
  counterCents: number,
  message?: string
): Promise<{ data: MarketplaceOffer | null; error: Error | null }> {
  try {
    const validatedOffer = offerAmountSchema.parse(counterCents);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Get parent offer details
    const { data: parentOffer, error: parentError } = await supabase
      .from('marketplace_offers')
      .select('*')
      .eq('id', parentOfferId)
      .single();

    if (parentError || !parentOffer) throw new Error('Parent offer not found');

    // Mark parent as countered
    await supabase
      .from('marketplace_offers')
      .update({ status: 'countered' })
      .eq('id', parentOfferId);

    // Create counter offer (swap buyer/seller based on who is countering)
    const isBuyer = user.id === parentOffer.buyer_id;
    
    const { data, error } = await supabase
      .from('marketplace_offers')
      .insert({
        listing_id: parentOffer.listing_id,
        buyer_id: parentOffer.buyer_id,
        seller_id: parentOffer.seller_id,
        offer_cents: validatedOffer,
        parent_offer_id: parentOfferId,
        message: message || null,
      })
      .select()
      .single();

    if (error) throw error;
    return { data: data as MarketplaceOffer, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

// Accept an offer
export async function acceptOffer(offerId: string): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase
      .from('marketplace_offers')
      .update({ status: 'accepted' })
      .eq('id', offerId);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    return { error: error as Error };
  }
}

// Decline an offer
export async function declineOffer(offerId: string): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase
      .from('marketplace_offers')
      .update({ status: 'declined' })
      .eq('id', offerId);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    return { error: error as Error };
  }
}

// Withdraw a pending offer (buyer only)
export async function withdrawOffer(offerId: string): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase
      .from('marketplace_offers')
      .delete()
      .eq('id', offerId);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    return { error: error as Error };
  }
}

// Get offers for a specific listing
export async function getListingOffers(listingId: string): Promise<{
  data: MarketplaceOffer[];
  error: Error | null;
}> {
  try {
    const { data, error } = await supabase
      .from('marketplace_offers')
      .select('*')
      .eq('listing_id', listingId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data: (data || []) as MarketplaceOffer[], error: null };
  } catch (error) {
    return { data: [], error: error as Error };
  }
}

// Get all offers for current user (as buyer or seller)
export async function getUserOffers(): Promise<{
  data: MarketplaceOffer[];
  error: Error | null;
}> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('marketplace_offers')
      .select('*')
      .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data: (data || []) as MarketplaceOffer[], error: null };
  } catch (error) {
    return { data: [], error: error as Error };
  }
}

// Get active (pending) offers count for badge display
export async function getPendingOffersCount(): Promise<number> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return 0;

    const { count, error } = await supabase
      .from('marketplace_offers')
      .select('*', { count: 'exact', head: true })
      .eq('seller_id', user.id)
      .eq('status', 'pending');

    if (error) return 0;
    return count || 0;
  } catch {
    return 0;
  }
}

// Format offer for display
export function formatOffer(cents: number): string {
  if (cents === 0) return 'Free';
  return `$${(cents / 100).toFixed(2)}`;
}
