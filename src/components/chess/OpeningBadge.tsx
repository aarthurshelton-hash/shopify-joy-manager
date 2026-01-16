/**
 * OpeningBadge - Displays recognized chess opening with marketing flair
 * 
 * Reusable across GameView, Marketplace, OrderPrint, and Play sections
 */

import React from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Crown, Sparkles, Users, History } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DetectedOpening } from '@/lib/chess/openingDetector';

interface OpeningBadgeProps {
  opening: DetectedOpening | null | undefined;
  variant?: 'compact' | 'full' | 'card' | 'inline';
  showEco?: boolean;
  showPlayers?: boolean;
  className?: string;
}

export const OpeningBadge: React.FC<OpeningBadgeProps> = ({
  opening,
  variant = 'compact',
  showEco = true,
  showPlayers = false,
  className = '',
}) => {
  if (!opening) return null;

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'gambit': return 'from-orange-500/20 to-red-500/20 border-orange-500/40 text-orange-400';
      case 'open': return 'from-green-500/20 to-emerald-500/20 border-green-500/40 text-green-400';
      case 'semi-open': return 'from-blue-500/20 to-cyan-500/20 border-blue-500/40 text-blue-400';
      case 'closed': return 'from-purple-500/20 to-indigo-500/20 border-purple-500/40 text-purple-400';
      case 'semi-closed': return 'from-violet-500/20 to-purple-500/20 border-violet-500/40 text-violet-400';
      case 'flank': return 'from-amber-500/20 to-yellow-500/20 border-amber-500/40 text-amber-400';
      case 'irregular': return 'from-pink-500/20 to-rose-500/20 border-pink-500/40 text-pink-400';
      default: return 'from-gray-500/20 to-slate-500/20 border-gray-500/40 text-gray-400';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'gambit': return '⚔️';
      case 'open': return '🔓';
      case 'semi-open': return '🚪';
      case 'closed': return '🔒';
      case 'semi-closed': return '🔐';
      case 'flank': return '🎯';
      case 'irregular': return '🎲';
      default: return '📖';
    }
  };

  // Compact inline badge
  if (variant === 'inline') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge 
              variant="outline" 
              className={`gap-1 text-[10px] cursor-help bg-gradient-to-r ${getCategoryColor(opening.category)} ${className}`}
            >
              <BookOpen className="h-2.5 w-2.5" />
              {opening.name}
              {opening.variation && <span className="opacity-70">: {opening.variation}</span>}
            </Badge>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs">
            <div className="space-y-1">
              <p className="font-medium">{opening.fullName}</p>
              <p className="text-xs text-muted-foreground">{opening.description}</p>
              {opening.famousPlayers && opening.famousPlayers.length > 0 && (
                <p className="text-xs text-primary">
                  Played by: {opening.famousPlayers.slice(0, 3).join(', ')}
                </p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Compact badge with tooltip
  if (variant === 'compact') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md border text-xs font-medium cursor-help
                bg-gradient-to-r ${getCategoryColor(opening.category)} ${className}`}
            >
              <span>{getCategoryIcon(opening.category)}</span>
              <span>{opening.name}</span>
              {showEco && (
                <Badge variant="secondary" className="h-4 text-[9px] px-1 bg-background/50">
                  {opening.eco}
                </Badge>
              )}
            </motion.div>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-sm p-3">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-primary" />
                <span className="font-semibold">{opening.fullName}</span>
              </div>
              <p className="text-xs text-muted-foreground">{opening.description}</p>
              {opening.marketingDescription && (
                <p className="text-xs text-foreground italic">{opening.marketingDescription}</p>
              )}
              {opening.famousPlayers && opening.famousPlayers.length > 0 && (
                <div className="flex items-center gap-1 text-xs text-amber-400">
                  <Users className="h-3 w-3" />
                  <span>{opening.famousPlayers.join(' • ')}</span>
                </div>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Full display with all info
  if (variant === 'full') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`p-4 rounded-xl border bg-gradient-to-br ${getCategoryColor(opening.category)} ${className}`}
      >
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-lg bg-background/20 flex items-center justify-center text-xl">
            {getCategoryIcon(opening.category)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-display font-semibold text-foreground">{opening.name}</h3>
              {opening.variation && (
                <Badge variant="secondary" className="text-[10px]">{opening.variation}</Badge>
              )}
              <Badge variant="outline" className="text-[10px] bg-background/30">{opening.eco}</Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">{opening.description}</p>
            
            {opening.marketingDescription && (
              <p className="text-sm mt-2 text-foreground/90">{opening.marketingDescription}</p>
            )}
            
            {opening.famousPlayers && opening.famousPlayers.length > 0 && (
              <div className="flex items-center gap-2 mt-3">
                <Crown className="h-3.5 w-3.5 text-amber-500" />
                <span className="text-xs text-muted-foreground">
                  Champions: {opening.famousPlayers.join(' • ')}
                </span>
              </div>
            )}
            
            {opening.historicalSignificance && (
              <div className="flex items-start gap-2 mt-2">
                <History className="h-3.5 w-3.5 text-muted-foreground mt-0.5" />
                <span className="text-xs text-muted-foreground">{opening.historicalSignificance}</span>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    );
  }

  // Card variant for marketplace/gallery
  if (variant === 'card') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded border text-[10px] font-medium
          bg-gradient-to-r ${getCategoryColor(opening.category)} ${className}`}
      >
        <BookOpen className="h-2.5 w-2.5" />
        <span className="truncate max-w-[100px]">{opening.name}</span>
        {opening.category === 'gambit' && <Sparkles className="h-2.5 w-2.5" />}
      </motion.div>
    );
  }

  return null;
};

/**
 * OpeningMarketingCard - Full marketing display for famous openings
 * Used in GameView and Encyclopedia
 */
export const OpeningMarketingCard: React.FC<{
  opening: DetectedOpening;
  showValue?: boolean;
}> = ({ opening, showValue = true }) => {
  const valueBonus = opening.category === 'gambit' ? '+15%' : 
                     opening.famousPlayers && opening.famousPlayers.length >= 3 ? '+10%' : '+5%';
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-background to-orange-500/5"
    >
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-amber-500/10 to-transparent rounded-bl-full" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-orange-500/10 to-transparent rounded-tr-full" />
      
      <div className="relative p-4 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
              <BookOpen className="h-4 w-4 text-amber-500" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Book Opening</p>
              <h3 className="font-display font-semibold">{opening.fullName}</h3>
            </div>
          </div>
          {showValue && (
            <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-stone-900 border-0">
              <Sparkles className="h-3 w-3 mr-1" />
              {valueBonus} Value
            </Badge>
          )}
        </div>
        
        {/* Marketing description */}
        {opening.marketingDescription && (
          <p className="text-sm text-foreground/90 leading-relaxed">
            {opening.marketingDescription}
          </p>
        )}
        
        {/* Famous players */}
        {opening.famousPlayers && opening.famousPlayers.length > 0 && (
          <div className="flex items-center gap-2 pt-2 border-t border-border/50">
            <Crown className="h-4 w-4 text-amber-500" />
            <span className="text-xs text-muted-foreground">
              Played by {opening.famousPlayers.join(', ')}
            </span>
          </div>
        )}
        
        {/* Historical significance */}
        {opening.historicalSignificance && (
          <div className="p-2 rounded-lg bg-background/50 border border-border/30">
            <div className="flex items-start gap-2">
              <History className="h-3.5 w-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                {opening.historicalSignificance}
              </p>
            </div>
          </div>
        )}
        
        {/* ECO code badge */}
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[10px]">ECO: {opening.eco}</Badge>
          <Badge variant="secondary" className="text-[10px] capitalize">{opening.category}</Badge>
          <Badge variant="secondary" className="text-[10px]">{opening.moveCount} book moves</Badge>
        </div>
      </div>
    </motion.div>
  );
};

export default OpeningBadge;
