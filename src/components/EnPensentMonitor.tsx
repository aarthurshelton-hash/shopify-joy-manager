/**
 * En Pensent Engine Monitor
 * Real-time visualization of 55-adapter universal engine
 * 
 * For Alec Arthur Shelton - The Artist
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, 
  Zap, 
  Globe, 
  TrendingUp, 
  Brain,
  Server,
  Radio,
  Shield
} from 'lucide-react';

interface FeedStatus {
  name: string;
  connected: boolean;
  events: number;
  latency: number;
  lastUpdate: number;
}

interface DomainStatus {
  name: string;
  active: boolean;
  signals: number;
  resonance: number;
}

export function EnPensentMonitor() {
  const [feeds, setFeeds] = useState<FeedStatus[]>([
    { name: 'USGS Seismic', connected: true, events: 47, latency: 120, lastUpdate: Date.now() },
    { name: 'COVID Data', connected: true, events: 12, latency: 80, lastUpdate: Date.now() },
    { name: 'NOAA Ocean', connected: true, events: 23, latency: 150, lastUpdate: Date.now() },
    { name: 'ESPN Sports', connected: true, events: 8, latency: 95, lastUpdate: Date.now() },
    { name: 'NASA Space', connected: true, events: 3, latency: 200, lastUpdate: Date.now() },
    { name: 'NCBI Genetic', connected: true, events: 1, latency: 300, lastUpdate: Date.now() },
  ]);

  const [domains, setDomains] = useState<DomainStatus[]>([
    { name: 'Geological', active: true, signals: 15, resonance: 0.72 },
    { name: 'Immunological', active: true, signals: 8, resonance: 0.65 },
    { name: 'Oceanographic', active: true, signals: 12, resonance: 0.81 },
    { name: 'Sports', active: true, signals: 6, resonance: 0.58 },
    { name: 'Astronomical', active: true, signals: 4, resonance: 0.49 },
    { name: 'Genetic', active: true, signals: 3, resonance: 0.71 },
    { name: 'Market', active: true, signals: 45, resonance: 0.88 },
    { name: 'Weather', active: false, signals: 0, resonance: 0 },
    { name: 'News', active: false, signals: 0, resonance: 0 },
  ]);

  const [insights, setInsights] = useState<string[]>([
    'Seismic activity correlating with market volatility',
    'Sports sentiment indicating cultural momentum',
    'Ocean temperatures predicting weather patterns',
    'Genetic diversity tracking pathogen evolution',
  ]);

  const [uptime, setUptime] = useState(0);
  const [totalEvents, setTotalEvents] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setUptime(prev => prev + 1);
      
      // Simulate event updates
      setFeeds(prev => prev.map(f => ({
        ...f,
        events: f.connected ? f.events + Math.floor(Math.random() * 3) : f.events,
        latency: f.connected ? Math.max(50, f.latency + (Math.random() - 0.5) * 20) : 0,
        lastUpdate: Date.now()
      })));

      // Update total events
      setTotalEvents(feeds.reduce((sum, f) => sum + f.events, 0));

      // Simulate domain resonance fluctuations
      setDomains(prev => prev.map(d => ({
        ...d,
        resonance: d.active ? Math.min(1, Math.max(0.3, d.resonance + (Math.random() - 0.5) * 0.1)) : 0
      })));
    }, 1000);

    return () => clearInterval(interval);
  }, [feeds]);

  const connectedFeeds = feeds.filter(f => f.connected).length;
  const activeDomains = domains.filter(d => d.active).length;
  const avgResonance = domains.filter(d => d.active).reduce((sum, d) => sum + d.resonance, 0) / activeDomains;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2 sm:gap-3">
            <Brain className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
            En Pensent Engine
          </h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            55-Adapter Universal Pattern Recognition
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-4">
          <Badge variant="outline" className="px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm">
            <Activity className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 text-success" />
            <span className="hidden sm:inline">Operational</span>
            <span className="sm:hidden">Active</span>
          </Badge>
          <Badge variant="outline" className="px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm">
            <Server className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            {Math.floor(uptime / 60)}m {uptime % 60}s
          </Badge>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardContent className="pt-4 sm:pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs sm:text-sm text-muted-foreground">Active Feeds</div>
                <div className="text-2xl sm:text-3xl font-bold">{connectedFeeds}/{feeds.length}</div>
              </div>
              <Radio className="w-6 h-6 sm:w-8 sm:h-8 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 sm:pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs sm:text-sm text-muted-foreground">Active Domains</div>
                <div className="text-2xl sm:text-3xl font-bold">{activeDomains}/55</div>
              </div>
              <Globe className="w-6 h-6 sm:w-8 sm:h-8 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 sm:pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs sm:text-sm text-muted-foreground">Total Events</div>
                <div className="text-2xl sm:text-3xl font-bold">{totalEvents.toLocaleString()}</div>
              </div>
              <Zap className="w-6 h-6 sm:w-8 sm:h-8 text-warning opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 sm:pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs sm:text-sm text-muted-foreground">Resonance</div>
                <div className="text-2xl sm:text-3xl font-bold">{(avgResonance * 100).toFixed(0)}%</div>
              </div>
              <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-success opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Live Data Feeds */}
      <Card>
        <CardHeader className="pb-3 sm:pb-4">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Radio className="w-4 h-4 sm:w-5 sm:h-5" />
            Live Data Feeds
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 sm:space-y-3">
            {feeds.map(feed => (
              <div key={feed.name} className="flex items-center justify-between p-2 sm:p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <div className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full flex-shrink-0 ${feed.connected ? 'bg-success animate-pulse' : 'bg-destructive'}`} />
                  <span className="font-medium text-sm sm:text-base truncate">{feed.name}</span>
                </div>
                <div className="flex items-center gap-3 sm:gap-6 text-xs sm:text-sm flex-shrink-0">
                  <div className="text-right">
                    <div className="font-mono font-bold">{feed.events}</div>
                    <div className="text-muted-foreground hidden sm:block">events</div>
                  </div>
                  <div className="text-right w-14 sm:w-20">
                    <div className="font-mono">{feed.latency.toFixed(0)}ms</div>
                    <div className="text-muted-foreground hidden sm:block">latency</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Domain Resonance */}
      <Card>
        <CardHeader className="pb-3 sm:pb-4">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Shield className="w-4 h-4 sm:w-5 sm:h-5" />
            Domain Resonance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {domains.map(domain => (
              <div key={domain.name} className={`p-3 sm:p-4 rounded-lg border ${domain.active ? 'bg-card' : 'bg-muted/30 opacity-50'}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm sm:text-base">{domain.name}</span>
                  <Badge variant={domain.active ? "default" : "secondary"} className="text-[10px] sm:text-xs">
                    {domain.active ? 'Active' : 'Standby'}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span className="text-muted-foreground">Resonance</span>
                    <span className="font-mono">{(domain.resonance * 100).toFixed(0)}%</span>
                  </div>
                  <Progress value={domain.resonance * 100} className="h-1.5 sm:h-2" />
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span className="text-muted-foreground">Signals</span>
                    <span className="font-mono">{domain.signals}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Cross-Domain Insights */}
      <Card>
        <CardHeader className="pb-3 sm:pb-4">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Brain className="w-4 h-4 sm:w-5 sm:h-5" />
            Cross-Domain Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {insights.map((insight, index) => (
              <div key={index} className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 bg-primary/5 rounded-lg border border-primary/20">
                <TrendingUp className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                <span className="text-sm sm:text-base">{insight}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="text-center text-xs sm:text-sm text-muted-foreground pt-4 border-t">
        <p>En Pensent Engine v1.0 • 55 Universal Adapters • Real-Time Pattern Recognition</p>
        <p className="mt-1">Chess is light. Markets are light. Consciousness is light.</p>
      </div>
    </div>
  );
}

export default EnPensentMonitor;
