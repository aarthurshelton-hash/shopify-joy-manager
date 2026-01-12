import { useMemo } from 'react';
import { Header } from '@/components/shop/Header';
import { Footer } from '@/components/shop/Footer';
import { Crown, Heart, Palette, Users, Lightbulb, Sparkles, Eye } from 'lucide-react';
import { useRandomGameArt } from '@/hooks/useRandomGameArt';

const About = () => {
  const backgroundImages = useRandomGameArt(4);
  
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto space-y-12">
          {/* Hero */}
          <div className="text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-display uppercase tracking-widest">
              <Crown className="h-4 w-4" />
              Our Story
            </div>
            <h1 className="text-4xl md:text-5xl font-royal font-bold uppercase tracking-wide">
              About <span className="text-gold-gradient">En Pensent</span>
            </h1>
            <p className="text-lg text-muted-foreground font-serif leading-relaxed">
              Where the timeless beauty of chess meets the art of visual storytelling.
            </p>
          </div>
          
          {/* Mission with background art */}
          <div className="relative space-y-4 p-6 rounded-xl border border-border/50 bg-card/80 overflow-hidden">
            {backgroundImages[0] && (
              <div 
                className="absolute inset-0 opacity-[0.04] bg-cover bg-center"
                style={{ backgroundImage: `url(${backgroundImages[0]})` }}
              />
            )}
            <div className="relative z-10">
              <h2 className="text-2xl font-display font-bold uppercase tracking-wider flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-primary" />
                Our Mission
              </h2>
              <p className="text-muted-foreground font-serif leading-relaxed mt-3">
                At En Pensent, we believe every chess game tells a unique story — a narrative of strategy, 
                sacrifice, and triumph. Our mission is to transform these invisible battles into stunning 
                visual art that you can hold, display, and treasure forever.
              </p>
              <p className="text-muted-foreground font-serif leading-relaxed mt-3">
                Whether it's a historic World Championship match, your first tournament victory, or a 
                casual game with a friend, we immortalize the journey of every piece across the board.
              </p>
            </div>
          </div>
          
          {/* The Concept */}
          <div className="relative space-y-4 p-6 rounded-xl border border-border/50 bg-card/80 overflow-hidden">
            {backgroundImages[1] && (
              <div 
                className="absolute inset-0 opacity-[0.04] bg-cover bg-center"
                style={{ backgroundImage: `url(${backgroundImages[1]})` }}
              />
            )}
            <div className="relative z-10">
              <h2 className="text-2xl font-display font-bold uppercase tracking-wider flex items-center gap-2">
                <Eye className="h-5 w-5 text-primary" />
                The Concept
              </h2>
              <p className="text-muted-foreground font-serif leading-relaxed mt-3">
                <strong className="text-foreground">"En Pensent"</strong> — a play on the French chess term 
                <em> en passant</em> — means "in thought." Every visualization captures the thinking behind 
                the moves: the patterns, the pressure points, the rhythm of attack and defense.
              </p>
              <p className="text-muted-foreground font-serif leading-relaxed mt-3">
                Our proprietary algorithm traces every piece's journey across the 64 squares, encoding 
                movement as color, building a layered artwork that reveals the soul of the game.
              </p>
            </div>
          </div>
          
          {/* Values */}
          <div className="grid md:grid-cols-3 gap-6">
            <div className="relative p-6 rounded-lg border border-border/50 bg-card/50 space-y-3 overflow-hidden group">
              {backgroundImages[2] && (
                <div 
                  className="absolute inset-0 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity bg-cover bg-center"
                  style={{ backgroundImage: `url(${backgroundImages[2]})` }}
                />
              )}
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Heart className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-display font-bold uppercase tracking-wide mt-3">Passion</h3>
                <p className="text-sm text-muted-foreground font-serif">
                  We're chess lovers first, artists second. Every visualization is crafted with deep respect for the game.
                </p>
              </div>
            </div>
            
            <div className="relative p-6 rounded-lg border border-border/50 bg-card/50 space-y-3 overflow-hidden group">
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Palette className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-display font-bold uppercase tracking-wide mt-3">Artistry</h3>
                <p className="text-sm text-muted-foreground font-serif">
                  Our color palettes and designs are meticulously curated to create museum-quality prints worthy of any wall.
                </p>
              </div>
            </div>
            
            <div className="relative p-6 rounded-lg border border-border/50 bg-card/50 space-y-3 overflow-hidden group">
              {backgroundImages[3] && (
                <div 
                  className="absolute inset-0 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity bg-cover bg-center"
                  style={{ backgroundImage: `url(${backgroundImages[3]})` }}
                />
              )}
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-display font-bold uppercase tracking-wide mt-3">Community</h3>
                <p className="text-sm text-muted-foreground font-serif">
                  Built by players, for players. We celebrate the global chess community in everything we do.
                </p>
              </div>
            </div>
          </div>
          
          {/* What We Offer */}
          <div className="space-y-4">
            <h2 className="text-2xl font-display font-bold uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              What We Offer
            </h2>
            <div className="grid gap-4">
              <div className="p-4 rounded-lg bg-card/50 border border-border/50">
                <h3 className="font-display font-bold text-sm uppercase tracking-wide text-primary">Visualization Engine</h3>
                <p className="text-sm text-muted-foreground font-serif mt-1">
                  Upload any PGN and watch your game transform into a unique piece of art in seconds.
                </p>
              </div>
              <div className="p-4 rounded-lg bg-card/50 border border-border/50">
                <h3 className="font-display font-bold text-sm uppercase tracking-wide text-primary">Play & Create</h3>
                <p className="text-sm text-muted-foreground font-serif mt-1">
                  Play live games against opponents or our AI bot, with your artwork generating in real-time.
                </p>
              </div>
              <div className="p-4 rounded-lg bg-card/50 border border-border/50">
                <h3 className="font-display font-bold text-sm uppercase tracking-wide text-primary">Creative Mode</h3>
                <p className="text-sm text-muted-foreground font-serif mt-1">
                  Deep customization options to design exactly the artwork you envision, piece by piece.
                </p>
              </div>
              <div className="p-4 rounded-lg bg-card/50 border border-border/50">
                <h3 className="font-display font-bold text-sm uppercase tracking-wide text-primary">Museum-Quality Prints</h3>
                <p className="text-sm text-muted-foreground font-serif mt-1">
                  Turn any visualization into a physical masterpiece with our premium printing partners.
                </p>
              </div>
            </div>
          </div>
          
          {/* Contact */}
          <div className="text-center p-8 rounded-lg border border-border/50 bg-card/50 space-y-4">
            <h2 className="text-xl font-display font-bold uppercase tracking-wider">Get in Touch</h2>
            <p className="text-muted-foreground font-serif">
              Have questions, ideas, or partnership opportunities? We'd love to hear from you.
            </p>
            <p className="text-primary font-medium">hello@enpensent.com</p>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default About;
