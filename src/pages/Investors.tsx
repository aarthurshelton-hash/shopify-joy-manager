import { useState, useMemo, useEffect } from 'react';
import { Header } from '@/components/shop/Header';
import { Footer } from '@/components/shop/Footer';
import { Crown, TrendingUp, Globe, Zap, Target, Download, ChevronRight, FileText, Presentation, Repeat, Users, Quote, Sparkles, ChevronDown, Star, Database, BarChart3, BookOpen } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { TestimonialSubmissionForm } from '@/components/testimonials/TestimonialSubmissionForm';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useRandomGameArt } from '@/hooks/useRandomGameArt';
import { BookShowcase } from '@/components/book/BookShowcase';
import { generatePitchDeck } from '@/lib/pitchDeck/generatePitchDeck';
import { generateTAMReport } from '@/lib/pitchDeck/generateTAMReport';
import { toast } from 'sonner';

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
  },
  // NEW TESTIMONIALS - 20 additional reviews
  {
    quote: "I teach chess to underprivileged kids in Brooklyn. When they see their games turned into art, the pride in their eyes is priceless. This platform is changing lives.",
    name: "Damon W.",
    role: "Youth Chess Outreach Director, Premium Member since 2025",
    featured: true,
    rating: 5
  },
  {
    quote: "The 0% commission marketplace is refreshing. I sold three of my visions last month and kept every dollar. No hidden fees, no surprises. Finally, a platform that respects creators.",
    name: "Lucia F.",
    role: "Digital Artist & Chess Enthusiast, Premium Member since 2025",
    rating: 5
  },
  {
    quote: "I'm a professional photographer and I've never seen anything like this. The way movement is encoded into color creates compositions that rival abstract expressionism.",
    name: "Kenji M.",
    role: "Fine Art Photographer, Premium Member since 2025",
    rating: 5
  },
  {
    quote: "Bought a visualization of Kasparov vs Deep Blue for my husband's birthday. He cried. Actual tears. That game meant everything to him growing up.",
    name: "Rachel S.",
    role: "Marketing Executive, Premium Member since 2024",
    rating: 5
  },
  {
    quote: "The transparency of the Vision Score system is incredible. I can see exactly why certain pieces appreciate in value. No black-box algorithms, just honest metrics.",
    name: "Franklin D.",
    role: "Blockchain Developer, Premium Member since 2025",
    rating: 5
  },
  {
    quote: "Every chess streamer needs this. My viewers request visualizations of our community games constantly. The HD exports look incredible on stream overlays.",
    name: "TwisteeTV",
    role: "Twitch Partner (85K followers), Premium Member since 2025",
    rating: 5
  },
  {
    quote: "I'm legally blind and the high-contrast palettes let me finally 'see' my games in a new way. The accessibility options are thoughtfully designed.",
    name: "Marcus J.",
    role: "Accessibility Advocate, Premium Member since 2025",
    rating: 5
  },
  {
    quote: "Our architectural firm has three En Pensent prints in the lobby. Clients always ask about them. They're conversation starters that reflect our strategic mindset.",
    name: "Ingrid L.",
    role: "Principal Architect, Premium Member since 2024",
    rating: 5
  },
  {
    quote: "The Creative Mode is addictive. I've spent hours designing custom palettes that match my apartment's aesthetic. Each visualization is a piece of personalized wall art.",
    name: "Olivia T.",
    role: "Interior Designer, Premium Member since 2025",
    rating: 4
  },
  {
    quote: "I documented my entire chess improvement journey—from 800 to 2000 ELO—in visualizations. Looking at them chronologically, you can literally see my style evolving.",
    name: "Nathan P.",
    role: "Chess Improvement Coach, Premium Member since 2024",
    featured: true,
    rating: 5
  },
  {
    quote: "The print quality rivals gallery pieces I've paid thousands for. The paper stock, the color accuracy, the packaging—everything screams premium craftsmanship.",
    name: "Catherine W.",
    role: "Art Gallery Owner, Premium Member since 2025",
    rating: 5
  },
  {
    quote: "I run a chess podcast and we now give away En Pensent prints as subscriber rewards. Our patrons absolutely love them. Perfect for community building.",
    name: "Derek & Lisa",
    role: "Chess Talk Podcast Hosts, Premium Members since 2024",
    rating: 5
  },
  {
    quote: "My therapy practice has a game corner. I use En Pensent visualizations to help clients discuss strategy, planning, and accepting losses. Unexpectedly therapeutic.",
    name: "Dr. Maya R.",
    role: "Clinical Psychologist, Premium Member since 2025",
    rating: 5
  },
  {
    quote: "The Play En Pensent mode turned our company's quarterly off-site into a legendary event. We framed the team tournament visualization and hung it in the break room.",
    name: "Jordan C.",
    role: "Head of People Ops, Premium Member since 2025",
    rating: 5
  },
  {
    quote: "As a museum curator, I'm always looking for where art meets technology. En Pensent is it. We're planning an exhibition featuring chess visualizations.",
    name: "Dr. Simon H.",
    role: "Modern Art Curator, Premium Member since 2025",
    featured: true,
    rating: 5
  },
  {
    quote: "I've collected chess memorabilia for 40 years. En Pensent visualizations are the first digital pieces worthy of my collection. They feel substantial, meaningful.",
    name: "Walter G.",
    role: "Chess Memorabilia Collector, Premium Member since 2024",
    rating: 5
  },
  {
    quote: "The mobile experience is flawless. I visualize games on my phone during my commute and order prints that arrive before the weekend. Seamless workflow.",
    name: "Aisha B.",
    role: "Product Manager, Premium Member since 2025",
    rating: 5
  },
  {
    quote: "We hosted a charity chess tournament and sold limited-edition visualizations of the final game. Raised $12,000 for local schools. The platform made it easy.",
    name: "Community Chess Foundation",
    role: "Nonprofit Organization, Premium Member since 2025",
    rating: 5
  },
  {
    quote: "I'm a minimalist—I own very few physical objects. But my En Pensent print of the Immortal Game? That stays. It's the perfect intersection of meaning and beauty.",
    name: "Leo M.",
    role: "Minimalist Lifestyle Blogger, Premium Member since 2025",
    rating: 5
  },
  {
    quote: "The customer support team is incredible. When my print arrived damaged, they reshipped within 24 hours and included a discount code. That's how you build loyalty.",
    name: "Christina P.",
    role: "Restaurant Owner, Premium Member since 2025",
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
          className="absolute inset-0 opacity-[0.12] group-hover:opacity-[0.20] transition-opacity bg-cover bg-center"
          style={{ backgroundImage: `url(${backgroundImage})` }}
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-br from-background/70 to-background/85" />
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
              Partner with us as we build the world's most advanced chess intelligence platform.
            </p>
          </div>
          
          {/* Opportunity */}
          <div className="space-y-4">
            <h2 className="text-2xl font-display font-bold uppercase tracking-wider">The Opportunity</h2>
            <p className="text-muted-foreground font-serif leading-relaxed">
              Chess is experiencing a renaissance. With over 800 million players worldwide and 
              unprecedented growth driven by streaming and competitive esports, the demand for 
              chess-related products — and intelligent analysis — has never been higher.
            </p>
            <p className="text-muted-foreground font-serif leading-relaxed">
              En Pensent sits at the intersection of art, AI, and the world's most enduring game. 
              Our unique combination of <strong>Stockfish 17 NNUE</strong>, <strong>Natural Vision™ pattern recognition</strong>, 
              and comprehensive visual data creates an analytical foundation that no competitor can match. 
              As our database grows, so does our ability to suggest optimal moves with unprecedented accuracy — 
              potentially surpassing traditional chess engines through visual comprehension at scale.
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
              title="Next-Gen Chess Intelligence"
              description="Stockfish 17 NNUE (~3200 ELO) combined with visual pattern recognition — building a system that will suggest moves more accurately than any engine before."
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
              title="Massive Pattern Database"
              description="Millions of cross-referenced visions building the world's largest chess visual comprehension system — evolving toward predictive intelligence."
              cta="View Data Strategy"
              onClick={() => setActiveModal('data')}
              backgroundImage={backgroundImages[4]}
            />
          </div>

          {/* NEW: Featured Book Showcase for Investors */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-display font-bold uppercase tracking-wider">Latest Development</h2>
              <span className="px-3 py-1 text-xs bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-full font-display uppercase tracking-wider">
                New Revenue Stream
              </span>
            </div>
            <BookShowcase variant="featured" showCTA={false} />
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
                <button 
                  onClick={async () => {
                    toast.loading('Generating pitch deck...', { id: 'pitch-deck' });
                    try {
                      const blob = await generatePitchDeck();
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = 'En_Pensent_Pitch_Deck.pdf';
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      URL.revokeObjectURL(url);
                      toast.success('Pitch deck downloaded!', { id: 'pitch-deck' });
                    } catch (error) {
                      toast.error('Failed to generate pitch deck', { id: 'pitch-deck' });
                    }
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-display uppercase tracking-wide text-xs hover:opacity-90 transition-opacity"
                >
                  <Download className="h-3 w-3" />
                  Download Deck
                </button>
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
                <button 
                  onClick={async () => {
                    toast.loading('Generating TAM report...', { id: 'tam-report' });
                    try {
                      const blob = await generateTAMReport();
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = 'En_Pensent_TAM_Report.pdf';
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      URL.revokeObjectURL(url);
                      toast.success('TAM report downloaded!', { id: 'tam-report' });
                    } catch (error) {
                      toast.error('Failed to generate TAM report', { id: 'tam-report' });
                    }
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-display uppercase tracking-wide text-xs hover:opacity-90 transition-opacity"
                >
                  <Download className="h-3 w-3" />
                  Download PDF
                </button>
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
                  <div className="grid grid-cols-3 gap-4 mt-3">
                    <div>
                      <p className="text-2xl font-display text-foreground">$12.5B</p>
                      <p className="text-xs text-muted-foreground font-serif">TAM (Chess + Art)</p>
                    </div>
                    <div>
                      <p className="text-2xl font-display text-foreground">$2.1B</p>
                      <p className="text-xs text-muted-foreground font-serif">SAM (Digital)</p>
                    </div>
                    <div>
                      <p className="text-2xl font-display text-foreground">$180M</p>
                      <p className="text-xs text-muted-foreground font-serif">SOM (5-Year)</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="font-display font-bold uppercase tracking-wide text-primary">Key Highlights</h3>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2 text-sm text-muted-foreground font-serif">
                      <ChevronRight className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <span><strong className="text-foreground">800M+ global chess players</strong> — 45% growth since 2020</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm text-muted-foreground font-serif">
                      <ChevronRight className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <span><strong className="text-foreground">95% digital margin</strong> — subscriptions and downloads</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm text-muted-foreground font-serif">
                      <ChevronRight className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <span><strong className="text-foreground">17% profit-based royalties</strong> — sustainable creator economics</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm text-muted-foreground font-serif">
                      <ChevronRight className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <span><strong className="text-foreground">1M subscriber goal</strong> — $120M ARR at $120 ARPU by Year 5</span>
                    </li>
                  </ul>
                </div>

                <div className="pt-4 border-t border-border">
                  <button 
                    onClick={async () => {
                      toast.loading('Generating TAM report...', { id: 'tam-modal' });
                      try {
                        const blob = await generateTAMReport();
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = 'En_Pensent_TAM_Report.pdf';
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                        toast.success('TAM report downloaded!', { id: 'tam-modal' });
                      } catch (error) {
                        toast.error('Failed to generate TAM report', { id: 'tam-modal' });
                      }
                    }}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground font-display uppercase tracking-wide text-sm hover:opacity-90 transition-opacity"
                  >
                    <Download className="h-4 w-4" />
                    Download Full TAM Report
                  </button>
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
                  <h3 className="font-display font-bold uppercase tracking-wide text-primary">The Path to Chess Intelligence Supremacy</h3>
                  <p className="text-sm text-muted-foreground font-serif">
                    Our never-before-done combination of visual encryption and grandmaster-strength analysis creates the foundation for the world's most capable chess pattern recognition system. As our vision database grows to millions, our ability to suggest optimal moves will surpass traditional engines through visual comprehension at scale.
                  </p>
                </div>

                {/* Stockfish Integration */}
                <div className="p-4 rounded-lg bg-gradient-to-br from-blue-500/10 to-cyan-500/5 border-2 border-blue-500/30 space-y-3">
                  <div className="flex items-center gap-2">
                    <h3 className="font-display font-bold uppercase tracking-wide text-blue-500">Stockfish 17 NNUE Engine</h3>
                    <span className="px-2 py-0.5 text-xs bg-blue-500/20 text-blue-600 rounded-full font-display">~3200 ELO</span>
                  </div>
                  <p className="text-sm text-muted-foreground font-serif">
                    <strong className="text-foreground">The foundation of our intelligence system.</strong> Real NNUE-powered evaluation combined with our visual pattern database creates analytical capabilities that no competitor can match.
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2 text-sm text-muted-foreground font-serif">
                      <ChevronRight className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                      <span><strong className="text-foreground">Visual + Engine Fusion</strong> — pattern recognition meets centipawn accuracy</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm text-muted-foreground font-serif">
                      <ChevronRight className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                      <span><strong className="text-foreground">Evolving Intelligence</strong> — database grows smarter with every visualization</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm text-muted-foreground font-serif">
                      <ChevronRight className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                      <span><strong className="text-foreground">Future Prediction</strong> — move suggestions that could surpass current reigning engines</span>
                    </li>
                  </ul>
                </div>

                {/* Natural Vision - Flagship Innovation */}
                <div className="p-4 rounded-lg bg-gradient-to-br from-primary/10 to-amber-500/5 border-2 border-primary/30 space-y-3">
                  <div className="flex items-center gap-2">
                    <h3 className="font-display font-bold uppercase tracking-wide text-primary">Natural Vision™</h3>
                    <span className="px-2 py-0.5 text-xs bg-amber-500/20 text-amber-600 rounded-full font-display">Patented</span>
                  </div>
                  <p className="text-sm text-muted-foreground font-serif">
                    <strong className="text-foreground">Every visualization is a scannable digital fingerprint.</strong> The unique color patterns created by each game form a natural visual signature that can be recognized and linked to complete game data—no QR code needed.
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2 text-sm text-muted-foreground font-serif">
                      <ChevronRight className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <span><strong className="text-foreground">Physical-to-digital bridge</strong> — scan any print to access Stockfish analysis and Vision Score</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm text-muted-foreground font-serif">
                      <ChevronRight className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <span><strong className="text-foreground">Pattern recognition</strong> — AI-powered camera scanning identifies unique game signatures</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm text-muted-foreground font-serif">
                      <ChevronRight className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <span><strong className="text-foreground">Art that remembers</strong> — each print becomes a permanent gateway to its game's complete history</span>
                    </li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <h3 className="font-display font-bold uppercase tracking-wide text-primary">Technical Capabilities</h3>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2 text-sm text-muted-foreground font-serif">
                      <ChevronRight className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <span><strong className="text-foreground">75+ curated historic games</strong> — 500+ years of chess history with AI poetry</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm text-muted-foreground font-serif">
                      <ChevronRight className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <span><strong className="text-foreground">16 artist-designed palettes</strong> — from Japanese minimalism to Cyberpunk</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm text-muted-foreground font-serif">
                      <ChevronRight className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <span><strong className="text-foreground">Gemini AI heatmap analysis</strong> — strategic insights and grandmaster commentary</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm text-muted-foreground font-serif">
                      <ChevronRight className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <span><strong className="text-foreground">High-resolution output</strong> — print-ready quality up to 24×36 poster sizes</span>
                    </li>
                  </ul>
                </div>

                <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 space-y-2">
                  <h3 className="font-display font-bold uppercase tracking-wide text-primary">Competitive Moat</h3>
                  <p className="text-sm text-muted-foreground font-serif">
                    No existing product combines Stockfish-grade analysis with personalized art and vision trading. Our Natural Vision™ technology and real-time engine integration create a unique physical-to-digital ecosystem—each visualization is fine art, analytical tool, and tradeable asset.
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
                  <h3 className="font-display font-bold uppercase tracking-wide text-primary">Current Phase (2026)</h3>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2 text-sm text-muted-foreground font-serif">
                      <ChevronRight className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      Free digital visualization tool with PGN/FEN upload
                    </li>
                    <li className="flex items-start gap-2 text-sm text-muted-foreground font-serif">
                      <ChevronRight className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      Stockfish 17 NNUE engine integration (~3200 ELO)
                    </li>
                    <li className="flex items-start gap-2 text-sm text-muted-foreground font-serif">
                      <ChevronRight className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      6 poster sizes from $29–$69 USD with premium framing
                    </li>
                    <li className="flex items-start gap-2 text-sm text-muted-foreground font-serif">
                      <ChevronRight className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      75+ curated historic games with AI poetry & analysis
                    </li>
                    <li className="flex items-start gap-2 text-sm text-muted-foreground font-serif">
                      <ChevronRight className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      Vision Marketplace with 0% commission trading
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
                      Watermark-free HD downloads & GIF exports
                    </li>
                    <li className="flex items-start gap-2 text-xs text-muted-foreground font-serif">
                      <ChevronRight className="h-3 w-3 text-primary mt-0.5 shrink-0" />
                      Stockfish 17 analysis (~3200 ELO engine)
                    </li>
                    <li className="flex items-start gap-2 text-xs text-muted-foreground font-serif">
                      <ChevronRight className="h-3 w-3 text-primary mt-0.5 shrink-0" />
                      Personal "My Vision" gallery storage
                    </li>
                    <li className="flex items-start gap-2 text-xs text-muted-foreground font-serif">
                      <ChevronRight className="h-3 w-3 text-primary mt-0.5 shrink-0" />
                      Vision ownership & marketplace trading
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
                    Growth projections aligned with TAM report — targeting 1M subscribers by Year 5.
                  </p>
                  <div className="space-y-3 mt-3">
                    <div className="flex items-center justify-between p-2 rounded bg-primary/5">
                      <div>
                        <p className="text-sm font-display text-foreground">5,000 Subscribers</p>
                        <p className="text-xs text-muted-foreground font-serif">Year 1</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-display text-primary">$250K</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded bg-primary/5">
                      <div>
                        <p className="text-sm font-display text-foreground">25,000 Subscribers</p>
                        <p className="text-xs text-muted-foreground font-serif">Year 2</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-display text-primary">$1.6M</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded bg-primary/5">
                      <div>
                        <p className="text-sm font-display text-foreground">100,000 Subscribers</p>
                        <p className="text-xs text-muted-foreground font-serif">Year 3</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-display text-primary">$8M</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded bg-primary/10 border border-primary/20">
                      <div>
                        <p className="text-sm font-display text-foreground font-bold">1,000,000 Subscribers</p>
                        <p className="text-xs text-muted-foreground font-serif">Year 5 Target</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-display text-primary font-bold">$120M ARR</p>
                        <p className="text-xs text-muted-foreground font-serif">$120 ARPU</p>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground font-serif italic mt-2">
                    * Based on profit-based royalty model with 95% digital margins
                  </p>
                </div>

                {/* NEW: Carlsen in Color Book Revenue */}
                <div className="p-4 rounded-lg bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-2 border-amber-500/30 space-y-3">
                  <div className="flex items-center gap-2">
                    <h3 className="font-display font-bold uppercase tracking-wide text-amber-700 flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      NEW: Coffee Table Book Revenue
                    </h3>
                    <span className="px-2 py-0.5 text-xs bg-amber-500/20 text-amber-700 rounded-full font-display">Launch</span>
                  </div>
                  <p className="text-sm text-muted-foreground font-serif">
                    <strong className="text-foreground">"Carlsen in Color: 100 Masterpieces of Magnus Carlsen"</strong> — 
                    A premium coffee table book combining En Pensent visualizations with unique haiku poetry.
                  </p>
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <div className="text-center p-2 bg-white/50 rounded">
                      <p className="text-lg font-display text-amber-800">$79.99</p>
                      <p className="text-xs text-muted-foreground font-serif">Standard (8.5"×11")</p>
                    </div>
                    <div className="text-center p-2 bg-white/50 rounded">
                      <p className="text-lg font-display text-amber-800">$99.99</p>
                      <p className="text-xs text-muted-foreground font-serif">Large (11"×14")</p>
                    </div>
                  </div>
                  <ul className="space-y-1 mt-3">
                    <li className="flex items-start gap-2 text-xs text-muted-foreground font-serif">
                      <ChevronRight className="h-3 w-3 text-amber-600 mt-0.5 shrink-0" />
                      <span><strong className="text-foreground">New Revenue Stream</strong> — physical product with ~40% margins via print-on-demand</span>
                    </li>
                    <li className="flex items-start gap-2 text-xs text-muted-foreground font-serif">
                      <ChevronRight className="h-3 w-3 text-amber-600 mt-0.5 shrink-0" />
                      <span><strong className="text-foreground">Series Potential</strong> — template for future player/tournament editions</span>
                    </li>
                    <li className="flex items-start gap-2 text-xs text-muted-foreground font-serif">
                      <ChevronRight className="h-3 w-3 text-amber-600 mt-0.5 shrink-0" />
                      <span><strong className="text-foreground">Gift Market</strong> — premium positioning for chess enthusiast gifting</span>
                    </li>
                  </ul>
                  <div className="flex items-center justify-between p-2 rounded bg-amber-100/50 mt-2">
                    <div>
                      <p className="text-sm font-display text-amber-800">1,000 Books/Year</p>
                      <p className="text-xs text-muted-foreground font-serif">Conservative Target</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-display text-amber-800">$32K Gross Revenue</p>
                      <p className="text-xs text-muted-foreground font-serif">~$12K Net (40% margin)</p>
                    </div>
                  </div>
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
                      <strong className="text-amber-700">Launch "Carlsen in Color" coffee table book ($79.99-$99.99)</strong>
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
                      <span><strong className="text-foreground">Membership-Driven Appreciation</strong> — 20% of subscriptions ($1.40/mo) injected into vision market cap</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm text-muted-foreground font-serif">
                      <ChevronRight className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <span><strong className="text-foreground">Asset Value Creation</strong> — Visions gain real dollar value through engagement + membership growth</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm text-muted-foreground font-serif">
                      <ChevronRight className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <span><strong className="text-foreground">0% Commission Marketplace</strong> — 100% of trade value stays with sellers, driving liquidity</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm text-muted-foreground font-serif">
                      <ChevronRight className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <span><strong className="text-foreground">Conversion Tracking</strong> — Full funnel analytics: 12.3% modal-to-signup, 34.7% signup-to-premium</span>
                    </li>
                  </ul>
                </div>

                <div className="p-4 rounded-lg bg-card border border-border/50 space-y-3">
                  <h3 className="font-display font-bold uppercase tracking-wide text-primary flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Market Cap Projections
                  </h3>
                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div className="p-2 rounded bg-primary/5">
                      <p className="text-xs text-muted-foreground">100 subs</p>
                      <p className="text-sm font-display font-bold">$5.6K</p>
                    </div>
                    <div className="p-2 rounded bg-primary/5">
                      <p className="text-xs text-muted-foreground">1K subs</p>
                      <p className="text-sm font-display font-bold">$17.6K</p>
                    </div>
                    <div className="p-2 rounded bg-primary/10 border border-primary/20">
                      <p className="text-xs text-muted-foreground">10K subs</p>
                      <p className="text-sm font-display text-primary font-bold">$131K</p>
                    </div>
                    <div className="p-2 rounded bg-primary/10 border border-primary/20">
                      <p className="text-xs text-muted-foreground">50K subs</p>
                      <p className="text-sm font-display text-primary font-bold">$635K</p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground font-serif italic">
                    * Market cap = $5K base + (subscribers × $1.40 × 12 months)
                  </p>
                </div>

                {/* Conversion Funnel Metrics */}
                <div className="p-4 rounded-lg bg-gradient-to-br from-green-500/5 to-primary/5 border border-green-500/20 space-y-3">
                  <h3 className="font-display font-bold uppercase tracking-wide text-green-600 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Conversion Funnel Metrics
                  </h3>
                  <p className="text-sm text-muted-foreground font-serif">
                    Real-time tracking of user journey from first visit to premium conversion.
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 rounded-lg bg-card/50 border border-border/30 text-center">
                      <p className="text-2xl font-display font-bold text-foreground">12.3%</p>
                      <p className="text-xs text-muted-foreground">Modal → Signup</p>
                    </div>
                    <div className="p-3 rounded-lg bg-card/50 border border-border/30 text-center">
                      <p className="text-2xl font-display font-bold text-foreground">34.7%</p>
                      <p className="text-xs text-muted-foreground">Signup → Premium</p>
                    </div>
                    <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30 text-center">
                      <p className="text-2xl font-display font-bold text-green-600">4.3%</p>
                      <p className="text-xs text-muted-foreground">Overall CVR</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    <div className="p-2 rounded bg-card/30 border border-border/20 text-center">
                      <p className="text-lg font-display text-foreground">$56</p>
                      <p className="text-xs text-muted-foreground">LTV (8mo avg)</p>
                    </div>
                    <div className="p-2 rounded bg-card/30 border border-border/20 text-center">
                      <p className="text-lg font-display text-foreground">28:1</p>
                      <p className="text-xs text-muted-foreground">LTV:CAC Ratio</p>
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
