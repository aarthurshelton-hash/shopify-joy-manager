/**
 * SignatureVisualization - En Pensent temporal signature display
 * Shows QuadrantRadar, TemporalFlowChart, ArchetypeBadge, and PredictionGauge
 */

import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  QuadrantRadar, 
  TemporalFlowChart, 
  ArchetypeBadge,
  PredictionGauge 
} from '@/components/pensent-ui';
import { Fingerprint, Activity, Compass, TrendingUp } from 'lucide-react';
import type { CodeAnalysisResult } from '@/hooks/useCodeAnalysis';

interface SignatureVisualizationProps {
  result: CodeAnalysisResult;
  animated?: boolean;
}

export function SignatureVisualization({ result, animated = true }: SignatureVisualizationProps) {
  // Map flow direction to display text
  const flowDirectionLabels = {
    forward: 'Forward Momentum',
    lateral: 'Lateral Expansion',
    backward: 'Consolidating',
    chaotic: 'Chaotic Evolution'
  };

  // Map dominant force to display text
  const dominantForceLabels = {
    primary: 'Feature-Driven',
    secondary: 'Maintenance-Focused',
    balanced: 'Balanced Approach'
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Fingerprint className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg">Temporal Signature™ Analysis</CardTitle>
            <CardDescription>
              Pattern visualization powered by En Pensent™
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-6">
        <div className="grid gap-8">
          {/* Top Row: Archetype + Prediction Gauge */}
          <motion.div 
            className="flex flex-wrap items-center justify-between gap-6"
            initial={animated ? { opacity: 0, y: 20 } : {}}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            {/* Archetype Badge */}
            <div className="flex flex-col gap-2">
              <span className="text-xs text-muted-foreground uppercase tracking-wide">
                Detected Archetype
              </span>
              <ArchetypeBadge 
                archetype={result.archetype} 
                category="code"
                size="lg"
                showIcon
                showDescription
              />
            </div>

            {/* Flow Direction & Dominant Force */}
            <div className="flex gap-6">
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                  <Compass className="h-3 w-3" />
                  Flow Direction
                </span>
                <span className="font-semibold text-foreground">
                  {flowDirectionLabels[result.flow_direction]}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  Dominant Force
                </span>
                <span className="font-semibold text-foreground">
                  {dominantForceLabels[result.dominant_force]}
                </span>
              </div>
            </div>

            {/* Prediction Gauge */}
            <PredictionGauge
              value={result.outcome_confidence * 100}
              size={100}
              strokeWidth={8}
              label="Confidence"
              animated={animated}
            />
          </motion.div>

          {/* Fingerprint Display */}
          <motion.div
            className="p-4 rounded-lg bg-muted/30 border"
            initial={animated ? { opacity: 0 } : {}}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Fingerprint className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-foreground">Signature Fingerprint</span>
            </div>
            <code className="font-mono text-xs text-muted-foreground break-all">
              {result.fingerprint}
            </code>
          </motion.div>

          {/* Middle Row: Charts */}
          <div className="grid md:grid-cols-2 gap-8">
            {/* Quadrant Radar */}
            <motion.div
              className="flex flex-col items-center"
              initial={animated ? { opacity: 0, scale: 0.9 } : {}}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
            >
              <h4 className="text-sm font-medium text-foreground mb-4 flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" />
                Quadrant Profile
              </h4>
              <QuadrantRadar
                data={result.quadrant_profile}
                labels={{
                  q1: 'Features',
                  q2: 'Testing',
                  q3: 'Docs',
                  q4: 'Refactor'
                }}
                size={200}
                showLabels
                showValues
                animated={animated}
              />
              <p className="text-xs text-muted-foreground mt-4 text-center max-w-[200px]">
                Distribution of development activity across code areas
              </p>
            </motion.div>

            {/* Temporal Flow Chart */}
            <motion.div
              className="flex flex-col items-center"
              initial={animated ? { opacity: 0, scale: 0.9 } : {}}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
            >
              <h4 className="text-sm font-medium text-foreground mb-4 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Temporal Flow
              </h4>
              <TemporalFlowChart
                data={{
                  opening: result.temporal_flow.opening,
                  midgame: result.temporal_flow.midgame,
                  endgame: result.temporal_flow.endgame
                }}
                height={160}
                showLabels
                showValues
                animated={animated}
                colorScheme="gradient"
              />
              <p className="text-xs text-muted-foreground mt-4 text-center max-w-[200px]">
                Activity distribution across the analysis period
              </p>
            </motion.div>
          </div>

          {/* Intensity Bar */}
          <motion.div
            className="space-y-2"
            initial={animated ? { opacity: 0, y: 10 } : {}}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">
                Development Intensity
              </span>
              <span className="text-sm font-bold text-primary">
                {Math.round(result.intensity * 100)}%
              </span>
            </div>
            <div className="h-3 bg-muted rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-primary/60 via-primary to-primary/80 rounded-full"
                initial={animated ? { width: 0 } : { width: `${result.intensity * 100}%` }}
                animate={{ width: `${result.intensity * 100}%` }}
                transition={{ duration: 1, delay: 0.6, ease: "easeOut" }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Measures the overall level of development activity and momentum
            </p>
          </motion.div>

          {/* Predicted Outcome */}
          <motion.div
            className={`p-4 rounded-lg border ${
              result.predicted_outcome === 'success' 
                ? 'bg-green-500/10 border-green-500/30' 
                : result.predicted_outcome === 'failure'
                ? 'bg-red-500/10 border-red-500/30'
                : 'bg-amber-500/10 border-amber-500/30'
            }`}
            initial={animated ? { opacity: 0, y: 10 } : {}}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm text-muted-foreground">Predicted Outcome</span>
                <p className={`text-lg font-bold capitalize ${
                  result.predicted_outcome === 'success' 
                    ? 'text-green-400' 
                    : result.predicted_outcome === 'failure'
                    ? 'text-red-400'
                    : 'text-amber-400'
                }`}>
                  {result.predicted_outcome}
                </p>
              </div>
              <div className="text-right">
                <span className="text-sm text-muted-foreground">Confidence</span>
                <p className="text-lg font-bold text-foreground">
                  {Math.round(result.outcome_confidence * 100)}%
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </CardContent>
    </Card>
  );
}

export default SignatureVisualization;
