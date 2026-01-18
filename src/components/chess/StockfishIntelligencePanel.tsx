/**
 * Stockfish Intelligence Panel
 * 
 * Displays comprehensive intelligence about Stockfish:
 * - Version history and ELO progression
 * - Creators and development philosophy
 * - WASM variants and depth capabilities
 * - Identified weaknesses for En Pensent to exploit
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Brain, 
  History, 
  Users, 
  Cpu, 
  AlertTriangle, 
  TrendingUp,
  Layers,
  ChevronRight,
  Zap
} from 'lucide-react';
import {
  STOCKFISH_CREATORS,
  STOCKFISH_VERSIONS,
  WASM_VARIANTS,
  STOCKFISH_THINKING_PATTERNS,
  BENCHMARK_DEPTH_CONFIGS,
  analyzeStockfishEvolution,
  identifyStockfishWeaknesses,
  estimateEloFromDepth,
  type StockfishVersion,
  type DepthConfig
} from '@/lib/chess/stockfishIntelligence';

interface StockfishIntelligencePanelProps {
  currentDepth?: number;
  onDepthSelect?: (depth: number) => void;
}

export function StockfishIntelligencePanel({ 
  currentDepth = 60,
  onDepthSelect 
}: StockfishIntelligencePanelProps) {
  const [selectedVersion, setSelectedVersion] = useState<StockfishVersion | null>(null);
  const evolution = analyzeStockfishEvolution();
  const weaknesses = identifyStockfishWeaknesses();

  return (
    <div className="space-y-6">
      <Tabs defaultValue="evolution" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="evolution" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Evolution
          </TabsTrigger>
          <TabsTrigger value="creators" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Creators
          </TabsTrigger>
          <TabsTrigger value="depths" className="flex items-center gap-2">
            <Layers className="h-4 w-4" />
            Depth Configs
          </TabsTrigger>
          <TabsTrigger value="weaknesses" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Weaknesses
          </TabsTrigger>
        </TabsList>

        {/* Evolution Tab */}
        <TabsContent value="evolution" className="mt-4 space-y-4">
          <Card className="border-blue-500/30">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="h-5 w-5 text-blue-500" />
                Stockfish Evolution (2008-2025)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-3 bg-blue-500/10 rounded-lg">
                  <p className="text-2xl font-bold text-blue-500">+{evolution.totalEloGain}</p>
                  <p className="text-xs text-muted-foreground">Total ELO Gain</p>
                </div>
                <div className="p-3 bg-green-500/10 rounded-lg">
                  <p className="text-2xl font-bold text-green-500">+{evolution.averageYearlyGain}</p>
                  <p className="text-xs text-muted-foreground">ELO/Year Avg</p>
                </div>
                <div className="p-3 bg-purple-500/10 rounded-lg">
                  <p className="text-2xl font-bold text-purple-500">+{evolution.nnueImpact}</p>
                  <p className="text-xs text-muted-foreground">NNUE Impact (2020)</p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Key Breakthroughs:</p>
                <ul className="text-xs space-y-1 text-muted-foreground">
                  {evolution.architectureBreakthroughs.map((b, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <ChevronRight className="h-3 w-3 mt-0.5 text-blue-500" />
                      {b}
                    </li>
                  ))}
                </ul>
              </div>

              <ScrollArea className="h-48">
                <div className="space-y-2">
                  <p className="text-sm font-medium">Version History:</p>
                  {STOCKFISH_VERSIONS.slice().reverse().map((v, i) => (
                    <div 
                      key={i} 
                      className={`p-2 rounded-lg cursor-pointer transition-colors ${
                        selectedVersion?.version === v.version 
                          ? 'bg-primary/20 border border-primary/50' 
                          : 'bg-muted/30 hover:bg-muted/50'
                      }`}
                      onClick={() => setSelectedVersion(v)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant={v.architecture === 'sfnnv6' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            v{v.version}
                          </Badge>
                          <span className="text-sm">{v.releaseDate}</span>
                        </div>
                        <span className="text-sm font-bold text-primary">ELO ~{v.eloEstimate}</span>
                      </div>
                      {selectedVersion?.version === v.version && (
                        <div className="mt-2 pt-2 border-t border-muted">
                          <p className="text-xs text-muted-foreground mb-1">
                            Architecture: {v.architecture.toUpperCase()}
                          </p>
                          <ul className="text-xs text-muted-foreground">
                            {v.keyFeatures.map((f, j) => (
                              <li key={j}>• {f}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Creators Tab */}
        <TabsContent value="creators" className="mt-4">
          <Card className="border-purple-500/30">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="h-5 w-5 text-purple-500" />
                Stockfish Creators & Contributors
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {STOCKFISH_CREATORS.map((creator, i) => (
                  <div key={i} className="p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium">{creator.name}</span>
                      <Badge variant="outline">{creator.nationality}</Badge>
                    </div>
                    <p className="text-sm text-primary">{creator.role}</p>
                    <p className="text-xs text-muted-foreground mt-1">{creator.contribution}</p>
                    <p className="text-xs text-muted-foreground/70">Active: {creator.activeYears}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Depth Configs Tab */}
        <TabsContent value="depths" className="mt-4">
          <Card className="border-green-500/30">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Layers className="h-5 w-5 text-green-500" />
                Benchmark Depth Configurations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Select a depth configuration to test. Higher depths provide more accurate analysis but take longer.
              </p>
              
              <div className="space-y-2">
                {BENCHMARK_DEPTH_CONFIGS.map((config, i) => (
                  <DepthConfigCard 
                    key={i} 
                    config={config} 
                    isActive={currentDepth === config.depth}
                    onClick={() => onDepthSelect?.(config.depth)}
                  />
                ))}
              </div>

              {/* WASM Variants Info */}
              <div className="p-3 bg-muted/30 rounded-lg space-y-2">
                <p className="text-sm font-medium">WASM Variants Available:</p>
                {WASM_VARIANTS.map((v, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <span className="font-mono">{v.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">
                        {v.threads} thread{v.threads > 1 ? 's' : ''}, 
                        depth ~{v.maxPracticalDepth}
                      </span>
                      <Badge variant={v.variant === 'lite-single' ? 'default' : 'secondary'} className="text-xs">
                        {v.eloVsFull === 0 ? 'Full' : `${v.eloVsFull} ELO`}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Weaknesses Tab */}
        <TabsContent value="weaknesses" className="mt-4">
          <Card className="border-orange-500/30">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                Stockfish Weaknesses (En Pensent Advantages)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Areas where pattern recognition can outperform brute-force calculation:
              </p>
              
              <ul className="space-y-2">
                {weaknesses.map((w, i) => (
                  <li key={i} className="flex items-start gap-2 p-2 bg-orange-500/10 rounded-lg">
                    <Zap className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{w}</span>
                  </li>
                ))}
              </ul>

              {/* Thinking Patterns */}
              <div className="space-y-2 mt-4">
                <p className="text-sm font-medium">How Stockfish Thinks:</p>
                {STOCKFISH_THINKING_PATTERNS.map((p, i) => (
                  <div key={i} className="p-3 bg-muted/30 rounded-lg space-y-1">
                    <p className="font-medium text-sm">{p.pattern}</p>
                    <p className="text-xs text-muted-foreground">{p.description}</p>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <div className="text-xs">
                        <span className="text-green-500 font-medium">Strong: </span>
                        <span className="text-muted-foreground">{p.whenStrong}</span>
                      </div>
                      <div className="text-xs">
                        <span className="text-orange-500 font-medium">Weak: </span>
                        <span className="text-muted-foreground">{p.whenWeak}</span>
                      </div>
                    </div>
                    <p className="text-xs text-primary mt-1">
                      ✓ En Pensent: {p.enPensentAdvantage}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function DepthConfigCard({ 
  config, 
  isActive,
  onClick 
}: { 
  config: DepthConfig; 
  isActive: boolean;
  onClick?: () => void;
}) {
  const eloEstimate = estimateEloFromDepth(config.depth);
  
  return (
    <div 
      className={`p-3 rounded-lg cursor-pointer transition-all ${
        isActive 
          ? 'bg-green-500/20 border-2 border-green-500/50 shadow-lg' 
          : 'bg-muted/30 hover:bg-muted/50 border border-transparent'
      }`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
            isActive ? 'bg-green-500 text-white' : 'bg-muted'
          }`}>
            <span className="font-bold">{config.depth}</span>
          </div>
          <div>
            <p className="font-medium">{config.name}</p>
            <p className="text-xs text-muted-foreground">{config.description}</p>
          </div>
        </div>
        <div className="text-right">
          <p className={`font-bold ${isActive ? 'text-green-500' : 'text-primary'}`}>
            ~{config.estimatedElo} ELO
          </p>
          <p className="text-xs text-muted-foreground">
            ~{(config.timePerPositionMs / 1000).toFixed(1)}s/pos
          </p>
        </div>
      </div>
      <Progress 
        value={(config.depth / 60) * 100} 
        className={`h-1.5 mt-2 ${isActive ? '[&>div]:bg-green-500' : ''}`}
      />
    </div>
  );
}
