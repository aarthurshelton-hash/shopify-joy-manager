// IP Geolocation using free ip-api.com service
export interface GeoLocation {
  ip: string;
  country: string | null;
  countryCode: string | null;
  region: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  timezone: string | null;
}

// Simple hash function for IP privacy
export function hashIP(ip: string): string {
  let hash = 0;
  for (let i = 0; i < ip.length; i++) {
    const char = ip.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}

export async function getIPGeolocation(): Promise<GeoLocation | null> {
  try {
    // Using ip-api.com free tier (no API key required, 45 req/min limit)
    const response = await fetch('http://ip-api.com/json/?fields=status,message,country,countryCode,region,city,lat,lon,timezone,query', {
      method: 'GET',
    });
    
    if (!response.ok) {
      console.warn('Geolocation API request failed');
      return null;
    }
    
    const data = await response.json();
    
    if (data.status === 'fail') {
      console.warn('Geolocation lookup failed:', data.message);
      return null;
    }
    
    return {
      ip: data.query,
      country: data.country || null,
      countryCode: data.countryCode || null,
      region: data.region || null,
      city: data.city || null,
      latitude: data.lat || null,
      longitude: data.lon || null,
      timezone: data.timezone || null,
    };
  } catch (error) {
    console.warn('Error fetching geolocation:', error);
    return null;
  }
}

// Alternative using https ipify + geojs.io (both free, https support)
export async function getIPGeolocationSecure(): Promise<GeoLocation | null> {
  try {
    // First get IP from ipify (https supported)
    const ipResponse = await fetch('https://api.ipify.org?format=json');
    if (!ipResponse.ok) return null;
    const ipData = await ipResponse.json();
    const ip = ipData.ip;
    
    // Then get geo data from geojs.io (free, no key required)
    const geoResponse = await fetch(`https://get.geojs.io/v1/ip/geo/${ip}.json`);
    if (!geoResponse.ok) {
      return { ip, country: null, countryCode: null, region: null, city: null, latitude: null, longitude: null, timezone: null };
    }
    
    const geoData = await geoResponse.json();
    
    return {
      ip,
      country: geoData.country || null,
      countryCode: geoData.country_code || null,
      region: geoData.region || null,
      city: geoData.city || null,
      latitude: geoData.latitude ? parseFloat(geoData.latitude) : null,
      longitude: geoData.longitude ? parseFloat(geoData.longitude) : null,
      timezone: geoData.timezone || null,
    };
  } catch (error) {
    console.warn('Error fetching secure geolocation:', error);
    return null;
  }
}
