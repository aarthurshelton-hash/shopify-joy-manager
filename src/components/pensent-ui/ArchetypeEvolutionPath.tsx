/**
 * ArchetypeEvolutionPath - Shows archetype evolution trajectory
 * 
 * Visualizes the recommended evolution path from current to target archetype
 */

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { ArrowRight, CheckCircle, Circle, Target } from "lucide-react";
import type { CodeArchetype } from "@/lib/pensent-core/domains/code/archetypeClassifier";

export interface ArchetypeEvolutionPathProps {
  currentArchetype: CodeArchetype;
  targetArchetype: CodeArchetype | null;
  intermediateSteps?: CodeArchetype[];
  progress?: number; // 0-100
  animated?: boolean;
  className?: string;
}

const ARCHETYPE_LABELS: Record<CodeArchetype, string> = {
  core_fortress: 'Core Fortress',
  rapid_expansion: 'Rapid Expansion',
  pattern_master: 'Pattern Master',
  modular_army: 'Modular Army',
  monolith_giant: 'Monolith Giant',
  microservice_swarm: 'Microservice Swarm',
  hybrid_fusion: 'Hybrid Fusion',
  technical_debt: 'Technical Debt',
  emerging_startup: 'Emerging Startup',
  legacy_evolution: 'Legacy Evolution',
  innovation_lab: 'Innovation Lab',
  production_stable: 'Production Stable'
};

const ARCHETYPE_COLORS: Record<CodeArchetype, string> = {
  core_fortress: 'bg-purple-500/20 border-purple-500/40 text-purple-400',
  rapid_expansion: 'bg-green-500/20 border-green-500/40 text-green-400',
  pattern_master: 'bg-amber-500/20 border-amber-500/40 text-amber-400',
  modular_army: 'bg-blue-500/20 border-blue-500/40 text-blue-400',
  monolith_giant: 'bg-red-500/20 border-red-500/40 text-red-400',
  microservice_swarm: 'bg-cyan-500/20 border-cyan-500/40 text-cyan-400',
  hybrid_fusion: 'bg-violet-500/20 border-violet-500/40 text-violet-400',
  technical_debt: 'bg-orange-500/20 border-orange-500/40 text-orange-400',
  emerging_startup: 'bg-teal-500/20 border-teal-500/40 text-teal-400',
  legacy_evolution: 'bg-slate-500/20 border-slate-500/40 text-slate-400',
  innovation_lab: 'bg-pink-500/20 border-pink-500/40 text-pink-400',
  production_stable: 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
};

export const ArchetypeEvolutionPath = ({
  currentArchetype,
  targetArchetype,
  intermediateSteps = [],
  progress = 0,
  animated = true,
  className
}: ArchetypeEvolutionPathProps) => {
  const allSteps = [currentArchetype, ...intermediateSteps, targetArchetype].filter(Boolean) as CodeArchetype[];
  
  if (allSteps.length < 2) {
    return (
      <div className={cn("flex items-center gap-2 p-3 rounded-lg bg-muted/30", className)}>
        <CheckCircle className="w-5 h-5 text-green-400" />
        <span className="text-sm text-muted-foreground">
          Already at optimal archetype: <span className="font-medium text-foreground">{ARCHETYPE_LABELS[currentArchetype]}</span>
        </span>
      </div>
    );
  }

  const stepProgress = 100 / (allSteps.length - 1);
  const currentStep = Math.floor(progress / stepProgress);

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Target className="w-4 h-4" />
        <span>Evolution Path</span>
      </div>

      {/* Progress bar */}
      <div className="relative h-2 bg-muted rounded-full overflow-hidden">
        <motion.div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary/60 to-primary rounded-full"
          initial={animated ? { width: 0 } : { width: `${progress}%` }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
        
        {/* Step markers */}
        {allSteps.map((_, i) => (
          <div
            key={i}
            className={cn(
              "absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-background",
              i <= currentStep ? 'bg-primary' : 'bg-muted'
            )}
            style={{ left: `${(i / (allSteps.length - 1)) * 100}%`, transform: 'translate(-50%, -50%)' }}
          />
        ))}
      </div>

      {/* Step labels */}
      <div className="flex items-center justify-between gap-2">
        {allSteps.map((archetype, i) => (
          <motion.div
            key={archetype}
            className="flex flex-col items-center"
            initial={animated ? { opacity: 0, y: 10 } : {}}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <div className={cn(
              "flex items-center gap-1 px-2 py-1 rounded border text-xs font-medium",
              ARCHETYPE_COLORS[archetype],
              i === 0 && "ring-2 ring-primary/50",
              i === allSteps.length - 1 && "ring-2 ring-amber-500/50"
            )}>
              {i === 0 && <Circle className="w-3 h-3" />}
              {i === allSteps.length - 1 && <Target className="w-3 h-3" />}
              <span className="hidden sm:inline">{ARCHETYPE_LABELS[archetype]}</span>
            </div>
            
            {/* Arrow between steps */}
            {i < allSteps.length - 1 && (
              <ArrowRight className="w-4 h-4 text-muted-foreground absolute" style={{ display: 'none' }} />
            )}
          </motion.div>
        ))}
      </div>

      {/* Current vs Target summary */}
      <div className="flex items-center justify-between text-sm mt-2">
        <div>
          <span className="text-muted-foreground">Current: </span>
          <span className="font-medium">{ARCHETYPE_LABELS[currentArchetype]}</span>
        </div>
        <ArrowRight className="w-4 h-4 text-muted-foreground" />
        <div>
          <span className="text-muted-foreground">Target: </span>
          <span className="font-medium text-primary">{ARCHETYPE_LABELS[targetArchetype!]}</span>
        </div>
      </div>
    </div>
  );
};

export default ArchetypeEvolutionPath;
