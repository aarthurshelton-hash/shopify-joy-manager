import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';
import { SecurityEvents } from '@/lib/security/auditLog';

// Validation schema for listing price
const listingPriceSchema = z.number()
  .int('Price must be a whole number of cents')
  .min(0, 'Price cannot be negative')
  .max(1000000, 'Maximum price is $10,000');

export interface MarketplaceListing {
  id: string;
  visualization_id: string;
  seller_id: string;
  price_cents: number;
  status: 'active' | 'sold' | 'cancelled';
  buyer_id: string | null;
  created_at: string;
  sold_at: string | null;
  visualization?: {
    id: string;
    title: string;
    image_path: string;
    game_data: Record<string, unknown>;
    pgn?: string | null;
  };
  seller?: {
    display_name: string | null;
  };
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
  error: Error | null;
}

export async function getActiveListings(
  options: PaginationOptions = {}
): Promise<PaginatedResult<MarketplaceListing>> {
  const { page = 1, limit = 50 } = options;
  const offset = (page - 1) * limit;

  try {
    // Get total count for pagination
    const { count, error: countError } = await supabase
      .from('visualization_listings')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    if (countError) throw countError;

    // Get paginated listings with visualizations
    const { data: listingsData, error: listingsError } = await supabase
      .from('visualization_listings')
      .select(`
        *,
        visualization:saved_visualizations(id, title, image_path, game_data)
      `)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (listingsError) throw listingsError;

    // Get unique seller IDs and fetch profiles separately
    const sellerIds = [...new Set((listingsData || []).map(l => l.seller_id))];
    
    let profilesMap: Record<string, { display_name: string | null }> = {};
    if (sellerIds.length > 0) {
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, display_name')
        .in('user_id', sellerIds);
      
      profilesMap = (profilesData || []).reduce((acc, p) => {
        acc[p.user_id] = { display_name: p.display_name };
        return acc;
      }, {} as Record<string, { display_name: string | null }>);
    }

    // Transform the data to match our interface
    const listings = (listingsData || []).map((item: Record<string, unknown>) => ({
      ...item,
      visualization: Array.isArray(item.visualization) ? item.visualization[0] : item.visualization,
      seller: profilesMap[item.seller_id as string] || { display_name: null },
    })) as MarketplaceListing[];

    const total = count || 0;

    return { 
      data: listings, 
      total,
      page,
      limit,
      hasMore: offset + listings.length < total,
      error: null 
    };
  } catch (error) {
    return { data: [], total: 0, page, limit, hasMore: false, error: error as Error };
  }
}

// Batch check multiple visualizations for listing status (optimized for N+1)
export async function batchCheckVisualizationsListed(
  visualizationIds: string[]
): Promise<Record<string, boolean>> {
  if (visualizationIds.length === 0) return {};

  try {
    const { data, error } = await supabase
      .from('visualization_listings')
      .select('visualization_id')
      .in('visualization_id', visualizationIds)
      .eq('status', 'active');

    if (error) throw error;

    const listedSet = new Set((data || []).map(l => l.visualization_id));
    
    return visualizationIds.reduce((acc, id) => {
      acc[id] = listedSet.has(id);
      return acc;
    }, {} as Record<string, boolean>);
  } catch (error) {
    console.error('Batch listing check failed:', error);
    return visualizationIds.reduce((acc, id) => {
      acc[id] = false;
      return acc;
    }, {} as Record<string, boolean>);
  }
}

export async function getUserListings(userId: string): Promise<{
  data: MarketplaceListing[];
  error: Error | null;
}> {
  try {
    const { data, error } = await supabase
      .from('visualization_listings')
      .select(`
        *,
        visualization:saved_visualizations(id, title, image_path, game_data)
      `)
      .eq('seller_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const listings = (data || []).map((item: Record<string, unknown>) => ({
      ...item,
      visualization: Array.isArray(item.visualization) ? item.visualization[0] : item.visualization,
    })) as MarketplaceListing[];

    return { data: listings, error: null };
  } catch (error) {
    return { data: [], error: error as Error };
  }
}

export async function createListing(
  visualizationId: string,
  priceCents: number
): Promise<{ data: MarketplaceListing | null; error: Error | null }> {
  try {
    // Validate price before making API call
    const validatedPrice = listingPriceSchema.parse(priceCents);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('visualization_listings')
      .insert({
        visualization_id: visualizationId,
        seller_id: user.id,
        price_cents: validatedPrice,
      })
      .select()
      .single();

    if (error) throw error;
    
    // Log security event for listing creation
    SecurityEvents.visionListed(user.id, visualizationId, validatedPrice);
    
    return { data: data as MarketplaceListing, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

export async function cancelListing(listingId: string): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase
      .from('visualization_listings')
      .update({ status: 'cancelled' })
      .eq('id', listingId);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    return { error: error as Error };
  }
}

export async function updateListingPrice(
  listingId: string,
  priceCents: number
): Promise<{ error: Error | null }> {
  try {
    // Validate price before making API call
    const validatedPrice = listingPriceSchema.parse(priceCents);

    const { error } = await supabase
      .from('visualization_listings')
      .update({ price_cents: validatedPrice })
      .eq('id', listingId);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    return { error: error as Error };
  }
}

export async function purchaseListing(listingId: string): Promise<{
  url?: string;
  success?: boolean;
  message?: string;
  visualizationId?: string;
  error: Error | null;
}> {
  try {
    const { data, error } = await supabase.functions.invoke('marketplace-purchase', {
      body: { listingId },
    });

    if (error) throw error;
    if (data.error) throw new Error(data.error);

    return { ...data, error: null };
  } catch (error) {
    return { error: error as Error };
  }
}

export async function completePurchase(listingId: string): Promise<{
  success?: boolean;
  message?: string;
  visualizationId?: string;
  error: Error | null;
}> {
  try {
    const { data, error } = await supabase.functions.invoke('complete-marketplace-purchase', {
      body: { listingId },
    });

    if (error) throw error;
    if (data.error) throw new Error(data.error);

    return { ...data, error: null };
  } catch (error) {
    return { error: error as Error };
  }
}

export async function checkVisualizationListed(visualizationId: string): Promise<{
  isListed: boolean;
  listing?: MarketplaceListing;
}> {
  try {
    const { data, error } = await supabase
      .from('visualization_listings')
      .select('*')
      .eq('visualization_id', visualizationId)
      .eq('status', 'active')
      .single();

    if (error || !data) return { isListed: false };
    return { isListed: true, listing: data as MarketplaceListing };
  } catch {
    return { isListed: false };
  }
}

export async function getListingById(listingId: string): Promise<{
  data: MarketplaceListing | null;
  error: Error | null;
}> {
  try {
    const { data: listingData, error: listingError } = await supabase
      .from('visualization_listings')
      .select(`
        *,
        visualization:saved_visualizations(id, title, image_path, game_data, pgn)
      `)
      .eq('id', listingId)
      .single();

    if (listingError) throw listingError;
    if (!listingData) return { data: null, error: null };

    // Fetch seller profile separately
    const { data: profileData } = await supabase
      .from('profiles')
      .select('user_id, display_name')
      .eq('user_id', listingData.seller_id)
      .single();

    const listing = {
      ...listingData,
      visualization: Array.isArray(listingData.visualization) 
        ? listingData.visualization[0] 
        : listingData.visualization,
      seller: profileData ? { display_name: profileData.display_name } : { display_name: null },
    } as MarketplaceListing;

    return { data: listing, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

// Check remaining transfers for a visualization (max 3 per 24h)
export async function getRemainingTransfers(visualizationId: string): Promise<{
  remaining: number;
  canTransfer: boolean;
  error: Error | null;
}> {
  try {
    const { data: remaining, error } = await supabase
      .rpc('get_remaining_transfers', { p_visualization_id: visualizationId });

    if (error) throw error;

    return { 
      remaining: remaining ?? 3, 
      canTransfer: (remaining ?? 3) > 0,
      error: null 
    };
  } catch (error) {
    return { remaining: 0, canTransfer: false, error: error as Error };
  }
}

// Get orphaned visualizations (available for claim by premium members)
export async function getOrphanedVisualizations(): Promise<{
  data: Array<{
    id: string;
    title: string;
    image_path: string;
    game_data: unknown;
    pgn?: string | null;
  }>;
  error: Error | null;
}> {
  try {
    const { data, error } = await supabase
      .from('saved_visualizations')
      .select('id, title, image_path, game_data, pgn')
      .is('user_id', null)
      .order('updated_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    return { data: (data || []) as Array<{ id: string; title: string; image_path: string; game_data: unknown; pgn?: string | null }>, error: null };
  } catch (error) {
    return { data: [], error: error as Error };
  }
}

// Claim an orphaned visualization (for premium members)
export async function claimOrphanedVisualization(visualizationId: string): Promise<{
  success: boolean;
  error: Error | null;
}> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Check if user is premium
    const { data: isPremium } = await supabase.rpc('is_premium_user', { p_user_id: user.id });
    if (!isPremium) {
      throw new Error('Premium membership required to claim visions');
    }

    // Check transfer limits
    const { data: canTransfer, error: transferError } = await supabase
      .rpc('can_transfer_visualization', { p_visualization_id: visualizationId });
    
    if (transferError) throw transferError;
    if (!canTransfer) {
      throw new Error('This vision has reached its transfer limit (3 per 24h). Try again later.');
    }

    // Claim the visualization
    const { error: claimError } = await supabase
      .from('saved_visualizations')
      .update({ user_id: user.id })
      .eq('id', visualizationId)
      .is('user_id', null);

    if (claimError) throw claimError;

    // Record the transfer
    // Note: This will fail silently if the user doesn't have permission, 
    // but the claim still succeeds - the record is just for tracking
    await supabase
      .from('visualization_transfers')
      .insert({
        visualization_id: visualizationId,
        from_user_id: null, // Orphaned
        to_user_id: user.id,
        transfer_type: 'free_claim',
      });

    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: error as Error };
  }
}