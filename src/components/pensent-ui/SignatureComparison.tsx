/**
 * SignatureComparison - Side-by-side temporal signature diff
 * Highlights differences between two TemporalSignature objects
 */

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { ArrowRight, ArrowUp, ArrowDown, Minus, AlertCircle } from "lucide-react";
import type { TemporalSignature, QuadrantProfile, TemporalFlow } from "@/lib/pensent-core/types";
import { QuadrantRadar } from "./QuadrantRadar";
import { TemporalFlowChart } from "./TemporalFlowChart";
import { ArchetypeBadge } from "./ArchetypeBadge";

export interface SignatureComparisonProps {
  /** First signature (left side) */
  signatureA: TemporalSignature;
  /** Second signature (right side) */
  signatureB: TemporalSignature;
  /** Labels for each signature */
  labels?: { a: string; b: string };
  /** Show detailed breakdown */
  showDetails?: boolean;
  /** Enable animations */
  animated?: boolean;
  /** Custom class name */
  className?: string;
}

interface DiffResult {
  key: string;
  valueA: string | number;
  valueB: string | number;
  difference: number | null;
  direction: 'up' | 'down' | 'same' | 'changed';
  significant: boolean;
}

/**
 * Calculate difference between two values
 */
const calculateDiff = (
  a: number | string, 
  b: number | string
): { difference: number | null; direction: 'up' | 'down' | 'same' | 'changed' } => {
  if (typeof a === 'number' && typeof b === 'number') {
    const diff = b - a;
    return {
      difference: Math.round(diff * 100) / 100,
      direction: diff > 0.01 ? 'up' : diff < -0.01 ? 'down' : 'same'
    };
  }
  return {
    difference: null,
    direction: a !== b ? 'changed' : 'same'
  };
};

/**
 * Compare two quadrant profiles
 */
const compareQuadrants = (a: QuadrantProfile, b: QuadrantProfile): DiffResult[] => {
  const keys: ('q1' | 'q2' | 'q3' | 'q4')[] = ['q1', 'q2', 'q3', 'q4'];
  return keys.map(key => {
    const valA = a[key];
    const valB = b[key];
    const { difference, direction } = calculateDiff(valA, valB);
    return {
      key: key.toUpperCase(),
      valueA: Math.round(valA * 100),
      valueB: Math.round(valB * 100),
      difference: difference ? Math.round(difference * 100) : 0,
      direction,
      significant: Math.abs(difference || 0) > 0.1
    };
  });
};

/**
 * Compare two temporal flows
 */
const compareFlows = (a: TemporalFlow, b: TemporalFlow): DiffResult[] => {
  return [
    {
      key: 'Opening',
      valueA: Math.round(a.opening * 100),
      valueB: Math.round(b.opening * 100),
      ...calculateDiff(a.opening, b.opening),
      significant: Math.abs(b.opening - a.opening) > 0.1
    },
    {
      key: 'Middle',
      valueA: Math.round(a.middle * 100),
      valueB: Math.round(b.middle * 100),
      ...calculateDiff(a.middle, b.middle),
      significant: Math.abs(b.middle - a.middle) > 0.1
    },
    {
      key: 'Ending',
      valueA: Math.round(a.ending * 100),
      valueB: Math.round(b.ending * 100),
      ...calculateDiff(a.ending, b.ending),
      significant: Math.abs(b.ending - a.ending) > 0.1
    },
    {
      key: 'Momentum',
      valueA: Math.round(a.momentum * 100),
      valueB: Math.round(b.momentum * 100),
      ...calculateDiff(a.momentum, b.momentum),
      significant: Math.abs(b.momentum - a.momentum) > 0.2
    },
    {
      key: 'Trend',
      valueA: a.trend,
      valueB: b.trend,
      difference: null,
      direction: a.trend !== b.trend ? 'changed' : 'same',
      significant: a.trend !== b.trend
    }
  ];
};

const DirectionIcon = ({ direction }: { direction: 'up' | 'down' | 'same' | 'changed' }) => {
  switch (direction) {
    case 'up':
      return <ArrowUp className="w-4 h-4 text-green-400" />;
    case 'down':
      return <ArrowDown className="w-4 h-4 text-red-400" />;
    case 'changed':
      return <AlertCircle className="w-4 h-4 text-amber-400" />;
    default:
      return <Minus className="w-4 h-4 text-muted-foreground" />;
  }
};

const DiffRow = ({ diff, animated, index }: { diff: DiffResult; animated: boolean; index: number }) => (
  <motion.div
    className={cn(
      "grid grid-cols-4 gap-2 py-2 px-3 rounded-md text-sm",
      diff.significant ? "bg-amber-500/10 border border-amber-500/20" : "bg-muted/30"
    )}
    initial={animated ? { opacity: 0, x: -10 } : {}}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: index * 0.05 }}
  >
    <span className="font-medium text-foreground">{diff.key}</span>
    <span className="text-muted-foreground text-center">
      {typeof diff.valueA === 'number' ? `${diff.valueA}%` : diff.valueA}
    </span>
    <span className="flex items-center justify-center gap-1">
      <DirectionIcon direction={diff.direction} />
      {diff.difference !== null && diff.difference !== 0 && (
        <span className={cn(
          "text-xs",
          diff.direction === 'up' ? "text-green-400" : 
          diff.direction === 'down' ? "text-red-400" : 
          "text-muted-foreground"
        )}>
          {diff.difference > 0 ? '+' : ''}{diff.difference}%
        </span>
      )}
    </span>
    <span className="text-foreground text-center font-medium">
      {typeof diff.valueB === 'number' ? `${diff.valueB}%` : diff.valueB}
    </span>
  </motion.div>
);

export const SignatureComparison = ({
  signatureA,
  signatureB,
  labels = { a: 'Signature A', b: 'Signature B' },
  showDetails = true,
  animated = true,
  className
}: SignatureComparisonProps) => {
  const quadrantDiffs = compareQuadrants(signatureA.quadrantProfile, signatureB.quadrantProfile);
  const flowDiffs = compareFlows(signatureA.temporalFlow, signatureB.temporalFlow);
  
  const intensityDiff = calculateDiff(signatureA.intensity, signatureB.intensity);
  const archetypeChanged = signatureA.archetype !== signatureB.archetype;
  const fingerprintChanged = signatureA.fingerprint !== signatureB.fingerprint;

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header with fingerprints */}
      <motion.div 
        className="flex items-center justify-between gap-4"
        initial={animated ? { opacity: 0, y: -10 } : {}}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex-1 text-center">
          <span className="text-sm text-muted-foreground">{labels.a}</span>
          <p className="font-mono text-xs text-foreground/80 truncate mt-1">
            {signatureA.fingerprint.slice(0, 16)}...
          </p>
        </div>
        <ArrowRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
        <div className="flex-1 text-center">
          <span className="text-sm text-muted-foreground">{labels.b}</span>
          <p className="font-mono text-xs text-foreground/80 truncate mt-1">
            {signatureB.fingerprint.slice(0, 16)}...
          </p>
        </div>
      </motion.div>

      {/* Fingerprint change indicator */}
      {fingerprintChanged && (
        <motion.div
          className="flex items-center justify-center gap-2 py-2 px-4 bg-amber-500/10 border border-amber-500/30 rounded-md"
          initial={animated ? { opacity: 0, scale: 0.95 } : {}}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <AlertCircle className="w-4 h-4 text-amber-400" />
          <span className="text-sm text-amber-400">Fingerprints differ</span>
        </motion.div>
      )}

      {/* Archetype comparison */}
      <motion.div 
        className={cn(
          "flex items-center justify-between p-4 rounded-lg",
          archetypeChanged ? "bg-primary/10 border border-primary/30" : "bg-muted/30"
        )}
        initial={animated ? { opacity: 0, y: 10 } : {}}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex-1">
          <ArchetypeBadge archetype={signatureA.archetype} size="md" showIcon />
        </div>
        <ArrowRight className={cn(
          "w-5 h-5 mx-4",
          archetypeChanged ? "text-primary" : "text-muted-foreground"
        )} />
        <div className="flex-1 flex justify-end">
          <ArchetypeBadge archetype={signatureB.archetype} size="md" showIcon />
        </div>
      </motion.div>

      {/* Intensity comparison */}
      <motion.div
        className="grid grid-cols-3 gap-4 p-4 bg-muted/20 rounded-lg"
        initial={animated ? { opacity: 0 } : {}}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <div className="text-center">
          <span className="text-xs text-muted-foreground">Intensity A</span>
          <p className="text-xl font-bold text-foreground">
            {Math.round(signatureA.intensity * 100)}%
          </p>
        </div>
        <div className="text-center flex flex-col items-center justify-center">
          <DirectionIcon direction={intensityDiff.direction} />
          {intensityDiff.difference !== null && (
            <span className={cn(
              "text-sm font-medium",
              intensityDiff.direction === 'up' ? "text-green-400" :
              intensityDiff.direction === 'down' ? "text-red-400" :
              "text-muted-foreground"
            )}>
              {intensityDiff.difference > 0 ? '+' : ''}{Math.round(intensityDiff.difference * 100)}%
            </span>
          )}
        </div>
        <div className="text-center">
          <span className="text-xs text-muted-foreground">Intensity B</span>
          <p className="text-xl font-bold text-foreground">
            {Math.round(signatureB.intensity * 100)}%
          </p>
        </div>
      </motion.div>

      {/* Visual comparison - Quadrants */}
      <motion.div
        className="grid grid-cols-2 gap-8"
        initial={animated ? { opacity: 0 } : {}}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <div className="flex flex-col items-center">
          <span className="text-xs text-muted-foreground mb-2">{labels.a}</span>
          <QuadrantRadar 
            data={signatureA.quadrantProfile} 
            size={140}
            showLabels
            showValues={false}
            animated={animated}
          />
        </div>
        <div className="flex flex-col items-center">
          <span className="text-xs text-muted-foreground mb-2">{labels.b}</span>
          <QuadrantRadar 
            data={signatureB.quadrantProfile} 
            size={140}
            showLabels
            showValues={false}
            animated={animated}
          />
        </div>
      </motion.div>

      {/* Visual comparison - Temporal Flow */}
      <motion.div
        className="grid grid-cols-2 gap-8"
        initial={animated ? { opacity: 0 } : {}}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <div className="flex flex-col items-center">
          <TemporalFlowChart
            data={{
              opening: signatureA.temporalFlow.opening,
              midgame: signatureA.temporalFlow.middle,
              endgame: signatureA.temporalFlow.ending
            }}
            height={80}
            showLabels={false}
            animated={animated}
          />
        </div>
        <div className="flex flex-col items-center">
          <TemporalFlowChart
            data={{
              opening: signatureB.temporalFlow.opening,
              midgame: signatureB.temporalFlow.middle,
              endgame: signatureB.temporalFlow.ending
            }}
            height={80}
            showLabels={false}
            animated={animated}
          />
        </div>
      </motion.div>

      {/* Detailed differences */}
      {showDetails && (
        <div className="space-y-4">
          {/* Quadrant differences */}
          <div>
            <h4 className="text-sm font-medium text-foreground mb-2">Quadrant Profile</h4>
            <div className="space-y-1">
              <div className="grid grid-cols-4 gap-2 px-3 text-xs text-muted-foreground">
                <span>Metric</span>
                <span className="text-center">{labels.a}</span>
                <span className="text-center">Change</span>
                <span className="text-center">{labels.b}</span>
              </div>
              {quadrantDiffs.map((diff, i) => (
                <DiffRow key={diff.key} diff={diff} animated={animated} index={i} />
              ))}
            </div>
          </div>

          {/* Temporal flow differences */}
          <div>
            <h4 className="text-sm font-medium text-foreground mb-2">Temporal Flow</h4>
            <div className="space-y-1">
              <div className="grid grid-cols-4 gap-2 px-3 text-xs text-muted-foreground">
                <span>Phase</span>
                <span className="text-center">{labels.a}</span>
                <span className="text-center">Change</span>
                <span className="text-center">{labels.b}</span>
              </div>
              {flowDiffs.map((diff, i) => (
                <DiffRow key={diff.key} diff={diff} animated={animated} index={i + quadrantDiffs.length} />
              ))}
            </div>
          </div>

          {/* Critical moments summary */}
          <motion.div
            className="p-4 bg-muted/20 rounded-lg"
            initial={animated ? { opacity: 0 } : {}}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <h4 className="text-sm font-medium text-foreground mb-2">Critical Moments</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">{labels.a}: </span>
                <span className="text-foreground font-medium">
                  {signatureA.criticalMoments.length} moments
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">{labels.b}: </span>
                <span className="text-foreground font-medium">
                  {signatureB.criticalMoments.length} moments
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default SignatureComparison;
