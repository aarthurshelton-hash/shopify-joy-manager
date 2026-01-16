import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, Trophy, Crown } from 'lucide-react';
import { getRatingTier } from '@/lib/chess/eloCalculator';
import { useEnPensentPatterns } from '@/hooks/useEnPensentPatterns';
import { TemporalSignature } from '@/lib/pensent-core/types/core';

interface EloChangeAnimationProps {
  oldRating: number;
  newRating: number;
  isWin: boolean;
  isDraw: boolean;
  show: boolean;
  signature?: TemporalSignature | null;
}

export const EloChangeAnimation = ({
  oldRating,
  newRating,
  isWin,
  isDraw,
  show,
  signature,
}: EloChangeAnimationProps) => {
  const [displayedRating, setDisplayedRating] = useState(oldRating);
  const [showChange, setShowChange] = useState(false);
  const [animationComplete, setAnimationComplete] = useState(false);
  
  const pattern = useEnPensentPatterns(signature);
  
  const change = newRating - oldRating;
  const oldTier = getRatingTier(oldRating);
  const newTier = getRatingTier(newRating);
  const tierChanged = oldTier.name !== newTier.name;

  useEffect(() => {
    if (!show) {
      setDisplayedRating(oldRating);
      setShowChange(false);
      setAnimationComplete(false);
      return;
    }

    // Start showing the change indicator after a brief delay
    const changeTimer = setTimeout(() => setShowChange(true), 500);
    
    // Animate the rating counter
    const duration = 1500; // ms
    const steps = 30;
    const stepDuration = duration / steps;
    const ratingDiff = newRating - oldRating;
    let currentStep = 0;

    const interval = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;
      // Easing function for smooth animation
      const easeOutCubic = 1 - Math.pow(1 - progress, 3);
      const currentRating = Math.round(oldRating + ratingDiff * easeOutCubic);
      setDisplayedRating(currentRating);

      if (currentStep >= steps) {
        clearInterval(interval);
        setDisplayedRating(newRating);
        setAnimationComplete(true);
      }
    }, stepDuration);

    return () => {
      clearTimeout(changeTimer);
      clearInterval(interval);
    };
  }, [show, oldRating, newRating]);

  const getChangeColor = () => {
    if (change > 0) return 'text-green-500';
    if (change < 0) return 'text-red-500';
    return 'text-muted-foreground';
  };

  const getChangeIcon = () => {
    if (change > 0) return <TrendingUp className="h-6 w-6" />;
    if (change < 0) return <TrendingDown className="h-6 w-6" />;
    return <Minus className="h-6 w-6" />;
  };

  const getResultIcon = () => {
    if (isWin) return <Trophy className="h-8 w-8 text-yellow-500" />;
    if (isDraw) return <Minus className="h-8 w-8 text-blue-400" />;
    return null;
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: -20 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="p-6 rounded-xl border border-primary/30 bg-gradient-to-br from-primary/10 via-card to-primary/5 backdrop-blur-sm relative overflow-hidden"
          style={{
            borderColor: signature ? `${pattern.dominantColor}40` : undefined,
            boxShadow: signature ? `0 0 ${30 * pattern.intensity}px ${pattern.dominantColor}30` : undefined
          }}
        >
          {/* En Pensent background glow */}
          {signature && (
            <motion.div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: `radial-gradient(circle at 50% 50%, ${pattern.dominantColor}15, transparent 70%)`
              }}
              animate={{
                opacity: [0.3, 0.6, 0.3],
                scale: [1, 1.1, 1]
              }}
              transition={{ duration: 3, repeat: Infinity }}
            />
          )}
          {/* Result Header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center justify-center gap-3 mb-6"
          >
            {getResultIcon()}
            <h3 className="text-xl font-display font-bold uppercase tracking-wider">
              {isWin ? 'Victory!' : isDraw ? 'Draw' : 'Defeat'}
            </h3>
          </motion.div>

          {/* Rating Display */}
          <div className="flex items-center justify-center gap-8">
            {/* Current/Animated Rating */}
            <motion.div
              className="text-center"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <p className="text-xs text-muted-foreground font-display uppercase tracking-wider mb-2">
                Rating
              </p>
              <motion.div
                className={`text-5xl font-bold font-display bg-gradient-to-r ${getRatingTier(displayedRating).color} bg-clip-text text-transparent`}
                key={displayedRating}
              >
                {displayedRating}
              </motion.div>
              <motion.p
                className={`text-sm font-display mt-2 uppercase tracking-wider ${
                  tierChanged && animationComplete ? 'text-primary' : 'text-muted-foreground'
                }`}
                animate={tierChanged && animationComplete ? { scale: [1, 1.1, 1] } : {}}
                transition={{ duration: 0.3 }}
              >
                {getRatingTier(displayedRating).name}
              </motion.p>
            </motion.div>

            {/* Change Indicator */}
            <AnimatePresence>
              {showChange && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border/50 ${getChangeColor()}`}
                >
                  {getChangeIcon()}
                  <span className="text-2xl font-bold font-mono">
                    {change > 0 ? '+' : ''}{change}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Tier Change Celebration */}
          <AnimatePresence>
            {tierChanged && animationComplete && (
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ delay: 0.5, type: 'spring', stiffness: 200 }}
                className="mt-6 text-center"
              >
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary/20 to-primary/10 border border-primary/30">
                  <Crown className="h-5 w-5 text-primary" />
                  <span className="font-display font-bold uppercase tracking-wider text-primary">
                    {change > 0 ? 'Rank Up!' : 'Rank Down'}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-2 font-serif">
                  {oldTier.name} → {newTier.name}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Particles for wins */}
          {isWin && animationComplete && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl"
            >
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 rounded-full bg-primary/60"
                  initial={{
                    x: '50%',
                    y: '50%',
                    scale: 0,
                  }}
                  animate={{
                    x: `${20 + Math.random() * 60}%`,
                    y: `${10 + Math.random() * 80}%`,
                    scale: [0, 1, 0],
                    opacity: [0, 1, 0],
                  }}
                  transition={{
                    duration: 1.5,
                    delay: 0.8 + i * 0.1,
                    ease: 'easeOut',
                  }}
                />
              ))}
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
