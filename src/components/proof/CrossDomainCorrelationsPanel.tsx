/**
 * Cross-Domain Correlations Panel
 * 
 * Tracks and visualizes correlations between chess patterns,
 * code health, and market movements.
 */

import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { motion } from 'framer-motion';
import { 
  Link2, 
  Crown, 
  Code2, 
  TrendingUp, 
  ArrowRight,
  Sparkles,
  Timer,
  WifiOff
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface DomainCorrelation {
  id: string;
  domainA: { name: string; metric: string; value: number };
  domainB: { name: string; metric: string; value: number };
  correlation: number;
  lag: number; // ms
  confidence: number;
  lastUpdated: Date;
  significance: 'strong' | 'moderate' | 'weak';
}

interface CorrelationSummary {
  correlations: DomainCorrelation[];
  strongestPair: DomainCorrelation | null;
  averageCorrelation: number;
  recentEvents: Array<{
    timestamp: Date;
    event: string;
    domains: string[];
  }>;
}

// Fetch real correlations from the cross_domain_correlations Supabase table
// Returns null when no real data is available (OFFLINE state)
async function fetchRealCorrelations(): Promise<CorrelationSummary | null> {
  try {
    // Table may not be in generated types yet — use type assertion
    const { data, error } = await (supabase as any)
      .from('cross_domain_correlations')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.warn('[CrossDomain] DB fetch error:', error.message);
      return null;
    }

    if (!data || (data as any[]).length === 0) {
      return null;
    }

    const rows = data as any[];

    // Group by domain pair and take the most recent correlation for each pair
    const pairMap = new Map<string, any>();
    for (const row of rows) {
      const pairKey = `${row.domain_a}_${row.domain_b}`;
      if (!pairMap.has(pairKey)) {
        pairMap.set(pairKey, row);
      }
    }

    const correlations: DomainCorrelation[] = Array.from(pairMap.values()).map(row => {
      const corrValue = typeof row.correlation_strength === 'number' ? row.correlation_strength : 0;
      const conf = typeof row.confidence === 'number' ? row.confidence : 0;
      const significance: 'strong' | 'moderate' | 'weak' = 
        corrValue > 0.7 ? 'strong' : corrValue > 0.4 ? 'moderate' : 'weak';

      return {
        id: row.id,
        domainA: { 
          name: row.domain_a || 'Unknown', 
          metric: row.metric_a || 'Signal', 
          value: typeof row.value_a === 'number' ? row.value_a : 0 
        },
        domainB: { 
          name: row.domain_b || 'Unknown', 
          metric: row.metric_b || 'Signal', 
          value: typeof row.value_b === 'number' ? row.value_b : 0 
        },
        correlation: corrValue,
        lag: typeof row.lag_ms === 'number' ? row.lag_ms : 0,
        confidence: conf,
        lastUpdated: new Date(row.created_at),
        significance,
      };
    });

    correlations.sort((a, b) => b.correlation - a.correlation);

    // Build recent events from actual DB rows (most recent entries)
    const recentEvents = rows.slice(0, 3).map(row => ({
      timestamp: new Date(row.created_at),
      event: row.description || `${row.domain_a} ↔ ${row.domain_b} correlation detected (${((row.correlation_strength || 0) * 100).toFixed(0)}%)`,
      domains: [row.domain_a || 'Unknown', row.domain_b || 'Unknown'],
    }));

    const avgCorrelation = correlations.length > 0
      ? correlations.reduce((s, c) => s + c.correlation, 0) / correlations.length
      : 0;

    return {
      correlations,
      strongestPair: correlations[0] || null,
      averageCorrelation: avgCorrelation,
      recentEvents,
    };
  } catch (err) {
    console.error('[CrossDomain] Unexpected error:', err);
    return null;
  }
}

const getDomainIcon = (domain: string) => {
  switch (domain.toLowerCase()) {
    case 'chess': return <Crown className="w-3 h-3" />;
    case 'code': return <Code2 className="w-3 h-3" />;
    case 'market': return <TrendingUp className="w-3 h-3" />;
    default: return <Sparkles className="w-3 h-3" />;
  }
};

const getSignificanceColor = (sig: string) => {
  switch (sig) {
    case 'strong': return 'bg-green-500/20 text-green-400 border-green-500/30';
    case 'moderate': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    case 'weak': return 'bg-muted text-muted-foreground';
    default: return 'bg-muted text-muted-foreground';
  }
};

export function CrossDomainCorrelationsPanel() {
  const [summary, setSummary] = useState<CorrelationSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);

  const refreshData = useCallback(async () => {
    const data = await fetchRealCorrelations();
    if (data) {
      setSummary(data);
      setOffline(false);
    } else {
      setSummary(null);
      setOffline(true);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 30000);
    return () => clearInterval(interval);
  }, [refreshData]);

  if (loading) {
    return (
      <Card className="bg-card/50 backdrop-blur border-primary/20">
        <CardContent className="p-8 text-center">
          <Link2 className="w-8 h-8 mx-auto animate-pulse text-primary" />
          <p className="mt-4 text-muted-foreground">Mapping cross-domain correlations...</p>
        </CardContent>
      </Card>
    );
  }

  if (offline || !summary) {
    return (
      <Card className="bg-card/50 backdrop-blur border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="w-5 h-5 text-primary" />
            Cross-Domain Correlations
          </CardTitle>
          <CardDescription>
            Chess ↔ Code ↔ Market pattern synchronization
          </CardDescription>
        </CardHeader>
        <CardContent className="p-8 text-center">
          <WifiOff className="w-8 h-8 mx-auto text-muted-foreground" />
          <p className="mt-4 text-muted-foreground font-medium">OFFLINE</p>
          <p className="mt-1 text-xs text-muted-foreground">No real correlation data available yet. Data will appear as the cross-domain engine detects patterns.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/80 backdrop-blur border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link2 className="w-5 h-5 text-primary" />
          Cross-Domain Correlations
        </CardTitle>
        <CardDescription>
          Chess ↔ Code ↔ Market pattern synchronization
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-primary/5 rounded-lg">
            <p className="text-xs text-muted-foreground">Avg Correlation</p>
            <p className="text-2xl font-bold">{(summary.averageCorrelation * 100).toFixed(0)}%</p>
          </div>
          <div className="p-3 bg-primary/5 rounded-lg">
            <p className="text-xs text-muted-foreground">Active Pairs</p>
            <p className="text-2xl font-bold">{summary.correlations.length}</p>
          </div>
        </div>

        {/* Strongest Correlation */}
        {summary.strongestPair && (
          <div className="p-3 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-lg border border-green-500/20">
            <p className="text-xs text-muted-foreground mb-2">Strongest Correlation</p>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="gap-1">
                {getDomainIcon(summary.strongestPair.domainA.name)}
                {summary.strongestPair.domainA.name}
              </Badge>
              <ArrowRight className="w-3 h-3 text-muted-foreground" />
              <Badge variant="outline" className="gap-1">
                {getDomainIcon(summary.strongestPair.domainB.name)}
                {summary.strongestPair.domainB.name}
              </Badge>
              <span className="ml-auto font-bold text-green-400">
                {(summary.strongestPair.correlation * 100).toFixed(0)}%
              </span>
            </div>
          </div>
        )}

        {/* Correlation List */}
        <ScrollArea className="h-[180px]">
          <div className="space-y-2">
            {summary.correlations.map((corr, index) => (
              <motion.div
                key={corr.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="p-2 bg-muted/30 rounded flex items-center gap-2"
              >
                <div className="flex items-center gap-1 min-w-[100px]">
                  {getDomainIcon(corr.domainA.name)}
                  <span className="text-xs">{corr.domainA.name}</span>
                </div>
                
                <div className="flex-1 flex items-center gap-1">
                  <Progress value={corr.correlation * 100} className="h-1.5 flex-1" />
                </div>
                
                <div className="flex items-center gap-1 min-w-[100px] justify-end">
                  <span className="text-xs">{corr.domainB.name}</span>
                  {getDomainIcon(corr.domainB.name)}
                </div>
                
                <Badge variant="outline" className={`ml-2 text-[10px] ${getSignificanceColor(corr.significance)}`}>
                  {(corr.correlation * 100).toFixed(0)}%
                </Badge>
              </motion.div>
            ))}
          </div>
        </ScrollArea>

        <Separator />

        {/* Recent Events */}
        <div>
          <p className="text-xs text-muted-foreground mb-2">Recent Correlation Events</p>
          <div className="space-y-2">
            {summary.recentEvents.map((event, i) => (
              <div key={i} className="flex items-start gap-2 text-xs">
                <Timer className="w-3 h-3 text-muted-foreground mt-0.5" />
                <div>
                  <span className="text-muted-foreground">
                    {Math.floor((Date.now() - event.timestamp.getTime()) / 60000)}m ago
                  </span>
                  <span className="mx-1">·</span>
                  <span>{event.event}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
