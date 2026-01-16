import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Award,
  Crown,
  Shield,
  TrendingUp,
  Star,
  Sparkles,
  CheckCircle,
  Palette,
  Gamepad2,
  Gem,
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { 
  TemporalSignature, 
  QuadrantProfile, 
  TemporalFlow 
} from '@/lib/pensent-core/types';
import { classifyUniversalArchetype } from '@/lib/pensent-core/archetype';

interface CertifiedBadgeProps {
  type: 'palette' | 'game' | 'genesis' | 'premium';
  name?: string;
  similarity?: number;
  matchType?: 'exact' | 'partial' | 'none';
  className?: string;
}

const BADGE_DATA = {
  premium: {
    icon: Gem,
    label: 'Premium',
    gradient: 'from-amber-400 via-yellow-500 to-amber-600',
    glow: 'shadow-amber-500/40',
    sellPoints: [
      { icon: Crown, text: 'Official Game + Palette', value: 'Maximum Value' },
      { icon: TrendingUp, text: 'Highest appreciation rate', value: '+35% annually' },
      { icon: Shield, text: 'Double-certified authenticity', value: 'Verified' },
      { icon: Star, text: 'Premium print quality', value: 'Museum grade' },
    ],
    description: 'This vision combines an officially curated En Pensent game AND palette, representing the highest tier of encryption value.',
  },
  genesis: {
    icon: Sparkles,
    label: 'Genesis',
    gradient: 'from-violet-500 to-purple-600',
    glow: 'shadow-violet-500/30',
    sellPoints: [
      { icon: Crown, text: 'Official game OR palette', value: 'Single certified' },
      { icon: TrendingUp, text: 'Collector value appreciation', value: '+20% annually' },
      { icon: Shield, text: 'Partial certification', value: 'Verified' },
      { icon: Star, text: 'Enhanced print quality', value: 'Premium grade' },
    ],
    description: 'This vision uses either an officially curated En Pensent game OR palette, earning Genesis status with enhanced encryption value.',
  },
  palette: {
    icon: Palette,
    label: 'Official Palette',
    gradient: 'from-indigo-500 to-purple-600',
    glow: 'shadow-purple-500/30',
    sellPoints: [
      { icon: Award, text: 'Official En Pensent palette', value: '100% Verified' },
      { icon: TrendingUp, text: 'Collector value appreciation', value: '+15% annually' },
      { icon: Shield, text: 'Trademark protected', value: 'Exclusive' },
      { icon: Star, text: 'Premium print quality', value: 'Pantone matched' },
    ],
    description: 'This vision uses an official En Pensent color palette, ensuring professional quality and collector authenticity.',
  },
  game: {
    icon: Gamepad2,
    label: 'Legendary Game',
    gradient: 'from-amber-500 to-orange-600',
    glow: 'shadow-amber-500/30',
    sellPoints: [
      { icon: Crown, text: 'Historical masterpiece', value: 'Chess heritage' },
      { icon: TrendingUp, text: 'Intrinsic collector value', value: '+25% appreciation' },
      { icon: Sparkles, text: 'Famous games database', value: '90+ verified' },
      { icon: CheckCircle, text: 'PGN authenticity', value: 'Chessgames.com' },
    ],
    description: 'This visualization captures a legendary chess game, immortalized in chess history and verified against our famous games database.',
  },
};

// Extract temporal signature for certification archetype
function extractCertificationSignature(type: 'palette' | 'game' | 'genesis' | 'premium'): TemporalSignature {
  const typeIntensity = {
    premium: 95,
    genesis: 80,
    game: 70,
    palette: 60,
  };

  const quadrantProfile: QuadrantProfile = {
    q1: type === 'premium' ? 95 : type === 'genesis' ? 80 : 60,
    q2: type === 'game' ? 85 : 50,
    q3: type === 'palette' ? 75 : 45,
    q4: 40,
  };

  const temporalFlow: TemporalFlow = {
    opening: type === 'premium' ? 0.9 : 0.7,
    middle: type === 'genesis' ? 0.85 : 0.65,
    ending: type === 'game' ? 0.8 : 0.55,
    trend: type === 'premium' ? 'accelerating' : 'stable',
    momentum: type === 'premium' ? 0.8 : 0.3,
  };

  return {
    fingerprint: `cert-${type}-${Date.now()}`,
    archetype: `certified_${type}`,
    quadrantProfile,
    temporalFlow,
    intensity: typeIntensity[type] / 100,
    dominantForce: type === 'premium' ? 'primary' : 'secondary',
    flowDirection: 'forward',
    criticalMoments: [],
  };
}

export const CertifiedBadge: React.FC<CertifiedBadgeProps> = ({
  type,
  name,
  similarity,
  matchType = 'exact',
  className = '',
}) => {
  const data = BADGE_DATA[type];
  const Icon = data.icon;
  
  // Extract En Pensent signature for this certification type
  const { signature, archetype } = useMemo(() => {
    const sig = extractCertificationSignature(type);
    const arch = classifyUniversalArchetype(sig);
    return { signature: sig, archetype: arch };
  }, [type]);
  
  const matchLabel = matchType === 'exact' ? 'Exact match' : matchType === 'partial' ? 'Partial match' : '';
  const matchColor = matchType === 'exact' ? 'text-green-400' : 'text-amber-400';

  return (
    <TooltipProvider>
      <Tooltip delayDuration={100}>
        <TooltipTrigger asChild>
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            whileHover={{ scale: 1.05 }}
            className={`cursor-help ${className}`}
          >
            <Badge 
              variant="outline" 
              className={`
                gap-1.5 px-2.5 py-1 font-medium text-white border-0
                bg-gradient-to-r ${data.gradient}
                shadow-lg ${data.glow}
                hover:shadow-xl transition-shadow
              `}
            >
              <Icon className="h-3.5 w-3.5" />
              {data.label}
              {similarity !== undefined && similarity >= 95 && (
                <CheckCircle className="h-3 w-3 text-white/90" />
              )}
            </Badge>
          </motion.div>
        </TooltipTrigger>
        <TooltipContent 
          side="bottom" 
          align="center" 
          className="max-w-[320px] p-0 overflow-hidden"
        >
          <div className={`p-3 bg-gradient-to-r ${data.gradient}`}>
            <div className="flex items-center gap-2 text-white">
              <Icon className="h-5 w-5" />
              <span className="font-bold">{data.label}</span>
              {name && (
                <span className="text-white/80 text-sm truncate max-w-[150px]">
                  — {name}
                </span>
              )}
            </div>
            {archetype && (
              <div className="text-white/70 text-xs mt-1">
                Pattern: {archetype} • Intensity: {signature.intensity}%
              </div>
            )}
          </div>
          
          <div className="p-3 space-y-3">
            <p className="text-xs text-muted-foreground leading-relaxed">
              {data.description}
            </p>
            
            {matchType !== 'none' && similarity !== undefined && (
              <div className="flex items-center justify-between text-xs border-b border-border/50 pb-2">
                <span className={`font-medium ${matchColor}`}>
                  {matchLabel}
                </span>
                <span className="font-mono text-primary">
                  {similarity.toFixed(1)}% confidence
                </span>
              </div>
            )}
            
            <div className="space-y-2">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                Value Metrics
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {data.sellPoints.map((point, idx) => {
                  const PointIcon = point.icon;
                  return (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -5 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="flex items-start gap-1.5 p-1.5 rounded bg-muted/50"
                    >
                      <PointIcon className="h-3 w-3 text-primary shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[10px] text-muted-foreground leading-tight">
                          {point.text}
                        </p>
                        <p className="text-xs font-semibold text-foreground">
                          {point.value}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
            
            <div className="pt-2 border-t border-border/50 text-center">
              <span className="text-[10px] text-primary italic flex items-center justify-center gap-1">
                <Sparkles className="h-3 w-3" />
                {type === 'premium' ? 'Premium visions retain +35% resale value' : 
                 type === 'genesis' ? 'Genesis visions retain +20% resale value' :
                 'Certified visions retain +20% resale value'}
              </span>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default CertifiedBadge;
