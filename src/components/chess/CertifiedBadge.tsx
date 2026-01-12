import React from 'react';
import { motion } from 'framer-motion';
import {
  Award,
  Crown,
  Shield,
  TrendingUp,
  Star,
  Sparkles,
  Info,
  CheckCircle,
  Palette,
  Gamepad2,
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';

interface CertifiedBadgeProps {
  type: 'palette' | 'game' | 'genesis';
  name?: string;
  similarity?: number;
  matchType?: 'exact' | 'partial' | 'none';
  className?: string;
}

const BADGE_DATA = {
  palette: {
    icon: Palette,
    label: 'Certified Palette',
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
  genesis: {
    icon: Crown,
    label: 'Exemplar',
    gradient: 'from-yellow-400 to-amber-500',
    glow: 'shadow-yellow-500/40',
    sellPoints: [
      { icon: Crown, text: 'Genesis collection', value: 'Limited edition' },
      { icon: TrendingUp, text: 'Platform growth multiplier', value: '2x base score' },
      { icon: Shield, text: 'Company seeded', value: 'Numbered series' },
      { icon: Star, text: 'Rarity tier', value: 'Ultra rare' },
    ],
    description: 'Exemplar visions are company-seeded Genesis pieces with special rarity bonuses that appreciate as the platform grows.',
  },
};

export const CertifiedBadge: React.FC<CertifiedBadgeProps> = ({
  type,
  name,
  similarity,
  matchType = 'exact',
  className = '',
}) => {
  const data = BADGE_DATA[type];
  const Icon = data.icon;
  
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
                Certified visions retain +20% resale value
              </span>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default CertifiedBadge;
