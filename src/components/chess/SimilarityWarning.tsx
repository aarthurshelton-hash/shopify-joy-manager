import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, ShieldAlert, ShieldCheck, Crown, Lock } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface SimilarityWarningProps {
  level: 'none' | 'low' | 'medium' | 'high' | 'blocked';
  similarity: number;
  ownerName?: string;
  isChecking?: boolean;
}

export const SimilarityWarning: React.FC<SimilarityWarningProps> = ({
  level,
  similarity,
  ownerName,
  isChecking = false,
}) => {
  if (isChecking) {
    return (
      <div className="p-3 rounded-lg border border-border/50 bg-card/50">
        <div className="flex items-center gap-2 text-muted-foreground text-xs">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
          >
            <ShieldCheck className="h-4 w-4" />
          </motion.div>
          <span className="font-display uppercase tracking-wide">Checking uniqueness...</span>
        </div>
      </div>
    );
  }

  if (level === 'none') {
    return (
      <div className="p-3 rounded-lg border border-emerald-500/30 bg-emerald-500/5">
        <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-xs">
          <ShieldCheck className="h-4 w-4" />
          <span className="font-display uppercase tracking-wide">Unique Design</span>
        </div>
        <p className="text-[10px] text-muted-foreground mt-1">
          This design is original and can be saved to your gallery
        </p>
      </div>
    );
  }

  const configs = {
    low: {
      icon: ShieldCheck,
      border: 'border-blue-500/30',
      bg: 'bg-blue-500/5',
      text: 'text-blue-600 dark:text-blue-400',
      title: 'Mostly Unique',
      description: `${Math.round(similarity)}% similar to existing visions`,
      progressColor: 'bg-blue-500',
    },
    medium: {
      icon: AlertTriangle,
      border: 'border-amber-500/30',
      bg: 'bg-amber-500/5',
      text: 'text-amber-600 dark:text-amber-400',
      title: 'Getting Closer',
      description: ownerName 
        ? `${Math.round(similarity)}% similar to ${ownerName}'s vision`
        : `${Math.round(similarity)}% similar to an existing vision`,
      progressColor: 'bg-amber-500',
    },
    high: {
      icon: ShieldAlert,
      border: 'border-orange-500/30',
      bg: 'bg-orange-500/5',
      text: 'text-orange-600 dark:text-orange-400',
      title: 'High Similarity',
      description: ownerName 
        ? `${Math.round(similarity)}% similar to ${ownerName}'s vision - consider more changes`
        : `${Math.round(similarity)}% similar - add more unique elements`,
      progressColor: 'bg-orange-500',
    },
    blocked: {
      icon: Lock,
      border: 'border-destructive/30',
      bg: 'bg-destructive/5',
      text: 'text-destructive',
      title: 'Vision Owned',
      description: ownerName 
        ? `This design is too similar to ${ownerName}'s vision`
        : 'This design is too similar to an existing vision',
      progressColor: 'bg-destructive',
    },
  };

  const config = configs[level];
  const Icon = config.icon;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={level}
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 5 }}
        className={`p-3 rounded-lg border ${config.border} ${config.bg}`}
      >
        <div className={`flex items-center gap-2 ${config.text} text-xs`}>
          <Icon className="h-4 w-4" />
          <span className="font-display uppercase tracking-wide">{config.title}</span>
          <span className="ml-auto font-mono text-[10px]">{Math.round(similarity)}%</span>
        </div>
        
        <div className="mt-2">
          <div className="h-1.5 rounded-full bg-background/50 overflow-hidden">
            <motion.div
              className={`h-full ${config.progressColor}`}
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(similarity, 100)}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>
        </div>
        
        <p className="text-[10px] text-muted-foreground mt-2">
          {config.description}
        </p>

        {level === 'blocked' && (
          <div className="mt-2 pt-2 border-t border-border/30">
            <p className="text-[9px] text-muted-foreground">
              You can still download this design or take screenshots, but saving to your gallery is blocked.
            </p>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};
