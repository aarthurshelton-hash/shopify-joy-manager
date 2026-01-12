import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';

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

export async function getActiveListings(): Promise<{
  data: MarketplaceListing[];
  error: Error | null;
}> {
  try {
    // First get listings with visualizations
    const { data: listingsData, error: listingsError } = await supabase
      .from('visualization_listings')
      .select(`
        *,
        visualization:saved_visualizations(id, title, image_path, game_data)
      `)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

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

    return { data: listings, error: null };
  } catch (error) {
    return { data: [], error: error as Error };
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