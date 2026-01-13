import { supabase } from '@/integrations/supabase/client';
import { getIPGeolocationSecure, hashIP } from './geolocation';

// Track user location on auth events (anonymized - no precise coordinates)
export async function trackUserLocation(userId: string): Promise<boolean> {
  try {
    const geo = await getIPGeolocationSecure();
    
    if (!geo) {
      console.warn('Could not get geolocation data');
      return false;
    }

    const ipHash = geo.ip ? hashIP(geo.ip) : null;

    // Upsert location data - ANONYMIZED: no latitude/longitude stored
    const { error } = await supabase
      .from('user_location_analytics')
      .upsert(
        {
          user_id: userId,
          ip_hash: ipHash,
          country: geo.country,
          country_code: geo.countryCode,
          region: geo.region,
          city: geo.city,
          // Precise coordinates removed for privacy - only country/region/city retained
          latitude: null,
          longitude: null,
          timezone: geo.timezone,
          last_seen_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id',
        }
      );

    if (error) {
      console.error('Error tracking user location:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in trackUserLocation:', error);
    return false;
  }
}

// Update last seen timestamp without full geo lookup
export async function updateLastSeen(userId: string): Promise<void> {
  try {
    await supabase
      .from('user_location_analytics')
      .update({ last_seen_at: new Date().toISOString() })
      .eq('user_id', userId);
  } catch (error) {
    console.warn('Error updating last seen:', error);
  }
}
