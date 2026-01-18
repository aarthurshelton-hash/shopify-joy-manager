/**
 * Style Profile Panel
 * 
 * Displays player style analysis based on time control performance,
 * mapping to trading style equivalents and market fit scoring.
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion } from 'framer-motion';
import { 
  Timer, 
  Zap, 
  Brain, 
  TrendingUp, 
  AlertTriangle,
  Target,
  Activity,
  Clock,
  Flame,
  Shield,
  LineChart
} from 'lucide-react';
import {
  type StyleProfile,
  type TimeControlElo,
  type TimeControlStyleMapping,
  TIME_CONTROL_MAPPINGS,
  analyzeTimeControlProfile,
  formatStyleProfile,
  calculateMarketFit,
} from '@/lib/pensent-core/domains/chess/timeControlStyleProfiler';

interface StyleProfilePanelProps {
  // Optional external data - if not provided, uses demo data
  playerElos?: TimeControlElo[];
  marketConditions?: {
    volatility: number;
    momentum: number;
    trendStrength: number;
    timeframeMinutes: number;
  };
}

// Demo data for display
const DEMO_PLAYER_ELOS: TimeControlElo[] = [
  { category: 'ultrabullet', elo: 2750, gamesPlayed: 2728, winRate: 0.62, blunderRate: 0.08 },
  { category: 'bullet', elo: 3223, gamesPlayed: 29349, winRate: 0.71, blunderRate: 0.04 },
  { category: 'blitz', elo: 2790, gamesPlayed: 2408, winRate: 0.65, blunderRate: 0.05 },
  { category: 'rapid', elo: 2554, gamesPlayed: 43, winRate: 0.58, blunderRate: 0.06 },
  { category: 'classical', elo: 2400, gamesPlayed: 0, winRate: 0, blunderRate: 0.03 },
];

const DEMO_MARKET_CONDITIONS = {
  volatility: 0.65,
  momentum: 0.3,
  trendStrength: 0.5,
  timeframeMinutes: 15,
};

export function StyleProfilePanel({ 
  playerElos = DEMO_PLAYER_ELOS,
  marketConditions = DEMO_MARKET_CONDITIONS 
}: StyleProfilePanelProps) {
  const [profile, setProfile] = useState<StyleProfile | null>(null);
  const [marketFit, setMarketFit] = useState<ReturnType<typeof calculateMarketFit> | null>(null);

  useEffect(() => {
    const analyzedProfile = analyzeTimeControlProfile(playerElos);
    setProfile(analyzedProfile);
    
    const fit = calculateMarketFit(analyzedProfile, marketConditions);
    setMarketFit(fit);
  }, [playerElos, marketConditions]);

  if (!profile) {
    return (
      <Card className="bg-card/80 backdrop-blur border-primary/20">
        <CardContent className="p-6 text-center text-muted-foreground">
          Loading style analysis...
        </CardContent>
      </Card>
    );
  }

  const formatted = formatStyleProfile(profile);
  const dominantMapping = TIME_CONTROL_MAPPINGS.find(m => m.timeControl === profile.dominantStyle);

  return (
    <Card className="bg-card/80 backdrop-blur border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-primary" />
          Time Control Style Profiler
        </CardTitle>
        <CardDescription>
          Chess time controls reveal trading DNA
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile" className="gap-1">
              <Timer className="w-3 h-3" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="mapping" className="gap-1">
              <LineChart className="w-3 h-3" />
              Trading Map
            </TabsTrigger>
            <TabsTrigger value="fit" className="gap-1">
              <Target className="w-3 h-3" />
              Market Fit
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-4 mt-4">
            {/* ELO by Time Control */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                ELO by Time Control
              </h4>
              <div className="space-y-2">
                {playerElos.filter(e => e.gamesPlayed > 0).map((elo) => (
                  <motion.div
                    key={elo.category}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-3"
                  >
                    <span className="text-xs text-muted-foreground w-20 capitalize">
                      {elo.category}
                    </span>
                    <Progress 
                      value={((elo.elo - 2000) / 1500) * 100} 
                      className="h-2 flex-1"
                    />
                    <span className={`text-sm font-mono font-bold ${
                      elo.category === profile.dominantStyle ? 'text-green-400' :
                      elo.category === profile.weakestStyle ? 'text-red-400' :
                      'text-foreground'
                    }`}>
                      {elo.elo}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      ({elo.gamesPlayed.toLocaleString()})
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Key Insight */}
            <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
              <div className="flex items-start gap-2">
                <Zap className="w-4 h-4 text-primary mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Key Insight</p>
                  <p className="text-xs text-muted-foreground">
                    ELO variance of <span className="text-primary font-bold">{profile.eloVariance.toFixed(0)} pts</span> indicates 
                    a <span className="text-primary">{profile.eloVariance > 200 ? 'specialized' : profile.eloVariance > 100 ? 'somewhat specialized' : 'balanced'}</span> cognitive style.
                    Max gap: {profile.maxEloDelta.toFixed(0)} pts between {profile.dominantStyle} and {profile.weakestStyle}.
                  </p>
                </div>
              </div>
            </div>

            {/* Cognitive Fingerprint */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Cognitive Fingerprint</h4>
              <div className="grid grid-cols-2 gap-3">
                <MetricCard
                  icon={<Flame className="w-4 h-4 text-orange-400" />}
                  label="Intuition"
                  value={profile.intuitionScore}
                  color="orange"
                />
                <MetricCard
                  icon={<Brain className="w-4 h-4 text-blue-400" />}
                  label="Calculation"
                  value={profile.calculationScore}
                  color="blue"
                />
                <MetricCard
                  icon={<Shield className="w-4 h-4 text-green-400" />}
                  label="Pressure Resistance"
                  value={profile.pressureResistance}
                  color="green"
                />
                <MetricCard
                  icon={<Activity className="w-4 h-4 text-purple-400" />}
                  label="Consistency"
                  value={profile.consistencyScore}
                  color="purple"
                />
              </div>
            </div>
          </TabsContent>

          {/* Trading Mapping Tab */}
          <TabsContent value="mapping" className="space-y-4 mt-4">
            {dominantMapping && (
              <div className="p-4 bg-gradient-to-br from-primary/10 to-purple-500/10 rounded-lg border border-primary/20">
                <div className="flex items-center justify-between mb-3">
                  <Badge variant="default" className="text-sm">
                    {dominantMapping.tradingStyle.replace('_', ' ').toUpperCase()}
                  </Badge>
                  <Badge variant="outline" className="capitalize">
                    {profile.riskTolerance} Risk
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  {dominantMapping.cognitiveProfile}
                </p>
                <p className="text-xs text-primary">
                  Optimal: {profile.optimalMarketConditions.timeframe}
                </p>
              </div>
            )}

            {/* Time Control → Trading Style Grid */}
            <ScrollArea className="h-48">
              <div className="space-y-2">
                {TIME_CONTROL_MAPPINGS.map((mapping) => (
                  <div 
                    key={mapping.timeControl}
                    className={`p-2 rounded border ${
                      mapping.timeControl === profile.dominantStyle 
                        ? 'border-primary bg-primary/10' 
                        : 'border-border/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium capitalize">
                        {mapping.timeControl}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        → {mapping.tradingStyle.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {mapping.decisionWindow} • {mapping.marketEquivalent}
                    </p>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Strengths & Weaknesses */}
            {dominantMapping && (
              <div className="grid grid-cols-2 gap-3">
                <div className="p-2 bg-green-500/10 rounded border border-green-500/20">
                  <p className="text-xs font-medium text-green-400 mb-1">Strengths</p>
                  <ul className="text-xs text-muted-foreground space-y-0.5">
                    {dominantMapping.strengthIndicators.slice(0, 2).map((s, i) => (
                      <li key={i}>• {s}</li>
                    ))}
                  </ul>
                </div>
                <div className="p-2 bg-red-500/10 rounded border border-red-500/20">
                  <p className="text-xs font-medium text-red-400 mb-1">Weaknesses</p>
                  <ul className="text-xs text-muted-foreground space-y-0.5">
                    {dominantMapping.weaknessIndicators.slice(0, 2).map((w, i) => (
                      <li key={i}>• {w}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Market Fit Tab */}
          <TabsContent value="fit" className="space-y-4 mt-4">
            {marketFit && (
              <>
                {/* Fit Score */}
                <div className="text-center py-4">
                  <div className={`text-5xl font-bold ${
                    marketFit.fitScore > 0.7 ? 'text-green-400' :
                    marketFit.fitScore > 0.5 ? 'text-yellow-400' :
                    marketFit.fitScore > 0.3 ? 'text-orange-400' :
                    'text-red-400'
                  }`}>
                    {(marketFit.fitScore * 100).toFixed(0)}%
                  </div>
                  <p className="text-sm text-muted-foreground">Market Fit Score</p>
                  <p className="text-xs text-primary mt-1">{marketFit.recommendation}</p>
                </div>

                {/* Current Market Conditions */}
                <div className="p-3 bg-muted/30 rounded-lg">
                  <h4 className="text-xs font-medium mb-2 text-muted-foreground">Current Market</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>Volatility: <span className="text-primary">{(marketConditions.volatility * 100).toFixed(0)}%</span></div>
                    <div>Momentum: <span className="text-primary">{marketConditions.momentum > 0 ? '+' : ''}{(marketConditions.momentum * 100).toFixed(0)}%</span></div>
                    <div>Trend: <span className="text-primary">{(marketConditions.trendStrength * 100).toFixed(0)}%</span></div>
                    <div>Timeframe: <span className="text-primary">{marketConditions.timeframeMinutes}m</span></div>
                  </div>
                </div>

                {/* Warnings */}
                {marketFit.warnings.length > 0 && (
                  <div className="space-y-2">
                    {marketFit.warnings.map((warning, i) => (
                      <div key={i} className="flex items-start gap-2 p-2 bg-yellow-500/10 rounded border border-yellow-500/20">
                        <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5 shrink-0" />
                        <span className="text-xs text-yellow-200">{warning}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Prediction Probabilities */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-2 bg-muted/30 rounded text-center">
                    <p className="text-2xl font-bold text-primary">
                      {(profile.panicSellProbability * 100).toFixed(0)}%
                    </p>
                    <p className="text-xs text-muted-foreground">Panic Sell Risk</p>
                  </div>
                  <div className="p-2 bg-muted/30 rounded text-center">
                    <p className="text-2xl font-bold text-primary">
                      {(profile.reversalProbability * 100).toFixed(0)}%
                    </p>
                    <p className="text-xs text-muted-foreground">Position Reversal</p>
                  </div>
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function MetricCard({ 
  icon, 
  label, 
  value, 
  color 
}: { 
  icon: React.ReactNode; 
  label: string; 
  value: number; 
  color: string;
}) {
  return (
    <div className="p-2 bg-muted/30 rounded-lg">
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <Progress 
          value={value * 100} 
          className="h-1.5 flex-1"
        />
        <span className="text-sm font-bold">{(value * 100).toFixed(0)}%</span>
      </div>
    </div>
  );
}

export default StyleProfilePanel;
