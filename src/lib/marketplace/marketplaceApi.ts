import { supabase } from '@/integrations/supabase/client';

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
    const { data, error } = await supabase
      .from('visualization_listings')
      .select(`
        *,
        visualization:saved_visualizations(id, title, image_path, game_data),
        seller:profiles!visualization_listings_seller_id_fkey(display_name)
      `)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Transform the data to match our interface
    const listings = (data || []).map((item: Record<string, unknown>) => ({
      ...item,
      visualization: Array.isArray(item.visualization) ? item.visualization[0] : item.visualization,
      seller: Array.isArray(item.seller) ? item.seller[0] : item.seller,
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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('visualization_listings')
      .insert({
        visualization_id: visualizationId,
        seller_id: user.id,
        price_cents: priceCents,
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
    const { error } = await supabase
      .from('visualization_listings')
      .update({ price_cents: priceCents })
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