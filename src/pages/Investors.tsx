import { useState, useMemo, useEffect } from 'react';
import { Header } from '@/components/shop/Header';
import { Footer } from '@/components/shop/Footer';
import { Crown, TrendingUp, Globe, Zap, Target, Download, ChevronRight, FileText, Presentation, Repeat, Users, Quote, Sparkles, ChevronDown, Star, Database, BarChart3 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { TestimonialSubmissionForm } from '@/components/testimonials/TestimonialSubmissionForm';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useRandomGameArt } from '@/hooks/useRandomGameArt';

type ModalType = 'market' | 'technology' | 'vision' | 'brand' | 'data' | null;

interface Testimonial {
  quote: string;
  name: string;
  role: string;
  featured?: boolean;
  rating?: number;
}

const allTestimonials: Testimonial[] = [
  // Original testimonials with ratings
  {
    quote: "I've been playing chess for 20 years and this is the first time I've been able to truly visualize the beauty of my games. The HD downloads are stunning—I have three prints framed in my office now.",
    name: "Marcus T.",
    role: "FIDE Rated Player, Premium Member since 2024",
    rating: 5
  },
  {
    quote: "The personal gallery feature is a game-changer. I can save every tournament game and revisit them as art. It's like having a visual diary of my chess journey.",
    name: "Elena K.",
    role: "Tournament Director, Premium Member since 2024",
    rating: 5
  },
  {
    quote: "Worth every penny. The watermark-free exports look professional enough to gift. I created visualizations of my grandfather's recorded games—priceless family heirlooms now.",
    name: "David R.",
    role: "Chess Coach, Premium Member since 2024",
    rating: 5
  },
  {
    quote: "I run a chess club with 200 members. We now offer En Pensent visualizations as prizes for our monthly tournaments. The kids absolutely love seeing their games transformed into art.",
    name: "Sarah M.",
    role: "Chess Club President, Premium Member since 2024",
    featured: true,
    rating: 5
  },
  {
    quote: "As a grandmaster, I've analyzed thousands of games. En Pensent gives me a completely new perspective—seeing the flow and rhythm of a game as visual art is genuinely profound.",
    name: "Viktor A.",
    role: "International Grandmaster, Premium Member since 2024",
    rating: 5
  },
  {
    quote: "Bought premium specifically for the GIF exports. Now I can share animated replays of my best games on social media. The engagement has been incredible.",
    name: "James L.",
    role: "Chess Content Creator, Premium Member since 2024",
    rating: 5
  },
  {
    quote: "My students are so much more engaged when they can see their games as art. It makes losing feel less painful and winning even more memorable.",
    name: "Patricia H.",
    role: "Chess Instructor, Premium Member since 2024",
    featured: true,
    rating: 5
  },
  {
    quote: "The quality of the prints exceeded my expectations. Museum-quality framing on my first tournament win—it's the centerpiece of my game room.",
    name: "Robert K.",
    role: "Amateur Tournament Player, Premium Member since 2024",
    rating: 5
  },
  {
    quote: "I gift En Pensent visualizations to every friend who beats me in a memorable game. It's become my signature move. They love it more than any trophy.",
    name: "Michelle W.",
    role: "Casual Player, Premium Member since 2024",
    rating: 5
  },
  {
    quote: "The custom palette feature lets me match my club's colors. Every visualization feels uniquely ours. Absolute attention to detail.",
    name: "Thomas B.",
    role: "College Chess Team Captain, Premium Member since 2024",
    rating: 5
  },
  {
    quote: "At 72, I've been playing chess my whole life. Seeing my favorite games visualized this way—it's like seeing old friends in a new light. Beautiful work.",
    name: "Harold J.",
    role: "Lifelong Chess Enthusiast, Premium Member since 2024",
    featured: true,
    rating: 5
  },
  {
    quote: "The subscription pays for itself. I've ordered six prints in the last two months alone. The priority shipping for premium members is a nice touch too.",
    name: "Amanda C.",
    role: "Art Collector & Chess Fan, Premium Member since 2024",
    rating: 5
  }
];

// Fisher-Yates shuffle algorithm
const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// Testimonial card component with animations
const TestimonialCard = ({ 
  testimonial, 
  index 
}: { 
  testimonial: Testimonial; 
  index: number;
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ 
        duration: 0.5, 
        delay: index * 0.1,
        ease: [0.22, 1, 0.36, 1]
      }}
      whileHover={{ 
        scale: 1.02, 
        y: -4,
        transition: { duration: 0.2 }
      }}
      className={`group relative p-6 rounded-xl overflow-hidden ${
        testimonial.featured 
          ? 'border-2 border-primary/40 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent shadow-lg shadow-primary/10' 
          : 'border border-border/50 bg-gradient-to-br from-card/80 to-card/40 hover:border-primary/30'
      }`}
    >
      {/* Animated background glow for featured */}
      {testimonial.featured && (
        <motion.div 
          className="absolute inset-0 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5"
          animate={{ 
            backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
          }}
          transition={{ 
            duration: 5, 
            repeat: Infinity, 
            ease: 'linear' 
          }}
          style={{ backgroundSize: '200% 100%' }}
        />
      )}
      
      {/* Sparkle effect on hover */}
      <motion.div
        className="absolute top-3 right-3 text-primary/0 group-hover:text-primary/60"
        initial={{ rotate: 0 }}
        whileHover={{ rotate: 180 }}
        transition={{ duration: 0.5 }}
      >
        <Sparkles className="h-4 w-4" />
      </motion.div>

      <div className="relative flex items-start gap-4">
        {/* Avatar with animated ring */}
        <motion.div 
          className={`relative w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
            testimonial.featured 
              ? 'bg-gradient-to-br from-primary/30 to-primary/10' 
              : 'bg-primary/10'
          }`}
          whileHover={{ scale: 1.1 }}
          transition={{ type: 'spring', stiffness: 400 }}
        >
          {testimonial.featured && (
            <motion.div 
              className="absolute inset-0 rounded-full border-2 border-primary/40"
              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          )}
          <Crown className={`h-5 w-5 ${testimonial.featured ? 'text-primary' : 'text-primary/70'}`} />
        </motion.div>

        <div className="flex-1 space-y-3">
          {/* Star rating */}
          {testimonial.rating && (
            <div className="flex gap-0.5">
              {Array.from({ length: testimonial.rating }).map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 + i * 0.05 + 0.2 }}
                >
                  <Star className="h-3.5 w-3.5 fill-primary text-primary" />
                </motion.div>
              ))}
            </div>
          )}

          {/* Quote with animated quotation mark */}
          <div className="relative">
            <motion.span 
              className="absolute -left-2 -top-2 text-4xl text-primary/20 font-serif"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 + 0.3 }}
            >
              "
            </motion.span>
            <p className="text-sm text-muted-foreground font-serif italic leading-relaxed pl-4">
              {testimonial.quote}
            </p>
          </div>

          {/* Author info with animated underline */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: index * 0.1 + 0.4 }}
            className="pt-2 border-t border-border/30"
          >
            <p className="font-display text-sm font-bold text-foreground">{testimonial.name}</p>
            <p className="text-xs text-muted-foreground">{testimonial.role}</p>
          </motion.div>
        </div>
      </div>

      {/* Featured badge */}
      {testimonial.featured && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 + 0.5 }}
          className="absolute top-0 right-0 px-3 py-1 bg-primary text-primary-foreground text-xs font-display uppercase tracking-wider rounded-bl-lg"
        >
          Featured
        </motion.div>
      )}
    </motion.div>
  );
};

const Investors = () => {
  const { user } = useAuth();
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [visibleCount, setVisibleCount] = useState(4);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const backgroundImages = useRandomGameArt(8);
  
  // Check premium status
  useEffect(() => {
    const checkPremiumStatus = async () => {
      if (!user) {
        setIsPremium(false);
        return;
      }
      
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setIsPremium(false);
          return;
        }
        
        const response = await supabase.functions.invoke('check-subscription', {
          headers: {
            Authorization: `Bearer ${session.access_token}`
          }
        });
        
        if (response.data?.subscribed) {
          setIsPremium(true);
        }
      } catch (error) {
        console.error('Error checking premium status:', error);
      }
    };
    
    checkPremiumStatus();
  }, [user]);
  
  // Shuffle testimonials once on component mount
  const shuffledTestimonials = useMemo(() => {
    return shuffleArray(allTestimonials);
  }, []);

  const visibleTestimonials = shuffledTestimonials.slice(0, visibleCount);
  const hasMoreTestimonials = visibleCount < shuffledTestimonials.length;
  const remainingCount = shuffledTestimonials.length - visibleCount;

  const handleLoadMore = () => {
    setIsLoadingMore(true);
    // Small delay for visual effect
    setTimeout(() => {
      setVisibleCount(prev => Math.min(prev + 4, shuffledTestimonials.length));
      setIsLoadingMore(false);
    }, 300);
  };

  const MetricCard = ({ 
    icon: Icon, 
    title, 
    description, 
    cta, 
    onClick,
    backgroundImage
  }: { 
    icon: typeof Globe; 
    title: string; 
    description: string; 
    cta: string;
    onClick: () => void;
    backgroundImage?: string;
  }) => (
    <button 
      onClick={onClick}
      className="relative p-6 rounded-lg border border-border/50 bg-card/50 space-y-3 text-left transition-all hover:border-primary/50 hover:bg-card/80 group cursor-pointer overflow-hidden"
    >
      {backgroundImage && (
        <div 
          className="absolute inset-0 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity bg-cover bg-center"
          style={{ backgroundImage: `url(${backgroundImage})` }}
        />
      )}
      <div className="relative z-10">
        <div className="flex items-start justify-between">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Icon className="h-6 w-6 text-primary" />
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
        </div>
        <h3 className="font-display font-bold uppercase tracking-wide mt-3">{title}</h3>
        <p className="text-sm text-muted-foreground font-serif mt-2">{description}</p>
        <span className="text-xs text-primary font-medium uppercase tracking-wide mt-2 inline-block">{cta} →</span>
      </div>
    </button>
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto space-y-12">
          {/* Hero */}
          <div className="text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-display uppercase tracking-widest">
              <TrendingUp className="h-4 w-4" />
              Investor Relations
            </div>
            <h1 className="text-4xl md:text-5xl font-royal font-bold uppercase tracking-wide">
              Join Our <span className="text-gold-gradient">Journey</span>
            </h1>
            <p className="text-lg text-muted-foreground font-serif leading-relaxed">
              Partner with us as we redefine how the world celebrates chess.
            </p>
          </div>
          
          {/* Opportunity */}
          <div className="space-y-4">
            <h2 className="text-2xl font-display font-bold uppercase tracking-wider">The Opportunity</h2>
            <p className="text-muted-foreground font-serif leading-relaxed">
              Chess is experiencing a renaissance. With over 800 million players worldwide and 
              unprecedented growth driven by streaming and competitive esports, the demand for 
              chess-related products has never been higher.
            </p>
            <p className="text-muted-foreground font-serif leading-relaxed">
              En Pensent sits at the intersection of art, technology, and the world's most 
              enduring game. We're creating a new category of personalized, data-driven art 
              that resonates with players of all skill levels.
            </p>
          </div>
          
          {/* Key Metrics */}
          <div className="grid md:grid-cols-2 gap-6">
            <MetricCard
              icon={Globe}
              title="Global Market"
              description="Access to 800M+ chess players worldwide, with the market growing 25% year-over-year."
              cta="View TAM Report"
              onClick={() => setActiveModal('market')}
              backgroundImage={backgroundImages[0]}
            />
            
            <MetricCard
              icon={Zap}
              title="Unique Technology"
              description="Proprietary visualization algorithms that transform PGN data into stunning, one-of-a-kind art."
              cta="Learn More"
              onClick={() => setActiveModal('technology')}
              backgroundImage={backgroundImages[1]}
            />
            
            <MetricCard
              icon={Target}
              title="Clear Vision"
              description="Expanding into licensed partnerships, limited editions, and physical retail presence."
              cta="View Roadmap"
              onClick={() => setActiveModal('vision')}
              backgroundImage={backgroundImages[2]}
            />
            
            <MetricCard
              icon={Crown}
              title="Premium Brand"
              description="Positioned as the definitive chess art brand with museum-quality products."
              cta="Brand Strategy"
              onClick={() => setActiveModal('brand')}
              backgroundImage={backgroundImages[3]}
            />
            
            <MetricCard
              icon={Database}
              title="Data Insights"
              description="Premium analytics and community insights as an exclusive membership benefit."
              cta="View Data Strategy"
              onClick={() => setActiveModal('data')}
              backgroundImage={backgroundImages[4]}
            />
          </div>

          {/* Pitch Deck Section */}
          <div className="space-y-6">
            <h2 className="text-2xl font-display font-bold uppercase tracking-wider">Investor Materials</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="p-6 rounded-lg border border-border/50 bg-card/50 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Presentation className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold uppercase tracking-wide">Pitch Deck</h3>
                    <p className="text-xs text-muted-foreground">Company overview & vision</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground font-serif">
                  Our comprehensive pitch deck covering market opportunity, product strategy, business model, and growth plans.
                </p>
                <a 
                  href="mailto:investors@enpensent.com?subject=Pitch Deck Request"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-display uppercase tracking-wide text-xs hover:opacity-90 transition-opacity"
                >
                  <Download className="h-3 w-3" />
                  Request Deck
                </a>
              </div>
              
              <div className="p-6 rounded-lg border border-border/50 bg-card/50 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold uppercase tracking-wide">TAM Report</h3>
                    <p className="text-xs text-muted-foreground">Market analysis & sizing</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground font-serif">
                  Detailed bottom-up market analysis with defensible TAM calculations and growth projections.
                </p>
                <a 
                  href="/documents/Chess_Game_Visualizer_TAM_Report.pdf"
                  download
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-display uppercase tracking-wide text-xs hover:opacity-90 transition-opacity"
                >
                  <Download className="h-3 w-3" />
                  Download PDF
                </a>
              </div>
            </div>
          </div>

          {/* Global Market Modal */}
          <Dialog open={activeModal === 'market'} onOpenChange={(open) => !open && setActiveModal(null)}>
            <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto bg-card border-border">
              <DialogHeader>
                <DialogTitle className="text-2xl font-display uppercase tracking-wider text-gold-gradient">
                  Total Addressable Market
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-6 py-4">
                <div className="space-y-3">
                  <h3 className="font-display font-bold uppercase tracking-wide text-primary">The Product</h3>
                  <p className="text-sm text-muted-foreground font-serif">
                    A chess game visualizer that transforms annotated games into color-coded, motion-implied artworks—merging chess analysis, data visualization, and personalized art.
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 space-y-2">
                  <h3 className="font-display font-bold uppercase tracking-wide text-primary">Market Opportunity</h3>
                  <div className="grid grid-cols-2 gap-4 mt-3">
                    <div>
                      <p className="text-2xl font-display text-foreground">600M–800M</p>
                      <p className="text-xs text-muted-foreground font-serif">Global chess players</p>
                    </div>
                    <div>
                      <p className="text-2xl font-display text-foreground">$2.6B–$3.3B</p>
                      <p className="text-xs text-muted-foreground font-serif">Annual chess economy</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="font-display font-bold uppercase tracking-wide text-primary">Key Highlights</h3>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2 text-sm text-muted-foreground font-serif">
                      <ChevronRight className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <span><strong className="text-foreground">50M core addressable users</strong> — digitally engaged players who review and save games</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm text-muted-foreground font-serif">
                      <ChevronRight className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <span><strong className="text-foreground">$120M–$250M TAM</strong> — based on 5-10% conversion at $49 average selling price</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm text-muted-foreground font-serif">
                      <ChevronRight className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <span><strong className="text-foreground">$170M–$350M expanded TAM</strong> — with book upsells and future roadmap</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm text-muted-foreground font-serif">
                      <ChevronRight className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <span><strong className="text-foreground">Free-to-paid funnel</strong> — digital exports are free, physical prints are monetized</span>
                    </li>
                  </ul>
                </div>

                <div className="pt-4 border-t border-border">
                  <a 
                    href="/documents/Chess_Game_Visualizer_TAM_Report.pdf" 
                    download
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground font-display uppercase tracking-wide text-sm hover:opacity-90 transition-opacity"
                  >
                    <Download className="h-4 w-4" />
                    Download Full TAM Report
                  </a>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Technology Modal */}
          <Dialog open={activeModal === 'technology'} onOpenChange={(open) => !open && setActiveModal(null)}>
            <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto bg-card border-border">
              <DialogHeader>
                <DialogTitle className="text-2xl font-display uppercase tracking-wider text-gold-gradient">
                  Unique Technology
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-6 py-4">
                <div className="space-y-3">
                  <h3 className="font-display font-bold uppercase tracking-wide text-primary">Proprietary Visualization Engine</h3>
                  <p className="text-sm text-muted-foreground font-serif">
                    Our core technology transforms chess game notation (PGN) into stunning visual artworks through a proprietary algorithm that encodes movement, strategy, and game dynamics.
                  </p>
                </div>

                <div className="space-y-3">
                  <h3 className="font-display font-bold uppercase tracking-wide text-primary">Technical Capabilities</h3>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2 text-sm text-muted-foreground font-serif">
                      <ChevronRight className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <span><strong className="text-foreground">Color-coded movement encoding</strong> — each piece type has a unique color signature</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm text-muted-foreground font-serif">
                      <ChevronRight className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <span><strong className="text-foreground">Motion-implied artworks</strong> — movement paths create dynamic visual flow</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm text-muted-foreground font-serif">
                      <ChevronRight className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <span><strong className="text-foreground">Customizable palettes</strong> — users can personalize their artwork's color scheme</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm text-muted-foreground font-serif">
                      <ChevronRight className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <span><strong className="text-foreground">High-resolution output</strong> — print-ready quality up to poster sizes</span>
                    </li>
                  </ul>
                </div>

                <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 space-y-2">
                  <h3 className="font-display font-bold uppercase tracking-wide text-primary">Competitive Moat</h3>
                  <p className="text-sm text-muted-foreground font-serif">
                    No existing product combines chess analysis with personalized art at this level. Our algorithm creates unique, meaningful visualizations that resonate emotionally with players.
                  </p>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Vision Modal */}
          <Dialog open={activeModal === 'vision'} onOpenChange={(open) => !open && setActiveModal(null)}>
            <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto bg-card border-border">
              <DialogHeader>
                <DialogTitle className="text-2xl font-display uppercase tracking-wider text-gold-gradient">
                  Product Roadmap
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-6 py-4">
                <div className="space-y-3">
                  <h3 className="font-display font-bold uppercase tracking-wide text-primary">Current Phase</h3>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2 text-sm text-muted-foreground font-serif">
                      <ChevronRight className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      Free digital visualization tool with PGN upload
                    </li>
                    <li className="flex items-start gap-2 text-sm text-muted-foreground font-serif">
                      <ChevronRight className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      6 poster sizes from $29–$69 USD
                    </li>
                    <li className="flex items-start gap-2 text-sm text-muted-foreground font-serif">
                      <ChevronRight className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      Library of legendary games for showcase
                    </li>
                    <li className="flex items-start gap-2 text-sm text-muted-foreground font-serif">
                      <ChevronRight className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <span><strong className="text-foreground">Visionary Premium Membership</strong> — $7/month recurring subscription</span>
                    </li>
                  </ul>
                </div>

                {/* Subscription Revenue Model */}
                <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 space-y-3">
                  <h3 className="font-display font-bold uppercase tracking-wide text-primary flex items-center gap-2">
                    <Crown className="h-4 w-4" />
                    Recurring Revenue Stream
                  </h3>
                  <p className="text-sm text-muted-foreground font-serif">
                    The Visionary Premium Membership provides predictable monthly recurring revenue (MRR) with high-margin digital benefits.
                  </p>
                  <div className="grid grid-cols-3 gap-3 mt-3">
                    <div className="text-center">
                      <p className="text-lg font-display text-foreground">$7</p>
                      <p className="text-xs text-muted-foreground font-serif">Per Month</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-display text-foreground">$84</p>
                      <p className="text-xs text-muted-foreground font-serif">Annual LTV</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-display text-foreground">95%+</p>
                      <p className="text-xs text-muted-foreground font-serif">Gross Margin</p>
                    </div>
                  </div>
                  <ul className="space-y-1 mt-3">
                    <li className="flex items-start gap-2 text-xs text-muted-foreground font-serif">
                      <ChevronRight className="h-3 w-3 text-primary mt-0.5 shrink-0" />
                      Watermark-free HD downloads
                    </li>
                    <li className="flex items-start gap-2 text-xs text-muted-foreground font-serif">
                      <ChevronRight className="h-3 w-3 text-primary mt-0.5 shrink-0" />
                      Personal "My Vision" gallery storage
                    </li>
                    <li className="flex items-start gap-2 text-xs text-muted-foreground font-serif">
                      <ChevronRight className="h-3 w-3 text-primary mt-0.5 shrink-0" />
                      Priority access to limited edition prints
                    </li>
                  </ul>
                </div>

                {/* Subscriber Projections */}
                <div className="p-4 rounded-lg bg-card border border-border/50 space-y-3">
                  <h3 className="font-display font-bold uppercase tracking-wide text-primary flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Subscriber Projections
                  </h3>
                  <p className="text-sm text-muted-foreground font-serif">
                    Conservative growth projections based on addressable market of 50M engaged chess players.
                  </p>
                  <div className="space-y-3 mt-3">
                    <div className="flex items-center justify-between p-2 rounded bg-primary/5">
                      <div>
                        <p className="text-sm font-display text-foreground">1,000 Subscribers</p>
                        <p className="text-xs text-muted-foreground font-serif">Year 1 Target</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-display text-primary">$84K ARR</p>
                        <p className="text-xs text-muted-foreground font-serif">$7K MRR</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded bg-primary/5">
                      <div>
                        <p className="text-sm font-display text-foreground">5,000 Subscribers</p>
                        <p className="text-xs text-muted-foreground font-serif">Year 2 Target</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-display text-primary">$420K ARR</p>
                        <p className="text-xs text-muted-foreground font-serif">$35K MRR</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded bg-primary/10 border border-primary/20">
                      <div>
                        <p className="text-sm font-display text-foreground font-bold">10,000 Subscribers</p>
                        <p className="text-xs text-muted-foreground font-serif">Year 3 Target</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-display text-primary font-bold">$840K ARR</p>
                        <p className="text-xs text-muted-foreground font-serif">$70K MRR</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded bg-primary/5">
                      <div>
                        <p className="text-sm font-display text-foreground">50,000 Subscribers</p>
                        <p className="text-xs text-muted-foreground font-serif">Long-term Vision</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-display text-primary">$4.2M ARR</p>
                        <p className="text-xs text-muted-foreground font-serif">$350K MRR</p>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground font-serif italic mt-2">
                    * Projections assume 0.02% to 0.1% conversion of addressable market
                  </p>
                </div>

                <div className="space-y-3">
                  <h3 className="font-display font-bold uppercase tracking-wide text-primary">Near-Term (6-12 months)</h3>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2 text-sm text-muted-foreground font-serif">
                      <ChevronRight className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      Direct integration with Chess.com and Lichess
                    </li>
                    <li className="flex items-start gap-2 text-sm text-muted-foreground font-serif">
                      <ChevronRight className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      Multi-game printed books (career retrospectives)
                    </li>
                    <li className="flex items-start gap-2 text-sm text-muted-foreground font-serif">
                      <ChevronRight className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      Tournament partnerships and limited editions
                    </li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <h3 className="font-display font-bold uppercase tracking-wide text-primary">Long-Term Vision</h3>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2 text-sm text-muted-foreground font-serif">
                      <ChevronRight className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      Physical retail presence in chess stores and galleries
                    </li>
                    <li className="flex items-start gap-2 text-sm text-muted-foreground font-serif">
                      <ChevronRight className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      Licensed partnerships with grandmasters and federations
                    </li>
                    <li className="flex items-start gap-2 text-sm text-muted-foreground font-serif">
                      <ChevronRight className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      Expansion to other strategic games (Go, Shogi)
                    </li>
                  </ul>
                </div>

                <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-xl font-display text-foreground">$49</p>
                      <p className="text-xs text-muted-foreground font-serif">Avg Print Price</p>
                    </div>
                    <div>
                      <p className="text-xl font-display text-foreground">$99</p>
                      <p className="text-xs text-muted-foreground font-serif">Avg Book Price</p>
                    </div>
                    <div>
                      <p className="text-xl font-display text-foreground">40%+</p>
                      <p className="text-xs text-muted-foreground font-serif">Target Margin</p>
                    </div>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Brand Modal */}
          <Dialog open={activeModal === 'brand'} onOpenChange={(open) => !open && setActiveModal(null)}>
            <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto bg-card border-border">
              <DialogHeader>
                <DialogTitle className="text-2xl font-display uppercase tracking-wider text-gold-gradient">
                  Premium Brand Strategy
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-6 py-4">
                <div className="space-y-3">
                  <h3 className="font-display font-bold uppercase tracking-wide text-primary">Brand Positioning</h3>
                  <p className="text-sm text-muted-foreground font-serif">
                    En Pensent ("In Thought") positions itself as the definitive chess art brand—where intellectual achievement meets visual artistry. We're creating a new category of personalized memorabilia that celebrates the beauty of strategic thinking.
                  </p>
                </div>

                <div className="space-y-3">
                  <h3 className="font-display font-bold uppercase tracking-wide text-primary">Target Audiences</h3>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2 text-sm text-muted-foreground font-serif">
                      <ChevronRight className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <span><strong className="text-foreground">Competitive players</strong> — celebrating personal achievements and memorable games</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm text-muted-foreground font-serif">
                      <ChevronRight className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <span><strong className="text-foreground">Chess enthusiasts</strong> — owning art from legendary historical games</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm text-muted-foreground font-serif">
                      <ChevronRight className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <span><strong className="text-foreground">Gift buyers</strong> — unique, personalized presents for chess-loving friends and family</span>
                    </li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <h3 className="font-display font-bold uppercase tracking-wide text-primary">Brand Pillars</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
                      <p className="font-display text-sm font-bold text-foreground">Museum Quality</p>
                      <p className="text-xs text-muted-foreground font-serif mt-1">Premium materials and framing</p>
                    </div>
                    <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
                      <p className="font-display text-sm font-bold text-foreground">Data-Driven Art</p>
                      <p className="text-xs text-muted-foreground font-serif mt-1">Every piece tells a unique story</p>
                    </div>
                    <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
                      <p className="font-display text-sm font-bold text-foreground">Intellectual Heritage</p>
                      <p className="text-xs text-muted-foreground font-serif mt-1">Celebrating chess history</p>
                    </div>
                    <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
                      <p className="font-display text-sm font-bold text-foreground">Personal Achievement</p>
                      <p className="text-xs text-muted-foreground font-serif mt-1">Your games immortalized</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 space-y-2">
                  <h3 className="font-display font-bold uppercase tracking-wide text-primary">Brand Promise</h3>
                  <p className="text-sm text-muted-foreground font-serif italic">
                    "We're turning chess games into permanent cultural artifacts."
                  </p>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Data Insights Modal */}
          <Dialog open={activeModal === 'data'} onOpenChange={(open) => !open && setActiveModal(null)}>
            <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto bg-card border-border">
              <DialogHeader>
                <DialogTitle className="text-2xl font-display uppercase tracking-wider text-gold-gradient">
                  Data Insights Revenue Model
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-6 py-4">
                <div className="space-y-3">
                  <h3 className="font-display font-bold uppercase tracking-wide text-primary">Vision NFT Scoring System</h3>
                  <p className="text-sm text-muted-foreground font-serif">
                    Every vision earns points through a weighted scoring system that tracks real engagement 
                    and monetization. This creates a revolutionary digital asset economy where visions 
                    gain value through community interaction and print sales.
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 space-y-3">
                  <h3 className="font-display font-bold uppercase tracking-wide text-primary flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Scoring Weights
                  </h3>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 rounded bg-card/50 border border-border/30">
                      <p className="text-lg font-display text-foreground">0.01</p>
                      <p className="text-xs text-muted-foreground">Per View</p>
                    </div>
                    <div className="p-2 rounded bg-card/50 border border-border/30">
                      <p className="text-lg font-display text-foreground">0.10</p>
                      <p className="text-xs text-muted-foreground">HD Download</p>
                    </div>
                    <div className="p-2 rounded bg-card/50 border border-border/30">
                      <p className="text-lg font-display text-foreground">0.25</p>
                      <p className="text-xs text-muted-foreground">GIF Export</p>
                    </div>
                    <div className="p-2 rounded bg-card/50 border border-border/30">
                      <p className="text-lg font-display text-foreground">1.00</p>
                      <p className="text-xs text-muted-foreground">Trade</p>
                    </div>
                    <div className="p-2 rounded bg-primary/10 border border-primary/30">
                      <p className="text-lg font-display text-primary font-bold">2.00+</p>
                      <p className="text-xs text-muted-foreground">Print Order</p>
                    </div>
                    <div className="p-2 rounded bg-primary/10 border border-primary/30">
                      <p className="text-lg font-display text-primary font-bold">$1=1pt</p>
                      <p className="text-xs text-muted-foreground">Revenue Bonus</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="font-display font-bold uppercase tracking-wide text-primary">Revenue Impact</h3>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2 text-sm text-muted-foreground font-serif">
                      <ChevronRight className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <span><strong className="text-foreground">Asset Value Creation</strong> — Visions gain real dollar value through engagement</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm text-muted-foreground font-serif">
                      <ChevronRight className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <span><strong className="text-foreground">Marketplace Revenue</strong> — 10% platform fee on all vision trades</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm text-muted-foreground font-serif">
                      <ChevronRight className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <span><strong className="text-foreground">Print-Driven Value</strong> — Real revenue adds permanent score to visions</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm text-muted-foreground font-serif">
                      <ChevronRight className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <span><strong className="text-foreground">Anti-Gaming Protection</strong> — Rate-limited interactions prevent abuse</span>
                    </li>
                  </ul>
                </div>

                <div className="p-4 rounded-lg bg-card border border-border/50 space-y-3">
                  <h3 className="font-display font-bold uppercase tracking-wide text-primary flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Projected Impact on LTV
                  </h3>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center">
                      <p className="text-lg font-display text-foreground">+15%</p>
                      <p className="text-xs text-muted-foreground font-serif">Conversion Lift</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-display text-foreground">+20%</p>
                      <p className="text-xs text-muted-foreground font-serif">Retention Boost</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-display text-primary font-bold">$100+</p>
                      <p className="text-xs text-muted-foreground font-serif">Enhanced LTV</p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-border">
                  <a 
                    href="/analytics"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground font-display uppercase tracking-wide text-sm hover:opacity-90 transition-opacity"
                  >
                    <BarChart3 className="h-4 w-4" />
                    View Live Analytics Dashboard
                  </a>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          
          {/* Premium Member Testimonials */}
          <div className="space-y-8">
            {/* Section header with animated elements */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center space-y-3"
            >
              <div className="flex items-center justify-center gap-3">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                >
                  <Quote className="h-6 w-6 text-primary" />
                </motion.div>
                <h2 className="text-2xl font-display font-bold uppercase tracking-wider">
                  What Premium Members Say
                </h2>
                <motion.div
                  animate={{ rotate: [0, -10, 10, 0] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                >
                  <Quote className="h-6 w-6 text-primary transform scale-x-[-1]" />
                </motion.div>
              </div>
              <p className="text-sm text-muted-foreground font-serif">
                Join {allTestimonials.length}+ visionaries who've transformed their chess journey
              </p>
            </motion.div>

            {/* Testimonials grid with staggered animation */}
            <div className="grid gap-4 md:gap-6">
              <AnimatePresence mode="popLayout">
                {visibleTestimonials.map((testimonial, index) => (
                  <TestimonialCard 
                    key={`${testimonial.name}-${index}`}
                    testimonial={testimonial} 
                    index={index % 4} // Reset index for each batch for animation timing
                  />
                ))}
              </AnimatePresence>
            </div>

            {/* Load More Button */}
            {hasMoreTestimonials && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-center pt-4"
              >
                <motion.button
                  onClick={handleLoadMore}
                  disabled={isLoadingMore}
                  className="group relative px-8 py-4 rounded-xl bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 border border-primary/30 hover:border-primary/50 transition-all duration-300 overflow-hidden"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {/* Animated background */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/10 to-transparent"
                    animate={{ x: ['-100%', '100%'] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  />
                  
                  <div className="relative flex items-center gap-3">
                    {isLoadingMore ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      >
                        <Sparkles className="h-5 w-5 text-primary" />
                      </motion.div>
                    ) : (
                      <motion.div
                        animate={{ y: [0, 3, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        <ChevronDown className="h-5 w-5 text-primary" />
                      </motion.div>
                    )}
                    <span className="font-display text-sm uppercase tracking-wider text-foreground">
                      {isLoadingMore ? 'Loading...' : `Show ${Math.min(remainingCount, 4)} More Stories`}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-primary/20 text-xs text-primary font-medium">
                      {remainingCount} left
                    </span>
                  </div>
                </motion.button>
              </motion.div>
            )}

            {/* All loaded message */}
            {!hasMoreTestimonials && visibleCount > 4 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-6"
              >
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 2, ease: 'easeOut' }}
                >
                  <Crown className="h-8 w-8 text-primary mx-auto mb-3" />
                </motion.div>
                <p className="text-sm text-muted-foreground font-serif">
                  You've seen all our amazing member stories!
                </p>
              </motion.div>
            )}

            {/* Testimonial Submission Form */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <TestimonialSubmissionForm isPremium={isPremium} />
            </motion.div>
          </div>

          {/* Contact CTA */}
          <div className="text-center p-8 rounded-lg border border-primary/30 bg-primary/5 space-y-4">
            <h2 className="text-xl font-display font-bold uppercase tracking-wider">Let's Connect</h2>
            <p className="text-muted-foreground font-serif">
              Interested in learning more about investment opportunities? 
              We'd love to share our vision with you.
            </p>
            <p className="text-primary font-medium">investors@enpensent.com</p>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Investors;
