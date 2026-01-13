import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { MapPin, Globe, Users, TrendingUp, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';

interface LocationStats {
  country: string;
  country_code: string;
  user_count: number;
  percentage: number;
}

interface CityStats {
  city: string;
  region: string;
  country: string;
  user_count: number;
}

export const AdminLocationAnalytics: React.FC = () => {
  // Fetch location analytics
  const { data: locationData, isLoading } = useQuery({
    queryKey: ['admin-location-analytics'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_location_analytics')
        .select('*');
      
      if (error) throw error;
      return data || [];
    },
  });

  // Process country stats
  const countryStats: LocationStats[] = React.useMemo(() => {
    if (!locationData?.length) return [];
    
    const countryMap = new Map<string, { count: number; code: string }>();
    locationData.forEach(loc => {
      if (loc.country) {
        const existing = countryMap.get(loc.country) || { count: 0, code: loc.country_code || '' };
        countryMap.set(loc.country, { count: existing.count + 1, code: existing.code });
      }
    });
    
    const total = locationData.length;
    return Array.from(countryMap.entries())
      .map(([country, data]) => ({
        country,
        country_code: data.code,
        user_count: data.count,
        percentage: (data.count / total) * 100
      }))
      .sort((a, b) => b.user_count - a.user_count);
  }, [locationData]);

  // Process city stats
  const cityStats: CityStats[] = React.useMemo(() => {
    if (!locationData?.length) return [];
    
    const cityMap = new Map<string, CityStats>();
    locationData.forEach(loc => {
      if (loc.city) {
        const key = `${loc.city}-${loc.region}-${loc.country}`;
        const existing = cityMap.get(key);
        if (existing) {
          existing.user_count++;
        } else {
          cityMap.set(key, {
            city: loc.city,
            region: loc.region || '',
            country: loc.country || '',
            user_count: 1
          });
        }
      }
    });
    
    return Array.from(cityMap.values())
      .sort((a, b) => b.user_count - a.user_count)
      .slice(0, 20);
  }, [locationData]);

  // Get recent activity
  const recentLocations = React.useMemo(() => {
    if (!locationData?.length) return [];
    return [...locationData]
      .sort((a, b) => new Date(b.last_seen_at).getTime() - new Date(a.last_seen_at).getTime())
      .slice(0, 10);
  }, [locationData]);

  // Get timezone distribution
  const timezoneStats = React.useMemo(() => {
    if (!locationData?.length) return [];
    
    const tzMap = new Map<string, number>();
    locationData.forEach(loc => {
      if (loc.timezone) {
        tzMap.set(loc.timezone, (tzMap.get(loc.timezone) || 0) + 1);
      }
    });
    
    return Array.from(tzMap.entries())
      .map(([tz, count]) => ({ timezone: tz, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [locationData]);

  const getFlagEmoji = (countryCode: string) => {
    if (!countryCode || countryCode.length !== 2) return '🌍';
    const codePoints = countryCode
      .toUpperCase()
      .split('')
      .map(char => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Users className="h-4 w-4" />
              <span className="text-sm">Tracked Users</span>
            </div>
            <p className="text-2xl font-bold">{locationData?.length || 0}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Globe className="h-4 w-4" />
              <span className="text-sm">Countries</span>
            </div>
            <p className="text-2xl font-bold">{countryStats.length}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <MapPin className="h-4 w-4" />
              <span className="text-sm">Cities</span>
            </div>
            <p className="text-2xl font-bold">{cityStats.length}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Clock className="h-4 w-4" />
              <span className="text-sm">Timezones</span>
            </div>
            <p className="text-2xl font-bold">{timezoneStats.length}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Country Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Users by Country
            </CardTitle>
            <CardDescription>Geographic distribution of your user base</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              <div className="space-y-3">
                {countryStats.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No location data yet</p>
                ) : (
                  countryStats.map((stat, index) => (
                    <motion.div
                      key={stat.country}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{getFlagEmoji(stat.country_code)}</span>
                          <span className="font-medium">{stat.country}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{stat.user_count} users</Badge>
                          <span className="text-sm text-muted-foreground w-12 text-right">
                            {stat.percentage.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                      <Progress value={stat.percentage} className="h-1.5" />
                    </motion.div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Top Cities */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Top Cities
            </CardTitle>
            <CardDescription>Most active user locations</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              <div className="space-y-2">
                {cityStats.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No city data yet</p>
                ) : (
                  cityStats.map((city, index) => (
                    <motion.div
                      key={`${city.city}-${city.region}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{city.city}</p>
                          <p className="text-xs text-muted-foreground">
                            {city.region && `${city.region}, `}{city.country}
                          </p>
                        </div>
                      </div>
                      <Badge variant="secondary">{city.user_count}</Badge>
                    </motion.div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Recent Location Activity
            </CardTitle>
            <CardDescription>Latest user location updates</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              <div className="space-y-2">
                {recentLocations.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No recent activity</p>
                ) : (
                  recentLocations.map((loc, index) => (
                    <motion.div
                      key={loc.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center justify-between p-2 rounded-lg border border-border/50"
                    >
                      <div className="flex items-center gap-2">
                        <span>{getFlagEmoji(loc.country_code || '')}</span>
                        <div>
                          <p className="text-sm font-medium">
                            {loc.city || 'Unknown'}{loc.region ? `, ${loc.region}` : ''}
                          </p>
                          <p className="text-xs text-muted-foreground">{loc.country}</p>
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(loc.last_seen_at), { addSuffix: true })}
                      </span>
                    </motion.div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Timezone Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Timezone Distribution
            </CardTitle>
            <CardDescription>When your users are most active</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              <div className="space-y-2">
                {timezoneStats.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No timezone data yet</p>
                ) : (
                  timezoneStats.map((tz, index) => (
                    <motion.div
                      key={tz.timezone}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50"
                    >
                      <span className="text-sm font-medium">{tz.timezone}</span>
                      <Badge variant="outline">{tz.count} users</Badge>
                    </motion.div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
