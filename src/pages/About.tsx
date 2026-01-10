import { Header } from '@/components/shop/Header';
import { Crown, Heart, Palette, Users } from 'lucide-react';

const About = () => {
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
          
          {/* Mission */}
          <div className="space-y-4">
            <h2 className="text-2xl font-display font-bold uppercase tracking-wider">Our Mission</h2>
            <p className="text-muted-foreground font-serif leading-relaxed">
              At En Pensent, we believe every chess game tells a unique story — a narrative of strategy, 
              sacrifice, and triumph. Our mission is to transform these invisible battles into stunning 
              visual art that you can hold, display, and treasure forever.
            </p>
            <p className="text-muted-foreground font-serif leading-relaxed">
              Whether it's a historic World Championship match or your very first victory, 
              we immortalize the journey of every piece across the board.
            </p>
          </div>
          
          {/* Values */}
          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-6 rounded-lg border border-border/50 bg-card/50 space-y-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Heart className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-display font-bold uppercase tracking-wide">Passion</h3>
              <p className="text-sm text-muted-foreground font-serif">
                We're chess lovers first, artists second. Every visualization is crafted with deep respect for the game.
              </p>
            </div>
            
            <div className="p-6 rounded-lg border border-border/50 bg-card/50 space-y-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Palette className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-display font-bold uppercase tracking-wide">Artistry</h3>
              <p className="text-sm text-muted-foreground font-serif">
                Our color palettes and designs are meticulously curated to create museum-quality prints.
              </p>
            </div>
            
            <div className="p-6 rounded-lg border border-border/50 bg-card/50 space-y-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-display font-bold uppercase tracking-wide">Community</h3>
              <p className="text-sm text-muted-foreground font-serif">
                Built by players, for players. We celebrate the global chess community in everything we do.
              </p>
            </div>
          </div>
          
          {/* Contact */}
          <div className="text-center p-8 rounded-lg border border-border/50 bg-card/50 space-y-4">
            <h2 className="text-xl font-display font-bold uppercase tracking-wider">Get in Touch</h2>
            <p className="text-muted-foreground font-serif">
              Have questions, ideas, or just want to say hello? We'd love to hear from you.
            </p>
            <p className="text-primary font-medium">hello@enpensent.com</p>
          </div>
        </div>
      </main>
      
      {/* Footer */}
      <footer className="border-t border-border/50 mt-20 bg-card/30">
        <div className="container mx-auto px-4 py-10 text-center space-y-3">
          <p className="text-lg font-royal font-bold tracking-widest uppercase text-gold-gradient">
            ♔ En Pensent ♚
          </p>
          <p className="text-xs text-muted-foreground tracking-widest uppercase font-sans">
            Turn every move into a masterpiece
          </p>
        </div>
      </footer>
    </div>
  );
};

export default About;
