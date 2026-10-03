import React, { useState, useEffect, useRef, forwardRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { recordFunnelEvent } from '@/lib/analytics/membershipFunnel';
import { useABTest } from '@/hooks/useABTest';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import {
  Crown,
  Check,
  Loader2,
  Download,
  Image,
  Star,
  Film,
  Zap,
  Shield,
  TrendingUp,
  BarChart3,
  DollarSign,
  Heart,
  X,
  ChevronRight,
  User,
} from 'lucide-react';
import { toast } from 'sonner';

// Import game art for backgrounds
import immortalGame from '@/assets/games/immortal-game.jpg';
import operaGame from '@/assets/games/opera-game.jpg';
import gameOfCentury from '@/assets/games/game-of-century.jpg';
import fischerSpassky from '@/assets/games/fischer-spassky.jpg';
import kasparovImmortal from '@/assets/games/kasparov-immortal.jpg';
import evergreenGame from '@/assets/games/evergreen-game.jpg';
import talBrilliancy from '@/assets/games/tal-brilliancy.jpg';
import rubinsteinImmortal from '@/assets/games/rubinstein-immortal.jpg';

// Import company logo
import enPensentLogo from '@/assets/en-pensent-logo-new.png';

interface VisionaryMembershipCardProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthRequired?: () => void;
  trigger?: 'download' | 'save' | 'general' | 'gif' | 'analytics' | 'marketplace' | 'infocard';
}

// Premium feature data — honest descriptions only, no invented stats
const PREMIUM_FEATURES = [
  {
    id: 'downloads',
    icon: Download,
    title: 'HD Downloads',
    description: 'Crystal-clear 4K resolution exports',
    tooltip: 'Export your visualizations in stunning 4096×4096 resolution — sharp enough for large-format printing.',
  },
  {
    id: 'watermark',
    icon: Image,
    title: 'No Watermarks',
    description: 'Clean, professional artwork',
    tooltip: 'Your art, your brand. Watermark-free exports for professional presentation and resale.',
  },
  {
    id: 'gifs',
    icon: Film,
    title: 'Animated GIFs',
    description: 'Share the game journey',
    tooltip: 'Export animated GIFs that tell the complete story of any chess game — perfect for social media.',
  },
  {
    id: 'gallery',
    icon: Star,
    title: 'Personal Gallery',
    description: '7-day grace period protection',
    tooltip: 'Build your personal museum of chess visualizations. If your subscription lapses, you get a 7-day grace period before visions become claimable.',
  },
  {
    id: 'marketplace',
    icon: DollarSign,
    title: 'Marketplace Access',
    description: '0% commission, 3/day transfer limit',
    tooltip: 'Buy, sell, or gift your claimed visualizations. 100% holder value retention — we take 0% commission.',
  },
  {
    id: 'royalties',
    icon: Heart,
    title: '20% Print Royalties',
    description: 'Earn from your collection',
    tooltip: 'When anyone orders a print of your vision, you earn 20% of the order value as royalties.',
  },
  {
    id: 'analytics',
    icon: BarChart3,
    title: 'Premium Analytics',
    description: 'Deep platform insights',
    tooltip: 'Access extended data per vision including territory heatmaps, piece activity scores, and valuation metrics.',
  },
  {
    id: 'history-export',
    icon: TrendingUp,
    title: 'Full History Export',
    description: '250-game archetype timelines',
    tooltip: 'Scout any opponent — download their complete archetype/outcome history as CSV. Up to 250 games per player.',
  },
];

// Background images for visual appeal - expanded collection
const BACKGROUND_IMAGES = [immortalGame, operaGame, gameOfCentury, fischerSpassky, kasparovImmortal, evergreenGame, talBrilliancy, rubinsteinImmortal];

// Feature-specific background images
const FEATURE_BACKGROUNDS: Record<string, string> = {
  downloads: immortalGame,
  watermark: operaGame,
  gifs: kasparovImmortal,
  gallery: gameOfCentury,
  marketplace: fischerSpassky,
  royalties: rubinsteinImmortal,
  analytics: talBrilliancy,
  infocards: evergreenGame,
};

// FeatureCard component for grid/carousel layouts
const FeatureCard: React.FC<{
  feature: typeof PREMIUM_FEATURES[0];
  isHighlighted: boolean;
  isHovered: boolean;
  onHover: (id: string) => void;
  onLeave: () => void;
  idx: number;
}> = ({ feature, isHighlighted, isHovered, onHover, onLeave, idx }) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: idx * 0.05 }}
        onMouseEnter={() => onHover(feature.id)}
        onMouseLeave={onLeave}
        className={`relative p-4 rounded-xl border cursor-pointer transition-all duration-300 overflow-hidden ${
          isHighlighted
            ? 'bg-primary/10 border-primary/50 ring-2 ring-primary/30'
            : 'bg-muted/30 border-border/50 hover:bg-muted/50 hover:border-border'
        }`}
      >
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-[0.18] transition-opacity duration-300 hover:opacity-[0.25]"
          style={{ backgroundImage: `url(${FEATURE_BACKGROUNDS[feature.id] || immortalGame})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/90 to-background/70" />
        
        <div className={`relative z-10 h-10 w-10 rounded-lg flex items-center justify-center mb-3 ${
          isHighlighted ? 'bg-primary/20' : 'bg-muted'
        }`}>
          <feature.icon className={`h-5 w-5 ${isHighlighted ? 'text-primary' : 'text-muted-foreground'}`} />
        </div>
        
        <h4 className="relative z-10 font-medium text-sm mb-1">{feature.title}</h4>
        <p className="relative z-10 text-xs text-muted-foreground line-clamp-2">{feature.description}</p>
        
        <AnimatePresence>
          {(isHovered || isHighlighted) && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              className="relative z-10 mt-3 pt-3 border-t border-border/50"
            >
              <p className="text-[11px] text-muted-foreground leading-snug">
                {feature.tooltip}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className={`absolute top-2 right-2 z-10 h-5 w-5 rounded-full flex items-center justify-center ${
          isHighlighted ? 'bg-primary' : 'bg-muted'
        }`}>
          <Check className={`h-3 w-3 ${isHighlighted ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
        </div>
      </motion.div>
    </TooltipTrigger>
    <TooltipContent side="top" className="max-w-xs p-4">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <feature.icon className="h-4 w-4 text-primary" />
          <span className="font-medium">{feature.title}</span>
        </div>
        <p className="text-sm text-muted-foreground">{feature.tooltip}</p>
      </div>
    </TooltipContent>
  </Tooltip>
);

export const VisionaryMembershipCard = forwardRef<HTMLDivElement, VisionaryMembershipCardProps>(({
  isOpen,
  onClose,
  onAuthRequired,
  trigger = 'general',
}, ref) => {
  const { user, isPremium, isFreeAccount, openCheckout } = useAuth();
  const { variants, recordImpressions, recordConversions } = useABTest();
  const [isLoading, setIsLoading] = useState(false);
  const [plan, setPlan] = useState<'monthly' | 'annual'>('monthly');
  const [hoveredFeature, setHoveredFeature] = useState<string | null>(null);
  const [bgIndex] = useState(() => Math.floor(Math.random() * BACKGROUND_IMAGES.length));
  const modalOpenTime = useRef<number>(0);
  const featuresViewed = useRef<Set<string>>(new Set());
  const hasRecordedView = useRef(false);

  // Track modal view when opened
  useEffect(() => {
    if (isOpen && !hasRecordedView.current) {
      modalOpenTime.current = Date.now();
      hasRecordedView.current = true;
      recordFunnelEvent('modal_view', { trigger_source: trigger });
      recordImpressions(); // Record A/B test impressions
    }
    
    if (!isOpen) {
      hasRecordedView.current = false;
      featuresViewed.current.clear();
    }
  }, [isOpen, trigger, recordImpressions]);

  // Track feature hovers
  const handleFeatureHover = (featureId: string) => {
    setHoveredFeature(featureId);
    if (!featuresViewed.current.has(featureId)) {
      featuresViewed.current.add(featureId);
      recordFunnelEvent('feature_hover', { 
        trigger_source: trigger, 
        feature_id: featureId 
      });
    }
  };

  const handleDismiss = () => {
    const timeOnModal = Date.now() - modalOpenTime.current;
    recordFunnelEvent('modal_dismiss', { 
      trigger_source: trigger,
      time_on_modal_ms: timeOnModal,
      features_viewed: Array.from(featuresViewed.current),
    });
    onClose();
  };

  const handleUpgrade = async () => {
    const timeOnModal = Date.now() - modalOpenTime.current;
    
    if (!user) {
      // No account - remember checkout intent so useAuth can resume it
      // automatically once the user finishes signing up/in.
      localStorage.setItem('ep_pending_checkout', JSON.stringify({ plan, ts: Date.now() }));
      recordFunnelEvent('signup_started', { 
        trigger_source: trigger,
        time_on_modal_ms: timeOnModal,
        features_viewed: Array.from(featuresViewed.current),
      });
      onClose();
      onAuthRequired?.();
      return;
    }

    // User has account (free or upgrading) - go to checkout
    const eventType = isFreeAccount ? 'free_to_premium' : 'checkout_started';
    recordFunnelEvent(eventType, { 
      trigger_source: trigger,
      time_on_modal_ms: timeOnModal,
      features_viewed: Array.from(featuresViewed.current),
      account_type: isFreeAccount ? 'free' : 'existing',
    });
    recordConversions(); // Record A/B test conversions

    setIsLoading(true);
    try {
      await openCheckout(plan);
      onClose();
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Failed to open checkout');
    } finally {
      setIsLoading(false);
    }
  };

  const triggerHighlights: Record<string, string[]> = {
    download: ['downloads', 'watermark'],
    save: ['gallery', 'marketplace'],
    gif: ['gifs', 'downloads'],
    analytics: ['analytics', 'infocards'],
    marketplace: ['marketplace', 'gallery'],
    infocard: ['infocards', 'analytics'],
    general: [],
  };

  const highlightedFeatures = triggerHighlights[trigger] || [];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-hidden p-0 gap-0">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="relative"
        >
          {/* Background art layer */}
          <div className="absolute inset-0 overflow-hidden">
            <motion.img
              src={BACKGROUND_IMAGES[bgIndex]}
              alt=""
              className="w-full h-full object-cover"
              initial={{ scale: 1.1, opacity: 0 }}
              animate={{ scale: 1, opacity: 0.15 }}
              transition={{ duration: 1.5 }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/95 to-background" />
          </div>

          {/* Content */}
          <div className="relative z-10">
            {/* Header */}
            <DialogHeader className="p-6 pb-4 text-center border-b border-border/50">
              <div className="flex justify-center mb-4">
                <motion.div
                  className="relative rounded-full"
                  animate={{ 
                    boxShadow: ['0 0 20px hsl(var(--primary)/0.3)', '0 0 40px hsl(var(--primary)/0.5)', '0 0 20px hsl(var(--primary)/0.3)']
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  {/* Company logo with gold ring - circular with no square edges */}
                  <div className="h-20 w-20 rounded-full bg-gradient-to-br from-primary via-primary/80 to-primary/60 p-1 overflow-hidden">
                    <img 
                      src={enPensentLogo} 
                      alt="En Pensent" 
                      className="h-full w-full rounded-full object-cover"
                    />
                  </div>
                  <motion.div
                    className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-green-500 flex items-center justify-center"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <Zap className="h-3 w-3 text-white" />
                  </motion.div>
                </motion.div>
              </div>
              
              <DialogTitle className="font-display text-3xl">
                {variants.headline.includes('Visionary') ? (
                  <>Become a <span className="text-primary">Visionary</span></>
                ) : (
                  <span className="text-primary">{variants.headline}</span>
                )}
              </DialogTitle>
              <p className="text-muted-foreground mt-2 max-w-md mx-auto">
                Every game deserves to be seen at full resolution —
                and every opponent deserves to be scouted.
              </p>

              {/* Plan toggle — monthly / annual */}
              <div className="mt-4 inline-flex rounded-full border border-border/60 overflow-hidden text-sm">
                <button
                  type="button"
                  onClick={() => setPlan('monthly')}
                  className={`px-4 py-2 transition-colors ${
                    plan === 'monthly' ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground'
                  }`}
                >
                  Monthly
                </button>
                <button
                  type="button"
                  onClick={() => setPlan('annual')}
                  className={`px-4 py-2 transition-colors flex items-center gap-1.5 ${
                    plan === 'annual' ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground'
                  }`}
                >
                  Annual
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    plan === 'annual' ? 'bg-primary-foreground/20' : 'bg-green-500/20 text-green-600'
                  }`}>
                    2 mo free
                  </span>
                </button>
              </div>

              <motion.div 
                className="mt-3 inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary/10 border border-primary/30"
                whileHover={{ scale: 1.02 }}
              >
                <span className="text-4xl font-bold text-primary">
                  {plan === 'annual' ? '$59.99' : '$6.99'}
                </span>
                <div className="text-left">
                  <p className="text-sm font-medium">
                    {plan === 'annual' ? 'per year' : 'per month'}
                  </p>
                  <p className="text-xs text-muted-foreground">Cancel anytime</p>
                </div>
              </motion.div>

              <Button
                variant="ghost"
                size="icon"
                onClick={handleDismiss}
                className="absolute top-4 right-4 h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogHeader>

            {/* Features - A/B tested layouts */}
            <div className="p-6 max-h-[50vh] overflow-y-auto">
              <TooltipProvider delayDuration={0}>
                {variants.layout === 'carousel' ? (
                  <Carousel className="w-full">
                    <CarouselContent>
                      {PREMIUM_FEATURES.map((feature, idx) => {
                        const isHighlighted = highlightedFeatures.includes(feature.id);
                        return (
                          <CarouselItem key={feature.id} className="md:basis-1/2 lg:basis-1/3">
                            <FeatureCard
                              feature={feature}
                              isHighlighted={isHighlighted}
                              isHovered={hoveredFeature === feature.id}
                              onHover={handleFeatureHover}
                              onLeave={() => setHoveredFeature(null)}
                              idx={idx}
                            />
                          </CarouselItem>
                        );
                      })}
                    </CarouselContent>
                    <CarouselPrevious />
                    <CarouselNext />
                  </Carousel>
                ) : variants.layout === 'list' ? (
                  <div className="space-y-2">
                    {PREMIUM_FEATURES.map((feature, idx) => {
                      const isHighlighted = highlightedFeatures.includes(feature.id);
                      return (
                        <motion.div
                          key={feature.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          onMouseEnter={() => handleFeatureHover(feature.id)}
                          onMouseLeave={() => setHoveredFeature(null)}
                          className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                            isHighlighted
                              ? 'bg-primary/10 border-primary/50'
                              : 'bg-muted/30 border-border/50 hover:bg-muted/50'
                          }`}
                        >
                          <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${
                            isHighlighted ? 'bg-primary/20' : 'bg-muted'
                          }`}>
                            <feature.icon className={`h-4 w-4 ${isHighlighted ? 'text-primary' : 'text-muted-foreground'}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm">{feature.title}</h4>
                            <p className="text-xs text-muted-foreground truncate">{feature.description}</p>
                          </div>
                          <Check className="h-4 w-4 text-primary shrink-0" />
                        </motion.div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {PREMIUM_FEATURES.map((feature, idx) => {
                      const isHighlighted = highlightedFeatures.includes(feature.id);
                      return (
                        <FeatureCard
                          key={feature.id}
                          feature={feature}
                          isHighlighted={isHighlighted}
                          isHovered={hoveredFeature === feature.id}
                          onHover={handleFeatureHover}
                          onLeave={() => setHoveredFeature(null)}
                          idx={idx}
                        />
                      );
                    })}
                  </div>
                )}
              </TooltipProvider>

              {/* Honest value line — no fabricated counts */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-6 p-4 rounded-xl bg-gradient-to-r from-muted/50 via-muted/30 to-muted/50 border border-border/50"
              >
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Check className="h-4 w-4 text-primary shrink-0" />
                  <span>Everything unlocked. Cancel anytime from your account — no lock-in.</span>
                </div>
              </motion.div>
            </div>

            {/* CTA Footer */}
            <div className="p-6 pt-4 border-t border-border/50 bg-gradient-to-t from-muted/50 to-transparent">
              {/* Free account callout */}
              {isFreeAccount && (
                <div className="mb-4 p-3 rounded-lg bg-primary/5 border border-primary/20 text-center">
                  <p className="text-sm text-primary font-medium">
                    Ready to unlock your full potential?
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Your free account is set up • One click to Premium
                  </p>
                </div>
              )}
              
              <div className="flex flex-col sm:flex-row gap-3 items-center justify-center">
                <Button
                  size="lg"
                  className="w-full sm:w-auto min-w-[200px] btn-luxury gap-2"
                  onClick={handleUpgrade}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Processing...</>
                  ) : isFreeAccount ? (
                    <>
                      <Crown className="h-4 w-4" />
                      Upgrade — {plan === 'annual' ? '$59.99/yr' : '$6.99/mo'}
                      <ChevronRight className="h-4 w-4" />
                    </>
                  ) : user ? (
                    <>
                      <Crown className="h-4 w-4" />
                      {variants.ctaText}
                      <ChevronRight className="h-4 w-4" />
                    </>
                  ) : (
                    <>
                      <User className="h-4 w-4" />
                      {variants.ctaSignInText}
                      <ChevronRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
                
                <Button
                  variant="ghost"
                  size="lg"
                  onClick={handleDismiss}
                  className="w-full sm:w-auto"
                >
                  Maybe Later
                </Button>
              </div>
              
              <div className="flex items-center justify-center gap-4 mt-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Shield className="h-3 w-3" />
                  <span>Secure via Stripe</span>
                </div>
                <div className="flex items-center gap-1">
                  <Heart className="h-3 w-3" />
                  <span>Cancel anytime</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
});

VisionaryMembershipCard.displayName = 'VisionaryMembershipCard';

export default VisionaryMembershipCard;
