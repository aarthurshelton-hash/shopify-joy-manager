/**
 * Cultural Arbitrage Panel
 * 
 * Visualizes cross-cultural trading opportunities from the 
 * Cultural Arbitrage Engine.
 */

import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { motion } from 'framer-motion';
import { Globe, Clock, Languages, Users, Zap, TrendingUp } from 'lucide-react';
import {
  culturalArbitrageEngine,
  CulturalArbitrageOpportunity,
  CULTURAL_PROFILES
} from '@/lib/pensent-core/domains/finance/culturalArbitrageEngine';

interface ArbitrageSummary {
  opportunities: CulturalArbitrageOpportunity[];
  activeCultures: string[];
  bestOpportunity: CulturalArbitrageOpportunity | null;
  averageConfidence: number;
}

export function CulturalArbitragePanel() {
  const [summary, setSummary] = useState<ArbitrageSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshData = useCallback(() => {
    // Generate mock market data for analysis
    const mockMarketData: Record<string, { price: number; volume: number; sentiment: number }> = {};
    Object.keys(CULTURAL_PROFILES).forEach(culture => {
      mockMarketData[culture] = {
        price: 100 + Math.random() * 10,
        volume: 0.8 + Math.random() * 0.4,
        sentiment: (Math.random() - 0.5) * 2
      };
    });

    const opportunities = culturalArbitrageEngine.analyzeArbitrageOpportunities(mockMarketData);
    
    // Get currently active trading cultures
    const now = new Date();
    const utcHour = now.getUTCHours();
    const activeCultures = Object.entries(CULTURAL_PROFILES).filter(([, profile]) => {
      const offsets: Record<string, number> = {
        'JST': 9, 'CST': 8, 'EST': -5, 'GMT': 0, 'CET': 1,
        'BRT': -3, 'IST': 5.5, 'GST': 4
      };
      const offset = offsets[profile.timezone] || 0;
      const localHour = (utcHour + offset + 24) % 24;
      return localHour >= profile.tradingHours.open && localHour < profile.tradingHours.close;
    }).map(([name]) => name);

    const avgConfidence = opportunities.length > 0 
      ? opportunities.reduce((s, o) => s + o.confidence, 0) / opportunities.length
      : 0;

    setSummary({
      opportunities: opportunities.slice(0, 10),
      activeCultures,
      bestOpportunity: opportunities[0] || null,
      averageConfidence: avgConfidence
    });
    setLoading(false);
  }, []);

  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, [refreshData]);

  const getTypeIcon = (type: CulturalArbitrageOpportunity['type']) => {
    switch (type) {
      case 'TIME_ZONE_LAG': return <Clock className="w-4 h-4" />;
      case 'RISK_PERCEPTION_GAP': return <TrendingUp className="w-4 h-4" />;
      case 'LINGUISTIC_BIAS': return <Languages className="w-4 h-4" />;
      case 'COLLECTIVISM_DIVERGENCE': return <Users className="w-4 h-4" />;
      case 'DECISION_SPEED_MISMATCH': return <Zap className="w-4 h-4" />;
      default: return <Globe className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: CulturalArbitrageOpportunity['type']) => {
    switch (type) {
      case 'TIME_ZONE_LAG': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'RISK_PERCEPTION_GAP': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'LINGUISTIC_BIAS': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'COLLECTIVISM_DIVERGENCE': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'DECISION_SPEED_MISMATCH': return 'bg-green-500/20 text-green-400 border-green-500/30';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  if (loading || !summary) {
    return (
      <Card className="bg-card/50 backdrop-blur border-primary/20">
        <CardContent className="p-8 text-center">
          <Globe className="w-8 h-8 mx-auto animate-pulse text-primary" />
          <p className="mt-4 text-muted-foreground">Analyzing cultural patterns...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/80 backdrop-blur border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="w-5 h-5 text-primary" />
          Cultural Arbitrage
        </CardTitle>
        <CardDescription>
          Cross-cultural trading opportunities via Sapir-Whorf economics
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Active Markets */}
        <div className="flex flex-wrap gap-2">
          {Object.keys(CULTURAL_PROFILES).map(culture => (
            <Badge 
              key={culture}
              variant="outline"
              className={summary.activeCultures.includes(culture) 
                ? 'bg-green-500/20 text-green-400 border-green-500/30'
                : 'bg-muted/50 text-muted-foreground'
              }
            >
              {culture}
              {summary.activeCultures.includes(culture) && (
                <span className="ml-1 w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              )}
            </Badge>
          ))}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-primary/5 rounded-lg">
            <p className="text-xs text-muted-foreground">Active Opportunities</p>
            <p className="text-2xl font-bold">{summary.opportunities.length}</p>
          </div>
          <div className="p-3 bg-primary/5 rounded-lg">
            <p className="text-xs text-muted-foreground">Avg Confidence</p>
            <p className="text-2xl font-bold">{(summary.averageConfidence * 100).toFixed(0)}%</p>
          </div>
        </div>

        {/* Opportunities */}
        <ScrollArea className="h-[250px]">
          <div className="space-y-3">
            {summary.opportunities.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground text-sm">
                No arbitrage opportunities detected at this time.
              </div>
            ) : (
              summary.opportunities.map((opp, index) => (
                <motion.div
                  key={opp.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-3 bg-muted/30 rounded-lg space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className={getTypeColor(opp.type)}>
                      {getTypeIcon(opp.type)}
                      <span className="ml-1.5">{opp.type.replace(/_/g, ' ')}</span>
                    </Badge>
                    <span className="text-sm font-mono font-bold">
                      +{(opp.expectedSpread * 100).toFixed(2)}%
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-medium">{opp.cultures[0]}</span>
                    <span className="text-muted-foreground">↔</span>
                    <span className="font-medium">{opp.cultures[1]}</span>
                  </div>

                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {opp.reasoning}
                  </p>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Confidence</span>
                    <div className="flex items-center gap-2">
                      <Progress value={opp.confidence * 100} className="w-20 h-1.5" />
                      <span>{(opp.confidence * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
