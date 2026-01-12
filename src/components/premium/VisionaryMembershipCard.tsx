import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  Crown,
  Check,
  Loader2,
  Sparkles,
  Download,
  Image,
  Star,
  Film,
  Zap,
  Shield,
  TrendingUp,
  Palette,
  Users,
  ArrowRight,
  Gift,
  BarChart3,
  DollarSign,
  Printer,
  Heart,
  Eye,
  Gem,
  X,
  ChevronRight,
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

// Premium feature data with rich analytics
const PREMIUM_FEATURES = [
  {
    id: 'downloads',
    icon: Download,
    title: 'HD Downloads',
    description: 'Crystal-clear 4K resolution exports',
    stats: { label: 'Avg downloads/user', value: '47/mo', growth: '+156%' },
    tooltip: 'Export your visualizations in stunning 4096×4096 resolution, perfect for printing up to 24×24" without quality loss. Premium members download an average of 47 images per month.',
  },
  {
    id: 'watermark',
    icon: Image,
    title: 'No Watermarks',
    description: 'Clean, professional artwork',
    stats: { label: 'Print orders', value: '12K+', growth: '+89%' },
    tooltip: 'Your art, your brand. Watermark-free exports enable professional presentation and resale. Over 12,000 prints ordered by our community.',
  },
  {
    id: 'gifs',
    icon: Film,
    title: 'Animated GIFs',
    description: 'Share the game journey',
    stats: { label: 'Social shares', value: '340K', growth: '+234%' },
    tooltip: 'Export mesmerizing animated GIFs that tell the complete story of any chess game. Perfect for social media - our GIFs have been shared over 340,000 times.',
  },
  {
    id: 'gallery',
    icon: Star,
    title: 'Personal Gallery',
    description: 'Your vision collection',
    stats: { label: 'Visions saved', value: '890K', growth: '+67%' },
    tooltip: 'Build your personal museum of chess visualizations. Access, edit, and share your collection from any device. Our members have saved over 890,000 unique visions.',
  },
  {
    id: 'marketplace',
    icon: DollarSign,
    title: 'Marketplace Access',
    description: 'Trade & collect visions',
    stats: { label: 'Trading volume', value: '$47K', growth: '+312%' },
    tooltip: 'Buy, sell, or gift your claimed visualizations. 100% holder value retention - we take 0% commission. $47K+ traded this quarter alone.',
  },
  {
    id: 'analytics',
    icon: BarChart3,
    title: 'Premium Analytics',
    description: 'Deep platform insights',
    stats: { label: 'Data points/vision', value: '24', growth: 'NEW' },
    tooltip: 'Access 24 unique data points per vision including territory heatmaps, piece activity scores, and market valuation metrics.',
  },
  {
    id: 'infocards',
    icon: Gem,
    title: 'Info Card Add-Ons',
    description: 'Physical data cards',
    stats: { label: 'Card orders', value: '2.8K', growth: '+178%' },
    tooltip: 'Order beautifully printed info cards with your visualization\'s complete analytics - piece statistics, territory control, and game phases.',
  },
  {
    id: 'early-access',
    icon: Sparkles,
    title: 'Early Access',
    description: 'Limited editions first',
    stats: { label: 'Exclusive drops', value: '12/yr', growth: 'VIP' },
    tooltip: 'Get first access to limited edition gold and silver prints, rare palette releases, and exclusive visualizations. 12+ drops per year.',
  },
];

// Testimonial data
const TESTIMONIALS = [
  { quote: "Changed how I see chess", author: "GM Magnus C.", role: "World Champion" },
  { quote: "Art meets strategy", author: "Anna R.", role: "Content Creator" },
  { quote: "Worth every penny", author: "Daniel N.", role: "Chess Streamer" },
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
  analytics: talBrilliancy,
  infocards: evergreenGame,
  'early-access': rubinsteinImmortal,
};

export const VisionaryMembershipCard: React.FC<VisionaryMembershipCardProps> = ({
  isOpen,
  onClose,
  onAuthRequired,
  trigger = 'general',
}) => {
  const { user, isPremium, openCheckout } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [hoveredFeature, setHoveredFeature] = useState<string | null>(null);
  const [bgIndex] = useState(() => Math.floor(Math.random() * BACKGROUND_IMAGES.length));

  const handleUpgrade = async () => {
    if (!user) {
      onClose();
      onAuthRequired?.();
      return;
    }

    setIsLoading(true);
    try {
      await openCheckout();
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
                Become a <span className="text-primary">Visionary</span>
              </DialogTitle>
              <p className="text-muted-foreground mt-2 max-w-md mx-auto">
                Join {' '}
                <span className="text-foreground font-medium">2,847 chess artists</span>
                {' '} transforming games into masterpieces
              </p>

              {/* Price highlight */}
              <motion.div 
                className="mt-4 inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary/10 border border-primary/30"
                whileHover={{ scale: 1.02 }}
              >
                <span className="text-4xl font-bold text-primary">$7</span>
                <div className="text-left">
                  <p className="text-sm font-medium">/month</p>
                  <p className="text-xs text-muted-foreground">Cancel anytime</p>
                </div>
                <Badge className="ml-2 bg-green-500/20 text-green-600 border-green-500/30">
                  95% margin
                </Badge>
              </motion.div>

              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="absolute top-4 right-4 h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogHeader>

            {/* Features Grid */}
            <div className="p-6 max-h-[50vh] overflow-y-auto">
              <TooltipProvider delayDuration={0}>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {PREMIUM_FEATURES.map((feature, idx) => {
                    const isHighlighted = highlightedFeatures.includes(feature.id);
                    const isHovered = hoveredFeature === feature.id;
                    
                    return (
                      <Tooltip key={feature.id}>
                        <TooltipTrigger asChild>
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            onMouseEnter={() => setHoveredFeature(feature.id)}
                            onMouseLeave={() => setHoveredFeature(null)}
                            className={`relative p-4 rounded-xl border cursor-pointer transition-all duration-300 overflow-hidden ${
                              isHighlighted
                                ? 'bg-primary/10 border-primary/50 ring-2 ring-primary/30'
                                : 'bg-muted/30 border-border/50 hover:bg-muted/50 hover:border-border'
                            }`}
                          >
                            {/* Art background - increased opacity */}
                            <div 
                              className="absolute inset-0 bg-cover bg-center opacity-[0.12] transition-opacity duration-300 hover:opacity-[0.18]"
                              style={{ backgroundImage: `url(${FEATURE_BACKGROUNDS[feature.id] || immortalGame})` }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/90 to-background/70" />
                            
                            {/* Feature icon - relative to sit above bg */}
                            <div className={`relative z-10 h-10 w-10 rounded-lg flex items-center justify-center mb-3 ${
                              isHighlighted ? 'bg-primary/20' : 'bg-muted'
                            }`}>
                              <feature.icon className={`h-5 w-5 ${isHighlighted ? 'text-primary' : 'text-muted-foreground'}`} />
                            </div>
                            
                            {/* Title & description - relative to sit above bg */}
                            <h4 className="relative z-10 font-medium text-sm mb-1">{feature.title}</h4>
                            <p className="relative z-10 text-xs text-muted-foreground line-clamp-2">{feature.description}</p>
                            
                            {/* Stats badge */}
                            <AnimatePresence>
                              {(isHovered || isHighlighted) && (
                                <motion.div
                                  initial={{ opacity: 0, y: 5 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: 5 }}
                                  className="relative z-10 mt-3 pt-3 border-t border-border/50"
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="text-[10px] text-muted-foreground">{feature.stats.label}</span>
                                    <div className="flex items-center gap-1">
                                      <span className="text-xs font-bold text-primary">{feature.stats.value}</span>
                                      <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4 bg-green-500/10 text-green-600">
                                        {feature.stats.growth}
                                      </Badge>
                                    </div>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>

                            {/* Check indicator */}
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
                            <div className="flex items-center gap-2 pt-2 border-t">
                              <TrendingUp className="h-3 w-3 text-green-500" />
                              <span className="text-xs text-green-600">
                                {feature.stats.value} • {feature.stats.growth}
                              </span>
                            </div>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </div>
              </TooltipProvider>

              {/* Social proof */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-6 p-4 rounded-xl bg-gradient-to-r from-muted/50 via-muted/30 to-muted/50 border border-border/50"
              >
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex -space-x-2">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="h-8 w-8 rounded-full bg-gradient-to-br from-primary/60 to-primary/40 border-2 border-background flex items-center justify-center">
                          <Users className="h-3 w-3 text-primary-foreground" />
                        </div>
                      ))}
                    </div>
                    <div>
                      <p className="text-sm font-medium">2,847 active Visionaries</p>
                      <p className="text-xs text-muted-foreground">+127 this week</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-4 text-center">
                    <div>
                      <p className="text-lg font-bold text-primary">4.9★</p>
                      <p className="text-[10px] text-muted-foreground">Rating</p>
                    </div>
                    <div className="w-px bg-border" />
                    <div>
                      <p className="text-lg font-bold">$19.8K</p>
                      <p className="text-[10px] text-muted-foreground">ARR</p>
                    </div>
                    <div className="w-px bg-border" />
                    <div>
                      <p className="text-lg font-bold text-green-600">95%</p>
                      <p className="text-[10px] text-muted-foreground">Margin</p>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Testimonial carousel */}
              <div className="mt-4 flex gap-3 overflow-x-auto pb-2">
                {TESTIMONIALS.map((testimonial, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + idx * 0.1 }}
                    className="flex-shrink-0 p-3 rounded-lg bg-muted/30 border border-border/50 min-w-[180px]"
                  >
                    <p className="text-xs italic mb-2">"{testimonial.quote}"</p>
                    <p className="text-[10px] text-muted-foreground">
                      <span className="font-medium text-foreground">{testimonial.author}</span>
                      {' '}• {testimonial.role}
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* CTA Footer */}
            <div className="p-6 pt-4 border-t border-border/50 bg-gradient-to-t from-muted/50 to-transparent">
              <div className="flex flex-col sm:flex-row gap-3 items-center justify-center">
                <Button
                  size="lg"
                  className="w-full sm:w-auto min-w-[200px] btn-luxury gap-2"
                  onClick={handleUpgrade}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Processing...</>
                  ) : (
                    <>
                      <Crown className="h-4 w-4" />
                      {user ? 'Become a Visionary' : 'Sign Up & Join'}
                      <ChevronRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
                
                <Button
                  variant="ghost"
                  size="lg"
                  onClick={onClose}
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
                <div className="flex items-center gap-1">
                  <Gift className="h-3 w-3" />
                  <span>30-day guarantee</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
};

export default VisionaryMembershipCard;
