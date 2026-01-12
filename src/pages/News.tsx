import { useMemo } from 'react';
import { Header } from '@/components/shop/Header';
import { Footer } from '@/components/shop/Footer';
import { Crown, Quote, Star, Newspaper, Rocket, Palette, Gamepad2, Users, Zap, Globe } from 'lucide-react';
import { useRandomGameArt } from '@/hooks/useRandomGameArt';

const testimonials = [
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
];

const newsItems = [
  {
    date: "January 2026",
    title: "Live Play Mode Now Available",
    description: "Play chess directly on En Pensent against opponents or our AI bot, with your artwork generating in real-time as you make moves.",
    icon: Gamepad2,
  },
  {
    date: "January 2026",
    title: "Creative Mode Launch",
    description: "Deep customization now available — place pieces, choose palettes, and design your perfect visualization from scratch.",
    icon: Palette,
  },
  {
    date: "December 2025",
    title: "My Vision Gallery Goes Live",
    description: "Premium members can now save unlimited visualizations to their personal gallery, accessible anytime.",
    icon: Crown,
  },
  {
    date: "November 2025",
    title: "75+ Historic Games Library",
    description: "Explore and visualize legendary games spanning 500 years of chess history, from Ruy López to Magnus Carlsen.",
    icon: Globe,
  },
  {
    date: "October 2025",
    title: "Custom Palette Creator",
    description: "Design and save your own color palettes to apply to any visualization. Share with the community or keep them private.",
    icon: Zap,
  },
];

const News = () => {
  const backgroundImages = useRandomGameArt(6);
  
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
              {testimonials.map((testimonial, index) => (
                <div 
                  key={index}
                  className="relative p-6 rounded-lg border border-border/50 bg-card/50 space-y-4 overflow-hidden group"
                >
                  {backgroundImages[index] && (
                    <div 
                      className="absolute inset-0 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity bg-cover bg-center"
                      style={{ backgroundImage: `url(${backgroundImages[index]})` }}
                    />
                  )}
                  <Quote className="h-8 w-8 text-primary/20 absolute top-4 right-4" />
                  
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
          </div>
          
          {/* Latest News */}
          <div className="space-y-8">
            <h2 className="text-2xl font-display font-bold uppercase tracking-wider text-center">
              Latest <span className="text-gold-gradient">Updates</span>
            </h2>
            
            <div className="space-y-6">
              {newsItems.map((item, index) => {
                const Icon = item.icon;
                return (
                  <div 
                    key={index}
                    className="relative p-6 rounded-lg border border-border/50 bg-card/50 hover:border-primary/30 transition-colors overflow-hidden group"
                  >
                    {backgroundImages[3 + (index % 3)] && (
                      <div 
                        className="absolute inset-0 opacity-[0.02] group-hover:opacity-[0.04] transition-opacity bg-cover bg-center"
                        style={{ backgroundImage: `url(${backgroundImages[3 + (index % 3)]})` }}
                      />
                    )}
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-4">
                      <div className="flex items-center gap-4 md:w-48 flex-shrink-0">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Icon className="h-5 w-5 text-primary" />
                        </div>
                        <span className="text-xs uppercase tracking-wider text-primary font-medium">
                          {item.date}
                        </span>
                      </div>
                      <div className="space-y-2">
                        <h3 className="font-display font-bold text-lg">{item.title}</h3>
                        <p className="text-muted-foreground font-serif">
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
            {backgroundImages[5] && (
              <div 
                className="absolute inset-0 opacity-[0.03] bg-cover bg-center"
                style={{ backgroundImage: `url(${backgroundImages[5]})` }}
              />
            )}
            <div className="relative z-10 text-center space-y-6">
              <div className="flex items-center justify-center gap-2">
                <Users className="h-6 w-6 text-primary" />
                <h2 className="text-xl font-display font-bold uppercase tracking-wider">
                  Growing Community
                </h2>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <p className="text-2xl md:text-3xl font-display font-bold text-primary">75+</p>
                  <p className="text-xs text-muted-foreground font-serif uppercase tracking-wide">Historic Games</p>
                </div>
                <div>
                  <p className="text-2xl md:text-3xl font-display font-bold text-primary">16</p>
                  <p className="text-xs text-muted-foreground font-serif uppercase tracking-wide">Color Palettes</p>
                </div>
                <div>
                  <p className="text-2xl md:text-3xl font-display font-bold text-primary">6</p>
                  <p className="text-xs text-muted-foreground font-serif uppercase tracking-wide">Print Sizes</p>
                </div>
                <div>
                  <p className="text-2xl md:text-3xl font-display font-bold text-primary">∞</p>
                  <p className="text-xs text-muted-foreground font-serif uppercase tracking-wide">Unique Artworks</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* CTA */}
          <div className="text-center p-8 rounded-lg border border-primary/30 bg-primary/5 space-y-4">
            <Crown className="h-10 w-10 text-primary mx-auto" />
            <h2 className="text-xl font-display font-bold uppercase tracking-wider">
              Join Our Story
            </h2>
            <p className="text-muted-foreground font-serif max-w-lg mx-auto">
              Create your own chess masterpiece today and become part of the En Pensent community.
            </p>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default News;
