/**
 * ArchetypeBadge - Reusable archetype display component
 * Used across chess, code, and future domain adapters
 */

import { Badge } from "@/components/ui/badge";
import { 
  Zap, 
  Shield, 
  Target, 
  TrendingUp, 
  AlertTriangle, 
  Sparkles,
  GitBranch,
  Flame,
  Anchor,
  Wind,
  Mountain,
  Waves
} from "lucide-react";
import { cn } from "@/lib/utils";

export type ArchetypeCategory = 'chess' | 'code' | 'universal';

export interface ArchetypeBadgeProps {
  archetype: string;
  category?: ArchetypeCategory;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  showDescription?: boolean;
  className?: string;
}

const ARCHETYPE_CONFIG: Record<string, {
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  borderColor: string;
  description: string;
}> = {
  // Chess archetypes
  'aggressive_attacker': {
    icon: Flame,
    color: 'text-red-400',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/30',
    description: 'Relentless attacking style with tactical brilliance'
  },
  'solid_defender': {
    icon: Shield,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
    description: 'Impenetrable defense that grinds opponents down'
  },
  'strategic_mastermind': {
    icon: Target,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/30',
    description: 'Long-term planning with deep positional understanding'
  },
  'dynamic_player': {
    icon: Wind,
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/10',
    borderColor: 'border-cyan-500/30',
    description: 'Fluid style adapting to any position'
  },
  'tactical_wizard': {
    icon: Zap,
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500/30',
    description: 'Sharp calculations and devastating combinations'
  },
  'positional_grinder': {
    icon: Mountain,
    color: 'text-stone-400',
    bgColor: 'bg-stone-500/10',
    borderColor: 'border-stone-500/30',
    description: 'Slow squeeze with accumulating advantages'
  },
  'counter_puncher': {
    icon: Anchor,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/30',
    description: 'Patient defense followed by lethal counterattack'
  },
  'universal_player': {
    icon: Sparkles,
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
    description: 'Master of all styles, adapts to any opponent'
  },
  
  // Code archetypes
  'rapid_growth': {
    icon: TrendingUp,
    color: 'text-green-400',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/30',
    description: 'Fast feature development with strong momentum'
  },
  'tech_debt_spiral': {
    icon: AlertTriangle,
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/30',
    description: 'Accumulating complexity requiring refactoring'
  },
  'hybrid_innovation': {
    icon: GitBranch,
    color: 'text-violet-400',
    bgColor: 'bg-violet-500/10',
    borderColor: 'border-violet-500/30',
    description: 'Balanced approach combining stability with innovation'
  },
  'maintenance_mode': {
    icon: Shield,
    color: 'text-slate-400',
    bgColor: 'bg-slate-500/10',
    borderColor: 'border-slate-500/30',
    description: 'Stable codebase with minimal new development'
  },
  'refactor_heavy': {
    icon: Waves,
    color: 'text-teal-400',
    bgColor: 'bg-teal-500/10',
    borderColor: 'border-teal-500/30',
    description: 'Active improvement of existing architecture'
  },
  'test_driven': {
    icon: Target,
    color: 'text-indigo-400',
    bgColor: 'bg-indigo-500/10',
    borderColor: 'border-indigo-500/30',
    description: 'High test coverage with quality-first approach'
  },
  'documentation_rich': {
    icon: Sparkles,
    color: 'text-pink-400',
    bgColor: 'bg-pink-500/10',
    borderColor: 'border-pink-500/30',
    description: 'Well-documented with clear knowledge transfer'
  },
  
  // Default/fallback
  'unknown': {
    icon: Sparkles,
    color: 'text-muted-foreground',
    bgColor: 'bg-muted/30',
    borderColor: 'border-muted',
    description: 'Pattern analysis in progress'
  }
};

export const ArchetypeBadge = ({
  archetype,
  category = 'universal',
  size = 'md',
  showIcon = true,
  showDescription = false,
  className
}: ArchetypeBadgeProps) => {
  const normalizedArchetype = archetype.toLowerCase().replace(/\s+/g, '_');
  const config = ARCHETYPE_CONFIG[normalizedArchetype] || ARCHETYPE_CONFIG['unknown'];
  const Icon = config.icon;
  
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-2'
  };
  
  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  return (
    <div className={cn("inline-flex flex-col gap-1", className)}>
      <Badge 
        variant="outline"
        className={cn(
          "inline-flex items-center gap-1.5 font-medium capitalize",
          config.bgColor,
          config.borderColor,
          config.color,
          sizeClasses[size]
        )}
      >
        {showIcon && <Icon className={iconSizes[size]} />}
        <span>{archetype.replace(/_/g, ' ')}</span>
      </Badge>
      {showDescription && (
        <span className="text-xs text-muted-foreground max-w-[200px]">
          {config.description}
        </span>
      )}
    </div>
  );
};

export default ArchetypeBadge;
