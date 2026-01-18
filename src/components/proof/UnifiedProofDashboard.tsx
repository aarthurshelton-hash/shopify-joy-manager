/**
 * Unified Proof Dashboard
 * 
 * The central command center showing:
 * - Chess prediction breakthroughs
 * - Cultural arbitrage opportunities
 * - Photonic coherence state
 * - Cross-domain correlations
 * 
 * Provides empirical evidence that pattern recognition
 * across domains creates actionable intelligence.
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion } from 'framer-motion';
import { 
  Brain, 
  Crown, 
  Globe, 
  Radio, 
  Link2,
  Sparkles,
  Activity
} from 'lucide-react';
import { ProofDashboard } from '@/components/chess/ProofDashboard';
import { CulturalArbitragePanel } from './CulturalArbitragePanel';
import { PhotonicCoherencePanel } from './PhotonicCoherencePanel';
import { CrossDomainCorrelationsPanel } from './CrossDomainCorrelationsPanel';

export function UnifiedProofDashboard() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
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

      {/* System Status Bar */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="flex items-center justify-center gap-4 p-3 bg-gradient-to-r from-primary/5 via-purple-500/5 to-pink-500/5 rounded-lg border border-primary/20"
      >
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-green-400 animate-pulse" />
          <span className="text-sm text-muted-foreground">System Active</span>
        </div>
        <div className="w-px h-4 bg-border" />
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Crown className="w-3 h-3 text-yellow-500" /> Chess
          </span>
          <span className="flex items-center gap-1">
            <Globe className="w-3 h-3 text-blue-400" /> Cultural
          </span>
          <span className="flex items-center gap-1">
            <Radio className="w-3 h-3 text-purple-400" /> Photonic
          </span>
          <span className="flex items-center gap-1">
            <Link2 className="w-3 h-3 text-green-400" /> Correlated
          </span>
        </div>
      </motion.div>

      {/* Main Dashboard */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-flex">
          <TabsTrigger value="overview" className="gap-2">
            <Brain className="w-4 h-4" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="chess" className="gap-2">
            <Crown className="w-4 h-4" />
            <span className="hidden sm:inline">Chess Proof</span>
          </TabsTrigger>
          <TabsTrigger value="cultural" className="gap-2">
            <Globe className="w-4 h-4" />
            <span className="hidden sm:inline">Cultural</span>
          </TabsTrigger>
          <TabsTrigger value="photonic" className="gap-2">
            <Radio className="w-4 h-4" />
            <span className="hidden sm:inline">Photonic</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <CulturalArbitragePanel />
            <PhotonicCoherencePanel />
          </div>
          <CrossDomainCorrelationsPanel />
        </TabsContent>

        {/* Chess Tab */}
        <TabsContent value="chess">
          <ProofDashboard />
        </TabsContent>

        {/* Cultural Tab */}
        <TabsContent value="cultural">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <CulturalArbitragePanel />
            <Card className="bg-card/80 backdrop-blur border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5 text-primary" />
                  Cultural Theory
                </CardTitle>
              </CardHeader>
              <CardContent className="prose prose-invert prose-sm max-w-none">
                <p>
                  <strong>Sapir-Whorf Hypothesis in Markets:</strong> Languages with weak 
                  future-time reference (Japanese, Mandarin) systematically create different 
                  savings and investment behaviors than strong-FTR languages (English, German).
                </p>
                <p>
                  <strong>Hofstede's Cultural Dimensions:</strong> High uncertainty avoidance 
                  cultures enter market phases more gradually. High collectivism cultures 
                  exhibit stronger herding behavior, making momentum signals more reliable.
                </p>
                <p>
                  <strong>Arbitrage Implication:</strong> When a collective culture (Japan) 
                  and individualistic culture (USA) view the same asset, systematic 
                  mispricing occurs based on cultural cognitive biases.
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Photonic Tab */}
        <TabsContent value="photonic">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PhotonicCoherencePanel />
            <Card className="bg-card/80 backdrop-blur border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Radio className="w-5 h-5 text-primary" />
                  Photonic Architecture
                </CardTitle>
              </CardHeader>
              <CardContent className="prose prose-invert prose-sm max-w-none">
                <p>
                  <strong>Speed of Light Processing:</strong> The En Pensent engine models 
                  computation as optical interference patterns. Each domain operates on a 
                  unique wavelength, enabling parallel processing at light speed.
                </p>
                <p>
                  <strong>Quantum Entanglement:</strong> Correlated domains (Chess ↔ Market, 
                  Consciousness ↔ Music) are modeled as entangled pairs. Changes in one 
                  instantly affect the other through phase correlation.
                </p>
                <p>
                  <strong>The Crow Glitch:</strong> When all domains synchronize (high coherence), 
                  the system detects "glitches" - moments of universal self-reference where 
                  patterns recognize themselves. These are the breakthrough moments.
                </p>
              </CardContent>
            </Card>
          </div>
          <div className="mt-6">
            <CrossDomainCorrelationsPanel />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
