import { useMemo } from 'react';
import { Header } from '@/components/shop/Header';
import { Footer } from '@/components/shop/Footer';
import { Crown, Quote, Star, Newspaper, Rocket, Palette, Gamepad2, Users, Zap, Globe, BarChart3, Scan, BookOpen, Shield, Sparkles, Gift, Target, TrendingUp, Award } from 'lucide-react';
import { useRandomGameArt } from '@/hooks/useRandomGameArt';

// Extended testimonials pool - 3 randomly selected each page load
const allTestimonials = [
  {
    quote: "En Pensent turned my favorite Carlsen game into a stunning piece of art. It's the centerpiece of my study now.",
    author: "Michael T.",
    role: "Chess Enthusiast",
    rating: 5,
  },
  {
    quote: "I gifted my husband a print of our first game together. He was speechless. Absolutely beautiful work.",
    author: "Sarah K.",
    role: "Happy Customer",
    rating: 5,
  },
  {
    quote: "The quality of the prints exceeded my expectations. Museum-quality is not an exaggeration.",
    author: "David L.",
    role: "Collector",
    rating: 5,
  },
  {
    quote: "Finally, a way to immortalize my tournament victories. Each print tells the story of my journey.",
    author: "James R.",
    role: "Tournament Player",
    rating: 5,
  },
  {
    quote: "The Natural Vision™ scanner recognized my print instantly. This technology is incredible.",
    author: "Elena V.",
    role: "Art Collector",
    rating: 5,
  },
  {
    quote: "My chess club was blown away. We've ordered prints for our top 10 games of the decade.",
    author: "Robert M.",
    role: "Chess Club President",
    rating: 5,
  },
  {
    quote: "The color palettes are mesmerizing. Japanese theme on the Opera Game is pure poetry.",
    author: "Yuki T.",
    role: "Digital Artist",
    rating: 5,
  },
  {
    quote: "Bought one for my dad's 60th - his favorite Fischer game. He cried. Worth every penny.",
    author: "Amanda P.",
    role: "Gift Buyer",
    rating: 5,
  },
  {
    quote: "As a FIDE master, I've seen many chess products. This is the first that feels like true art.",
    author: "GM Viktor S.",
    role: "FIDE Master",
    rating: 5,
  },
  {
    quote: "The animated GIF exports are stunning. Perfect for sharing my best games on social media.",
    author: "Chris B.",
    role: "Chess Streamer",
    rating: 5,
  },
  {
    quote: "Creative Mode lets me design exactly what I envision. The customization is unmatched.",
    author: "Michelle W.",
    role: "Graphic Designer",
    rating: 5,
  },
  {
    quote: "The marketplace is addictive. I've collected 15 unique visions already. Investment and art combined.",
    author: "Andrew K.",
    role: "Vision Collector",
    rating: 5,
  },
  {
    quote: "Teaching chess to kids just got exciting. They love seeing their games transformed into art.",
    author: "Patricia H.",
    role: "Chess Coach",
    rating: 5,
  },
];

const newsItems = [
  {
    date: "January 2026",
    title: "Natural Vision™ Recognition Launched",
    description: "Our proprietary pattern recognition technology can now identify any En Pensent print and instantly display its game details, provenance, and ownership history.",
    icon: Scan,
  },
  {
    date: "January 2026",
    title: "Carlsen in Color Book Pre-Orders Open",
    description: "100 of Magnus Carlsen's greatest games, each with AI-generated haiku poetry. Limited first edition of 1,000 copies with exclusive collector's box.",
    icon: BookOpen,
  },
  {
    date: "January 2026",
    title: "Vision Marketplace Goes Live",
    description: "Trade, collect, and discover unique chess visualizations. Built-in wallet system, royalty tracking, and secure ownership transfers.",
    icon: TrendingUp,
  },
  {
    date: "January 2026",
    title: "AI Poetry Generation",
    description: "Every famous game now features unique AI-generated poetry — haikus, couplets, and free verse that capture the essence of each battle.",
    icon: Sparkles,
  },
  {
    date: "January 2026",
    title: "Premium Framing Options",
    description: "Museum-quality frames now available: Walnut, Matte Black, Natural Oak, and Gold Gilded. Ships worldwide with white-glove service.",
    icon: Award,
  },
  {
    date: "December 2025",
    title: "Live Play Mode Released",
    description: "Play chess directly on En Pensent against opponents or our AI bot. Watch your artwork generate in real-time as you make moves.",
    icon: Gamepad2,
  },
  {
    date: "December 2025",
    title: "Education Fund Initiative",
    description: "A portion of every sale now contributes to chess education programs in underserved communities worldwide.",
    icon: Gift,
  },
  {
    date: "November 2025",
    title: "75+ Historic Games Library",
    description: "Explore and visualize legendary games spanning 500 years of chess history, from Ruy López to Magnus Carlsen's modern classics.",
    icon: Globe,
  },
  {
    date: "November 2025",
    title: "Visionary Membership Launch",
    description: "Premium tier unlocked: unlimited downloads, HD exports, exclusive palettes, priority printing, and early access to new features.",
    icon: Crown,
  },
  {
    date: "October 2025",
    title: "16 Curated Color Palettes",
    description: "From Japanese minimalism to Art Deco grandeur — each palette transforms your games into distinct visual experiences.",
    icon: Palette,
  },
];

const News = () => {
  // Get plenty of random art for all sections
  const backgroundImages = useRandomGameArt(16);
  
  // Randomly select 3 testimonials on each render
  const displayedTestimonials = useMemo(() => {
    const shuffled = [...allTestimonials].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 3);
  }, []);
  
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto space-y-16">
          {/* Hero */}
          <div className="text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-display uppercase tracking-widest">
              <Newspaper className="h-4 w-4" />
              News & Updates
            </div>
            <h1 className="text-4xl md:text-5xl font-royal font-bold uppercase tracking-wide">
              What's <span className="text-gold-gradient">New</span>
            </h1>
            <p className="text-lg text-muted-foreground font-serif leading-relaxed">
              The latest features, updates, and stories from the En Pensent community.
            </p>
          </div>
          
          {/* Testimonials */}
          <div className="space-y-8">
            <h2 className="text-2xl font-display font-bold uppercase tracking-wider text-center">
              Community <span className="text-gold-gradient">Voices</span>
            </h2>
            
            <div className="grid md:grid-cols-3 gap-6">
              {displayedTestimonials.map((testimonial, index) => (
                <div 
                  key={index}
                  className="relative p-6 rounded-lg border border-border/50 bg-card/50 space-y-4 overflow-hidden group hover:border-primary/40 transition-all duration-300"
                >
                  {backgroundImages[index] && (
                    <div 
                      className="absolute inset-0 opacity-[0.08] group-hover:opacity-[0.15] transition-opacity duration-500 bg-cover bg-center"
                      style={{ backgroundImage: `url(${backgroundImages[index]})` }}
                    />
                  )}
                  {/* Gradient overlay for readability */}
                  <div className="absolute inset-0 bg-gradient-to-t from-card via-card/80 to-transparent opacity-90" />
                  
                  <Quote className="h-8 w-8 text-primary/30 absolute top-4 right-4 z-10" />
                  
                  <div className="relative z-10 space-y-4">
                    <div className="flex gap-1">
                      {Array.from({ length: testimonial.rating }).map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                      ))}
                    </div>
                    
                    <p className="text-muted-foreground font-serif italic leading-relaxed">
                      "{testimonial.quote}"
                    </p>
                    
                    <div className="pt-2 border-t border-border/50">
                      <p className="font-display font-bold">{testimonial.author}</p>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">
                        {testimonial.role}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <p className="text-center text-xs text-muted-foreground/60 font-serif italic">
              Refresh to see more community voices
            </p>
          </div>
          
          {/* Latest News */}
          <div className="space-y-8">
            <h2 className="text-2xl font-display font-bold uppercase tracking-wider text-center">
              Latest <span className="text-gold-gradient">Updates</span>
            </h2>
            
            <div className="space-y-4">
              {newsItems.map((item, index) => {
                const Icon = item.icon;
                return (
                  <div 
                    key={index}
                    className="relative p-6 rounded-lg border border-border/50 bg-card/50 hover:border-primary/40 transition-all duration-300 overflow-hidden group"
                  >
                    {backgroundImages[3 + index] && (
                      <div 
                        className="absolute inset-0 opacity-[0.05] group-hover:opacity-[0.10] transition-opacity duration-500 bg-cover bg-center"
                        style={{ backgroundImage: `url(${backgroundImages[3 + index]})` }}
                      />
                    )}
                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-r from-card via-card/95 to-card/80" />
                    
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-4">
                      <div className="flex items-center gap-4 md:w-52 flex-shrink-0">
                        <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                          <Icon className="h-5 w-5 text-primary" />
                        </div>
                        <span className="text-xs uppercase tracking-wider text-primary font-medium">
                          {item.date}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <h3 className="font-display font-bold text-lg group-hover:text-primary transition-colors">{item.title}</h3>
                        <p className="text-muted-foreground font-serif text-sm leading-relaxed">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Community Stats */}
          <div className="relative p-8 rounded-xl border border-primary/30 bg-primary/5 overflow-hidden">
            {backgroundImages[14] && (
              <div 
                className="absolute inset-0 opacity-[0.06] bg-cover bg-center"
                style={{ backgroundImage: `url(${backgroundImages[14]})` }}
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-br from-card/90 via-card/80 to-transparent" />
            
            <div className="relative z-10 text-center space-y-6">
              <div className="flex items-center justify-center gap-2">
                <Users className="h-6 w-6 text-primary" />
                <h2 className="text-xl font-display font-bold uppercase tracking-wider">
                  Growing Community
                </h2>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                <div>
                  <p className="text-2xl md:text-3xl font-display font-bold text-primary">2,847</p>
                  <p className="text-xs text-muted-foreground font-serif uppercase tracking-wide">Active Visionaries</p>
                </div>
                <div>
                  <p className="text-2xl md:text-3xl font-display font-bold text-primary">75+</p>
                  <p className="text-xs text-muted-foreground font-serif uppercase tracking-wide">Historic Games</p>
                </div>
                <div>
                  <p className="text-2xl md:text-3xl font-display font-bold text-primary">16</p>
                  <p className="text-xs text-muted-foreground font-serif uppercase tracking-wide">Color Palettes</p>
                </div>
                <div>
                  <p className="text-2xl md:text-3xl font-display font-bold text-primary">$19.8K</p>
                  <p className="text-xs text-muted-foreground font-serif uppercase tracking-wide">ARR</p>
                </div>
                <div>
                  <p className="text-2xl md:text-3xl font-display font-bold text-primary">95%</p>
                  <p className="text-xs text-muted-foreground font-serif uppercase tracking-wide">Gross Margin</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* CTA */}
          <div className="relative text-center p-8 rounded-lg border border-primary/30 bg-primary/5 space-y-4 overflow-hidden">
            {backgroundImages[15] && (
              <div 
                className="absolute inset-0 opacity-[0.05] bg-cover bg-center"
                style={{ backgroundImage: `url(${backgroundImages[15]})` }}
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-card via-card/90 to-transparent" />
            
            <div className="relative z-10 space-y-4">
              <Crown className="h-10 w-10 text-primary mx-auto" />
              <h2 className="text-xl font-display font-bold uppercase tracking-wider">
                Join Our Story
              </h2>
              <p className="text-muted-foreground font-serif max-w-lg mx-auto">
                Create your own chess masterpiece today and become part of the En Pensent community.
              </p>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default News;
