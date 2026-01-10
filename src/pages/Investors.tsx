import { Header } from '@/components/shop/Header';
import { Footer } from '@/components/shop/Footer';
import { Crown, TrendingUp, Globe, Zap, Target } from 'lucide-react';

const Investors = () => {
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
            <div className="p-6 rounded-lg border border-border/50 bg-card/50 space-y-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Globe className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-display font-bold uppercase tracking-wide">Global Market</h3>
              <p className="text-sm text-muted-foreground font-serif">
                Access to 800M+ chess players worldwide, with the market growing 25% year-over-year.
              </p>
            </div>
            
            <div className="p-6 rounded-lg border border-border/50 bg-card/50 space-y-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-display font-bold uppercase tracking-wide">Unique Technology</h3>
              <p className="text-sm text-muted-foreground font-serif">
                Proprietary visualization algorithms that transform PGN data into stunning, one-of-a-kind art.
              </p>
            </div>
            
            <div className="p-6 rounded-lg border border-border/50 bg-card/50 space-y-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Target className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-display font-bold uppercase tracking-wide">Clear Vision</h3>
              <p className="text-sm text-muted-foreground font-serif">
                Expanding into licensed partnerships, limited editions, and physical retail presence.
              </p>
            </div>
            
            <div className="p-6 rounded-lg border border-border/50 bg-card/50 space-y-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Crown className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-display font-bold uppercase tracking-wide">Premium Brand</h3>
              <p className="text-sm text-muted-foreground font-serif">
                Positioned as the definitive chess art brand with museum-quality products.
              </p>
            </div>
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
