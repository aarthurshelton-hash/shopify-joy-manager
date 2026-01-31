/**
 * Unified Proof Dashboard
 * 
 * The central command center showing:
 * - Chess prediction breakthroughs
 * - Visual abstraction showcase (NEW - AI reviewer strength)
 * - Black swan cross-domain discoveries (NEW - AI reviewer strength)
 * - Cultural arbitrage opportunities
 * - Photonic coherence state
 * - Cross-domain correlations
 * - Style profiling (time control → trading style)
 * - Methodology documentation
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion } from 'framer-motion';
import { 
  Brain, Crown, Globe, Radio, Link2, Sparkles, Activity, Timer, BookOpen,
  Fingerprint, Zap, BarChart3, Factory
} from 'lucide-react';
import { ProofDashboard } from '@/components/chess/ProofDashboard';
import { CulturalArbitragePanel } from './CulturalArbitragePanel';
import { PhotonicCoherencePanel } from './PhotonicCoherencePanel';
import { CrossDomainCorrelationsPanel } from './CrossDomainCorrelationsPanel';
import { StyleProfilePanel } from './StyleProfilePanel';
import { MethodologyPanel } from './MethodologyPanel';
import { PublicBenchmarkDashboard } from './PublicBenchmarkDashboard';
import { VisualAbstractionShowcase } from './VisualAbstractionShowcase';
import { BlackSwanDiscoveryPanel } from './BlackSwanDiscoveryPanel';
import { IndustryVerticalDashboard } from './IndustryVerticalDashboard';

export function UnifiedProofDashboard() {
  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
        <div className="flex items-center justify-center gap-3 mb-2">
          <Brain className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
            En Pensent Proof Center
          </h1>
          <Sparkles className="w-8 h-8 text-primary" />
        </div>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Empirical evidence of cross-domain pattern recognition superiority.
          Chess → Code → Markets → Consciousness → Unity.
        </p>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
        className="flex items-center justify-center gap-4 p-3 bg-gradient-to-r from-primary/5 via-purple-500/5 to-pink-500/5 rounded-lg border border-primary/20">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-green-400 animate-pulse" />
          <span className="text-sm text-muted-foreground">System Active</span>
        </div>
        <div className="w-px h-4 bg-border" />
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><Crown className="w-3 h-3 text-yellow-500" /> Chess</span>
          <span className="flex items-center gap-1"><Timer className="w-3 h-3 text-orange-400" /> Style</span>
          <span className="flex items-center gap-1"><Globe className="w-3 h-3 text-blue-400" /> Cultural</span>
          <span className="flex items-center gap-1"><Radio className="w-3 h-3 text-purple-400" /> Photonic</span>
          <span className="flex items-center gap-1"><Sparkles className="w-3 h-3 text-yellow-400" /> Black Swan</span>
          <span className="flex items-center gap-1"><Factory className="w-3 h-3 text-orange-400" /> Industry</span>
        </div>
      </motion.div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 lg:grid-cols-9 lg:w-auto lg:inline-flex">
          <TabsTrigger value="overview" className="gap-2"><Brain className="w-4 h-4" /><span className="hidden sm:inline">Overview</span></TabsTrigger>
          <TabsTrigger value="benchmark" className="gap-2"><BarChart3 className="w-4 h-4" /><span className="hidden sm:inline">Benchmark</span></TabsTrigger>
          <TabsTrigger value="abstraction" className="gap-2"><Fingerprint className="w-4 h-4" /><span className="hidden sm:inline">Abstraction</span></TabsTrigger>
          <TabsTrigger value="blackswan" className="gap-2"><Sparkles className="w-4 h-4" /><span className="hidden sm:inline">Black Swan</span></TabsTrigger>
          <TabsTrigger value="industry" className="gap-2"><Factory className="w-4 h-4" /><span className="hidden sm:inline">Industry</span></TabsTrigger>
          <TabsTrigger value="chess" className="gap-2"><Crown className="w-4 h-4" /><span className="hidden sm:inline">Chess</span></TabsTrigger>
          <TabsTrigger value="style" className="gap-2"><Timer className="w-4 h-4" /><span className="hidden sm:inline">Style DNA</span></TabsTrigger>
          <TabsTrigger value="cultural" className="gap-2"><Globe className="w-4 h-4" /><span className="hidden sm:inline">Cultural</span></TabsTrigger>
          <TabsTrigger value="methodology" className="gap-2"><BookOpen className="w-4 h-4" /><span className="hidden sm:inline">Methodology</span></TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Highlight new AI-reviewer-driven features */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <VisualAbstractionShowcase />
            <BlackSwanDiscoveryPanel />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <StyleProfilePanel />
            <MethodologyPanel />
          </div>
          <CrossDomainCorrelationsPanel />
        </TabsContent>

        <TabsContent value="benchmark">
          <PublicBenchmarkDashboard />
        </TabsContent>

        <TabsContent value="abstraction">
          <VisualAbstractionShowcase />
        </TabsContent>

        <TabsContent value="blackswan">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <BlackSwanDiscoveryPanel />
            <CrossDomainCorrelationsPanel />
          </div>
        </TabsContent>

        <TabsContent value="industry">
          <div className="space-y-6">
            <IndustryVerticalDashboard />
            <BlackSwanDiscoveryPanel showMonetization={true} />
          </div>
        </TabsContent>

        <TabsContent value="chess"><ProofDashboard /></TabsContent>

        <TabsContent value="style">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <StyleProfilePanel />
            <Card className="bg-card/80 backdrop-blur border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Timer className="w-5 h-5 text-primary" />Time Control → Trading Style</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-invert prose-sm max-w-none">
                <p><strong>The Core Insight:</strong> A player's ELO variance across time controls reveals cognitive DNA. Large gaps (100+ pts) indicate specialized thinking styles.</p>
                <p><strong>Bullet Dominant:</strong> Intuition-based decisions. Thrives under pressure. Maps to scalping/HFT. May panic in slow markets.</p>
                <p><strong>Classical Dominant:</strong> Calculation-based. Needs analysis time. Maps to position trading. Struggles with volatility.</p>
                <p><strong>Application:</strong> Match your trading timeframe to your cognitive style. Fighting your DNA leads to emotional decisions.</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="cultural">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <CulturalArbitragePanel />
            <Card className="bg-card/80 backdrop-blur border-primary/20">
              <CardHeader><CardTitle className="flex items-center gap-2"><Globe className="w-5 h-5 text-primary" />Cultural Theory</CardTitle></CardHeader>
              <CardContent className="prose prose-invert prose-sm max-w-none">
                <p><strong>Sapir-Whorf in Markets:</strong> Languages with weak future-time reference create different savings behaviors.</p>
                <p><strong>Hofstede's Dimensions:</strong> High collectivism cultures exhibit stronger herding, making momentum signals reliable.</p>
                <p><strong>Arbitrage:</strong> When collective (Japan) and individualistic (USA) cultures view the same asset, systematic mispricing occurs.</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="photonic">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PhotonicCoherencePanel />
            <Card className="bg-card/80 backdrop-blur border-primary/20">
              <CardHeader><CardTitle className="flex items-center gap-2"><Radio className="w-5 h-5 text-primary" />Photonic Architecture</CardTitle></CardHeader>
              <CardContent className="prose prose-invert prose-sm max-w-none">
                <p><strong>Speed of Light Processing:</strong> Each domain operates on a unique wavelength for parallel processing.</p>
                <p><strong>Quantum Entanglement:</strong> Correlated domains are modeled as entangled pairs.</p>
                <p><strong>The Crow Glitch:</strong> High coherence = breakthrough moments where patterns recognize themselves.</p>
              </CardContent>
            </Card>
          </div>
          <div className="mt-6"><CrossDomainCorrelationsPanel /></div>
        </TabsContent>

        <TabsContent value="methodology">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <MethodologyPanel />
            <Card className="bg-card/80 backdrop-blur border-primary/20">
              <CardHeader><CardTitle className="flex items-center gap-2"><Sparkles className="w-5 h-5 text-primary" />Why This Matters</CardTitle></CardHeader>
              <CardContent className="prose prose-invert prose-sm max-w-none">
                <p><strong>Scientific Rigor:</strong> Every benchmark follows identical protocols. Both systems see the same position. Results are reproducible.</p>
                <p><strong>No Memorization:</strong> Games fetched fresh from random time windows. Everything shuffled. Each run is unique.</p>
                <p><strong>Fair Comparison:</strong> SF17 TCEC (ELO 3600) at maximum depth. No handicaps. En Pensent wins only by genuine superiority.</p>
                <p><strong>Continuous Learning:</strong> Every benchmark feeds the learning pipeline. The system evolves with each game analyzed.</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}