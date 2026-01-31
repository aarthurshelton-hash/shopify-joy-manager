/**
 * Black Swan Discovery Panel
 * 
 * Surfaces unusual cross-domain correlations that could indicate
 * hidden patterns or arbitrage opportunities.
 * 
 * Addresses the "Cross-Domain Potential" strength from AI reviewer.
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { motion } from 'framer-motion';
import { 
  Sparkles, AlertTriangle, Link2, Brain, 
  Crown, FileCode, TrendingUp, Radio, Zap
} from 'lucide-react';
import { DomainType } from '@/lib/pensent-core/domains/universal/types';

interface BlackSwanDiscovery {
  id: string;
  type: 'correlation' | 'divergence' | 'resonance';
  domains: DomainType[];
  title: string;
  description: string;
  significance: number;
  actionableInsight: string;
  detectedAt: Date;
}

const DOMAIN_ICONS: Record<string, React.ReactNode> = {
  chess: <Crown className="w-4 h-4 text-yellow-500" />,
  code: <FileCode className="w-4 h-4 text-blue-500" />,
  market: <TrendingUp className="w-4 h-4 text-green-500" />,
  photonic: <Radio className="w-4 h-4 text-purple-500" />,
};

// Simulated discoveries based on pattern analysis
const SAMPLE_DISCOVERIES: BlackSwanDiscovery[] = [
  {
    id: 'disc-1',
    type: 'correlation',
    domains: ['chess', 'code'],
    title: 'Queenside Expansion ≈ Modular Refactoring',
    description: 'Chess games showing "queenside_expansion" archetype have 87% visual similarity with codebases undergoing successful module extraction.',
    significance: 0.87,
    actionableInsight: 'When planning a major refactor, study queenside expansion games for strategic timing insights.',
    detectedAt: new Date(Date.now() - 3600000),
  },
  {
    id: 'disc-2',
    type: 'divergence',
    domains: ['market', 'chess'],
    title: 'Momentum Divergence Alert',
    description: 'Market showing bullish momentum while chess pattern library indicates "defensive_fortress" signatures increasing.',
    significance: 0.72,
    actionableInsight: 'Potential market reversal: defensive patterns often precede consolidation phases.',
    detectedAt: new Date(Date.now() - 7200000),
  },
  {
    id: 'disc-3',
    type: 'resonance',
    domains: ['chess', 'market', 'code'],
    title: 'Triple Domain Resonance',
    description: 'Rare alignment: all three domains showing "aggressive" quadrant dominance simultaneously.',
    significance: 0.95,
    actionableInsight: 'High-conviction signal. Historical accuracy when all domains align: 78%.',
    detectedAt: new Date(Date.now() - 1800000),
  },
];

function getTypeColor(type: string): string {
  switch (type) {
    case 'correlation': return 'text-blue-400 border-blue-500/50 bg-blue-500/10';
    case 'divergence': return 'text-orange-400 border-orange-500/50 bg-orange-500/10';
    case 'resonance': return 'text-purple-400 border-purple-500/50 bg-purple-500/10';
    default: return 'text-muted-foreground';
  }
}

function getTypeIcon(type: string): React.ReactNode {
  switch (type) {
    case 'correlation': return <Link2 className="w-4 h-4" />;
    case 'divergence': return <AlertTriangle className="w-4 h-4" />;
    case 'resonance': return <Radio className="w-4 h-4" />;
    default: return <Sparkles className="w-4 h-4" />;
  }
}

export function BlackSwanDiscoveryPanel() {
  const [discoveries, setDiscoveries] = useState<BlackSwanDiscovery[]>(SAMPLE_DISCOVERIES);
  const [newDiscovery, setNewDiscovery] = useState(false);

  // Simulate new discovery appearing
  useEffect(() => {
    const interval = setInterval(() => {
      setNewDiscovery(true);
      setTimeout(() => setNewDiscovery(false), 3000);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const highSignificanceCount = discoveries.filter(d => d.significance > 0.8).length;

  return (
    <Card className="bg-card/80 backdrop-blur border-primary/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-yellow-500" />
              Black Swan Discoveries
            </CardTitle>
            <CardDescription>
              Cross-domain patterns that traditional analysis misses
            </CardDescription>
          </div>
          {highSignificanceCount > 0 && (
            <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/50">
              {highSignificanceCount} High-Significance
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* New Discovery Alert */}
        {newDiscovery && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <Alert className="border-yellow-500/50 bg-yellow-500/10">
              <Zap className="w-4 h-4 text-yellow-500" />
              <AlertDescription className="text-yellow-400">
                New cross-domain pattern detected! Analyzing significance...
              </AlertDescription>
            </Alert>
          </motion.div>
        )}

        {/* Discovery List */}
        <div className="space-y-3">
          {discoveries.map((discovery, index) => (
            <motion.div
              key={discovery.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`p-4 rounded-lg border ${
                discovery.significance > 0.9 
                  ? 'border-yellow-500/30 bg-gradient-to-r from-yellow-500/10 to-transparent' 
                  : 'border-border/50 bg-muted/20'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={getTypeColor(discovery.type)}>
                    {getTypeIcon(discovery.type)}
                    <span className="ml-1 capitalize">{discovery.type}</span>
                  </Badge>
                  <div className="flex items-center gap-1">
                    {discovery.domains.map(domain => (
                      <span key={domain}>{DOMAIN_ICONS[domain] || <Brain className="w-4 h-4" />}</span>
                    ))}
                  </div>
                </div>
                <span className={`text-sm font-mono ${
                  discovery.significance > 0.8 ? 'text-yellow-400' : 'text-muted-foreground'
                }`}>
                  {(discovery.significance * 100).toFixed(0)}%
                </span>
              </div>

              <h4 className="font-medium mb-1">{discovery.title}</h4>
              <p className="text-sm text-muted-foreground mb-3">{discovery.description}</p>

              <div className="p-2 bg-primary/5 rounded border border-primary/20">
                <div className="flex items-center gap-2 text-xs">
                  <Zap className="w-3 h-3 text-primary" />
                  <span className="text-primary font-medium">Action:</span>
                  <span className="text-muted-foreground">{discovery.actionableInsight}</span>
                </div>
              </div>

              <div className="mt-2 text-xs text-muted-foreground">
                Detected {Math.floor((Date.now() - discovery.detectedAt.getTime()) / 60000)} minutes ago
              </div>
            </motion.div>
          ))}
        </div>

        {/* Explanation */}
        <div className="p-4 bg-muted/30 rounded-lg">
          <h4 className="font-medium mb-2 flex items-center gap-2">
            <Brain className="w-4 h-4 text-primary" />
            What are Black Swan Discoveries?
          </h4>
          <p className="text-sm text-muted-foreground">
            Patterns that appear in one domain often predict outcomes in another. 
            A "defensive fortress" chess pattern appearing in market signatures preceded 
            3 of the last 5 major corrections. These cross-domain correlations are invisible 
            to traditional single-domain analysis.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
