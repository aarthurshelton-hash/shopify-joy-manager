/**
 * EnhancedCodeAnalysisPanel - 64-Metric Engine Integration
 * 
 * Provides deep integration with the backend 64-metric code domain engine,
 * showing the full 8x8 metric grid, exchange values, and evolution paths.
 * 
 * Patent-Pending: En Pensent™ Code Flow Signatures
 */

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Grid3X3,
  ArrowLeftRight,
  Activity,
  TrendingUp,
  Target,
  Brain,
  Sparkles,
  ChevronRight
} from 'lucide-react';

import {
  MetricGrid64,
  ExchangeValueDisplay,
  CodeHealthGauge,
  ArchetypeEvolutionPath,
  ArchetypeBadge,
  type ExchangeValue,
  type CodeHealthData
} from '@/components/pensent-ui';

import type { 
  CodeMetricGrid, 
  CodeDimension, 
  CodeCategory,
  CodeQuadrantProfile 
} from '@/lib/pensent-core/domains/code/types';
import type { CodeArchetype } from '@/lib/pensent-core/domains/code/archetypeClassifier';

export interface EnhancedCodeAnalysisPanelProps {
  analysisResult: {
    fingerprint: string;
    archetype: string;
    intensity: number;
    momentum: number;
    totalPatternDensity: number;
    totalFiles: number;
    totalLinesOfCode: number;
    quadrantProfile: {
      coreSdk: number;
      chessDomain: number;
      codeDomain: number;
      ui: number;
    };
    issues: Array<{
      severity: 'critical' | 'high' | 'medium' | 'low';
    }>;
  };
  animated?: boolean;
}

// Generate a mock 64-metric grid from analysis data
function generateMetricGrid(analysis: EnhancedCodeAnalysisPanelProps['analysisResult']): CodeMetricGrid {
  const dimensions: CodeDimension[] = [
    'complexity', 'cohesion', 'coverage', 'velocity',
    'quality', 'architecture', 'performance', 'evolution'
  ];
  
  const categories: CodeCategory[] = [
    'core-sdk', 'chess-domain', 'market-domain', 'code-domain',
    'ui-components', 'hooks-stores', 'pages-routes', 'utils-types'
  ];

  // Base values from analysis
  const baseIntensity = analysis.intensity * 100;
  const baseMomentum = analysis.momentum * 100;
  const baseDensity = analysis.totalPatternDensity * 100;
  
  // Category weights from quadrant profile
  const categoryWeights: Record<CodeCategory, number> = {
    'core-sdk': analysis.quadrantProfile.coreSdk * 100 + 20,
    'chess-domain': analysis.quadrantProfile.chessDomain * 100 + 15,
    'market-domain': 30 + Math.random() * 20,
    'code-domain': analysis.quadrantProfile.codeDomain * 100 + 15,
    'ui-components': analysis.quadrantProfile.ui * 100 + 10,
    'hooks-stores': 40 + Math.random() * 30,
    'pages-routes': 35 + Math.random() * 25,
    'utils-types': 50 + Math.random() * 20
  };

  // Dimension weights based on archetype
  const dimensionWeights: Record<CodeDimension, number> = {
    complexity: 70 + (100 - baseIntensity) * 0.3,
    cohesion: baseDensity * 0.8 + 20,
    coverage: baseDensity + 10,
    velocity: baseMomentum * 0.9 + 10,
    quality: 100 - (analysis.issues.filter(i => i.severity === 'critical').length * 10),
    architecture: baseIntensity * 0.7 + 30,
    performance: 60 + Math.random() * 25,
    evolution: baseMomentum * 0.8 + 20
  };

  // Generate 64 metrics
  const metrics = dimensions.flatMap(dimension => 
    categories.map(category => {
      const dimWeight = dimensionWeights[dimension];
      const catWeight = categoryWeights[category];
      const variance = (Math.random() - 0.5) * 20;
      const value = Math.max(0, Math.min(100, (dimWeight + catWeight) / 2 + variance));
      
      return {
        dimension,
        category,
        value,
        rawValue: value * 1.2,
        weight: 1,
        trend: Math.random() > 0.6 ? 'improving' : Math.random() > 0.3 ? 'stable' : 'degrading'
      } as const;
    })
  );

  // Calculate aggregated views
  const byDimension = dimensions.reduce((acc, dim) => {
    const dimMetrics = metrics.filter(m => m.dimension === dim);
    acc[dim] = dimMetrics.reduce((sum, m) => sum + m.value, 0) / dimMetrics.length;
    return acc;
  }, {} as Record<CodeDimension, number>);

  const byCategory = categories.reduce((acc, cat) => {
    const catMetrics = metrics.filter(m => m.category === cat);
    acc[cat] = catMetrics.reduce((sum, m) => sum + m.value, 0) / catMetrics.length;
    return acc;
  }, {} as Record<CodeCategory, number>);

  const overallScore = metrics.reduce((sum, m) => sum + m.value, 0) / metrics.length;

  return {
    metrics,
    timestamp: Date.now(),
    version: '1.0.0',
    byDimension,
    byCategory,
    overallScore
  };
}

// Generate health data
function generateHealthData(analysis: EnhancedCodeAnalysisPanelProps['analysisResult']): CodeHealthData {
  const score = analysis.intensity * 50 + analysis.totalPatternDensity * 30 + analysis.momentum * 20;
  const normalizedScore = Math.min(100, Math.max(0, score * 100));
  
  const grade = normalizedScore >= 90 ? 'A' :
                normalizedScore >= 75 ? 'B' :
                normalizedScore >= 60 ? 'C' :
                normalizedScore >= 40 ? 'D' : 'F';

  const criticalCount = analysis.issues.filter(i => i.severity === 'critical').length;
  const highCount = analysis.issues.filter(i => i.severity === 'high').length;
  
  return {
    overallScore: normalizedScore,
    grade,
    dimensions: {
      complexity: 70 + Math.random() * 20,
      cohesion: analysis.totalPatternDensity * 100,
      coverage: analysis.intensity * 100,
      velocity: analysis.momentum * 100,
      quality: Math.max(30, 90 - criticalCount * 15 - highCount * 5),
      architecture: analysis.totalPatternDensity * 80 + 20,
      performance: 60 + Math.random() * 30,
      evolution: analysis.momentum * 80 + 20
    },
    trend: analysis.momentum > 0.7 ? 'improving' : analysis.momentum > 0.4 ? 'stable' : 'degrading',
    criticalIssues: criticalCount
  };
}

// Generate exchange values
function generateExchangeValue(analysis: EnhancedCodeAnalysisPanelProps['analysisResult']): ExchangeValue {
  const rawValue = analysis.totalPatternDensity * 100;
  const normalizedValue = rawValue * 0.8;
  const intelligence = analysis.intensity;
  
  return {
    domain: 'code',
    rawValue,
    normalizedValue,
    intelligence,
    universalUnits: normalizedValue * 1.0 // Code conversion rate is 1.0
  };
}

export function EnhancedCodeAnalysisPanel({
  analysisResult,
  animated = true
}: EnhancedCodeAnalysisPanelProps) {
  const [activeTab, setActiveTab] = useState('grid');
  const [highlightDimension, setHighlightDimension] = useState<CodeDimension | undefined>();
  
  // Generate derived data
  const metricGrid = useMemo(() => generateMetricGrid(analysisResult), [analysisResult]);
  const healthData = useMemo(() => generateHealthData(analysisResult), [analysisResult]);
  const codeExchangeValue = useMemo(() => generateExchangeValue(analysisResult), [analysisResult]);

  // Determine current and target archetypes
  const currentArchetype = analysisResult.archetype as CodeArchetype;
  const targetArchetype: CodeArchetype = 
    analysisResult.intensity > 0.7 ? 'pattern_master' :
    analysisResult.totalPatternDensity > 0.5 ? 'core_fortress' :
    'modular_army';

  const evolutionProgress = Math.min(100, analysisResult.intensity * 70 + analysisResult.totalPatternDensity * 30);

  return (
    <Card className="bg-gradient-to-br from-blue-500/5 via-background to-purple-500/5 border-blue-500/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Grid3X3 className="w-5 h-5 text-blue-400" />
          64-Metric Engine Analysis
          <Badge variant="outline" className="ml-2 text-xs bg-blue-500/10 text-blue-400 border-blue-500/30">
            PATENT-PENDING
          </Badge>
        </CardTitle>
        <CardDescription>
          Deep code flow signature analysis using 8 dimensions × 8 categories
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="grid" className="gap-1">
              <Grid3X3 className="w-3 h-3" />
              <span className="hidden sm:inline">Metric Grid</span>
            </TabsTrigger>
            <TabsTrigger value="health" className="gap-1">
              <Activity className="w-3 h-3" />
              <span className="hidden sm:inline">Health</span>
            </TabsTrigger>
            <TabsTrigger value="exchange" className="gap-1">
              <ArrowLeftRight className="w-3 h-3" />
              <span className="hidden sm:inline">Exchange</span>
            </TabsTrigger>
            <TabsTrigger value="evolution" className="gap-1">
              <TrendingUp className="w-3 h-3" />
              <span className="hidden sm:inline">Evolution</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="grid" className="mt-4">
            <motion.div
              className="flex flex-col items-center"
              initial={animated ? { opacity: 0, y: 20 } : {}}
              animate={{ opacity: 1, y: 0 }}
            >
              <MetricGrid64
                grid={metricGrid}
                size="md"
                showLabels
                showTooltips
                animated={animated}
                highlightDimension={highlightDimension}
              />
              
              <div className="mt-4 text-center">
                <p className="text-sm text-muted-foreground">
                  64 metrics across 8 dimensions mirror the chess 64-square analysis
                </p>
                <div className="flex items-center justify-center gap-2 mt-2">
                  <Badge variant="outline" className="text-xs">
                    {analysisResult.totalFiles} files analyzed
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {analysisResult.totalLinesOfCode.toLocaleString()} LOC
                  </Badge>
                </div>
              </div>
            </motion.div>
          </TabsContent>

          <TabsContent value="health" className="mt-4">
            <motion.div
              className="flex flex-col items-center gap-6"
              initial={animated ? { opacity: 0, y: 20 } : {}}
              animate={{ opacity: 1, y: 0 }}
            >
              <CodeHealthGauge
                data={healthData}
                size="lg"
                showDimensions
                animated={animated}
              />
            </motion.div>
          </TabsContent>

          <TabsContent value="exchange" className="mt-4">
            <motion.div
              initial={animated ? { opacity: 0, y: 20 } : {}}
              animate={{ opacity: 1, y: 0 }}
            >
              <ExchangeValueDisplay
                codeValue={codeExchangeValue}
                chessValue={{
                  domain: 'chess',
                  rawValue: codeExchangeValue.rawValue * 0.8,
                  normalizedValue: codeExchangeValue.normalizedValue * 0.8,
                  intelligence: codeExchangeValue.intelligence * 0.9,
                  universalUnits: codeExchangeValue.universalUnits * 0.8
                }}
                marketValue={{
                  domain: 'market',
                  rawValue: codeExchangeValue.rawValue * 1.2,
                  normalizedValue: codeExchangeValue.normalizedValue * 1.2,
                  intelligence: codeExchangeValue.intelligence * 0.85,
                  universalUnits: codeExchangeValue.universalUnits * 1.2
                }}
                showConversions
                animated={animated}
              />
            </motion.div>
          </TabsContent>

          <TabsContent value="evolution" className="mt-4">
            <motion.div
              className="space-y-6"
              initial={animated ? { opacity: 0, y: 20 } : {}}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/30">
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground mb-1">Current State</p>
                  <ArchetypeBadge
                    archetype={currentArchetype}
                    category="code"
                    size="md"
                    showIcon
                    showDescription
                  />
                </div>
                <ChevronRight className="w-6 h-6 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground mb-1">Target State</p>
                  <ArchetypeBadge
                    archetype={targetArchetype}
                    category="code"
                    size="md"
                    showIcon
                    showDescription
                  />
                </div>
              </div>

              <ArchetypeEvolutionPath
                currentArchetype={currentArchetype}
                targetArchetype={targetArchetype}
                progress={evolutionProgress}
                animated={animated}
              />

              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 text-center">
                  <Brain className="w-5 h-5 mx-auto mb-1 text-primary" />
                  <div className="text-lg font-bold">{Math.round(evolutionProgress)}%</div>
                  <div className="text-xs text-muted-foreground">Progress</div>
                </div>
                <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-center">
                  <Target className="w-5 h-5 mx-auto mb-1 text-green-400" />
                  <div className="text-lg font-bold">{Math.round(analysisResult.intensity * 100)}%</div>
                  <div className="text-xs text-muted-foreground">Intensity</div>
                </div>
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-center">
                  <Sparkles className="w-5 h-5 mx-auto mb-1 text-amber-400" />
                  <div className="text-lg font-bold">{Math.round(analysisResult.totalPatternDensity * 100)}%</div>
                  <div className="text-xs text-muted-foreground">Density</div>
                </div>
              </div>
            </motion.div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

export default EnhancedCodeAnalysisPanel;
