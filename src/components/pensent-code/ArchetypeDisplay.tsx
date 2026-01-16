import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  Rocket, 
  RefreshCw, 
  AlertTriangle, 
  Mountain, 
  Zap, 
  Skull, 
  Target,
  Beaker,
  Wrench,
  TrendingUp
} from 'lucide-react';

const ARCHETYPE_CONFIG: Record<string, {
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  description: string;
}> = {
  rapid_growth: {
    icon: Rocket,
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
    description: 'Fast feature development with minimal bugs',
  },
  refactor_cycle: {
    icon: RefreshCw,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    description: 'Active code improvement and restructuring',
  },
  tech_debt_spiral: {
    icon: AlertTriangle,
    color: 'text-red-500',
    bgColor: 'bg-red-500/10',
    description: 'Accumulating bugs with insufficient refactoring',
  },
  stability_plateau: {
    icon: Mountain,
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10',
    description: 'Mature, stable codebase with balanced development',
  },
  feature_burst: {
    icon: Zap,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-500/10',
    description: 'Concentrated feature development push',
  },
  death_march: {
    icon: Skull,
    color: 'text-red-600',
    bgColor: 'bg-red-600/10',
    description: 'Critical: Increasing bugs and decreasing velocity',
  },
  quality_focused: {
    icon: Target,
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
    description: 'High test coverage with deliberate development',
  },
  experimental: {
    icon: Beaker,
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
    description: 'Exploration phase with many small changes',
  },
  maintenance_mode: {
    icon: Wrench,
    color: 'text-gray-500',
    bgColor: 'bg-gray-500/10',
    description: 'Minimal features, focus on fixes and upkeep',
  },
  steady_development: {
    icon: TrendingUp,
    color: 'text-teal-500',
    bgColor: 'bg-teal-500/10',
    description: 'Healthy, balanced development pattern',
  },
};

interface ArchetypeDisplayProps {
  archetype: string;
  predictedOutcome: 'success' | 'failure' | 'uncertain';
  outcomeConfidence: number;
  intensity: number;
  dominantForce: string;
  flowDirection: string;
}

export function ArchetypeDisplay({
  archetype,
  predictedOutcome,
  outcomeConfidence,
  intensity,
  dominantForce,
  flowDirection,
}: ArchetypeDisplayProps) {
  const config = ARCHETYPE_CONFIG[archetype] || ARCHETYPE_CONFIG.steady_development;
  const Icon = config.icon;

  const formatArchetype = (a: string) => 
    a.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  const getOutcomeColor = (outcome: string) => {
    switch (outcome) {
      case 'success': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'failure': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    }
  };

  return (
    <Card className={`${config.bgColor} border-2`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-lg ${config.bgColor}`}>
              <Icon className={`h-8 w-8 ${config.color}`} />
            </div>
            <div>
              <CardTitle className="text-2xl">{formatArchetype(archetype)}</CardTitle>
              <CardDescription className="text-base mt-1">
                {config.description}
              </CardDescription>
            </div>
          </div>
          <Badge className={`text-lg px-4 py-2 ${getOutcomeColor(predictedOutcome)}`}>
            {predictedOutcome === 'success' && '✓ '}
            {predictedOutcome === 'failure' && '✗ '}
            {predictedOutcome === 'uncertain' && '? '}
            {predictedOutcome.toUpperCase()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">Confidence</div>
            <div className="flex items-center gap-2">
              <Progress value={outcomeConfidence * 100} className="h-2" />
              <span className="text-sm font-medium">{Math.round(outcomeConfidence * 100)}%</span>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">Intensity</div>
            <div className="flex items-center gap-2">
              <Progress value={intensity * 100} className="h-2" />
              <span className="text-sm font-medium">{Math.round(intensity * 100)}%</span>
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">Dominant Force</div>
            <Badge variant="outline" className="capitalize">
              {dominantForce}
            </Badge>
          </div>

          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">Flow Direction</div>
            <Badge variant="outline" className="capitalize">
              {flowDirection}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
