import { useState } from 'react';
import { Header } from '@/components/shop/Header';
import { Footer } from '@/components/shop/Footer';
import { Crown, TrendingUp, Globe, Zap, Target, Download, X, ChevronRight } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

const Investors = () => {
  const [showTamReport, setShowTamReport] = useState(false);

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
            {/* Global Market - Clickable */}
            <button 
              onClick={() => setShowTamReport(true)}
              className="p-6 rounded-lg border border-border/50 bg-card/50 space-y-3 text-left transition-all hover:border-primary/50 hover:bg-card/80 group cursor-pointer"
            >
              <div className="flex items-start justify-between">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Globe className="h-6 w-6 text-primary" />
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <h3 className="font-display font-bold uppercase tracking-wide">Global Market</h3>
              <p className="text-sm text-muted-foreground font-serif">
                Access to 800M+ chess players worldwide, with the market growing 25% year-over-year.
              </p>
              <span className="text-xs text-primary font-medium uppercase tracking-wide">View TAM Report →</span>
            </button>
            
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

          {/* TAM Report Modal */}
          <Dialog open={showTamReport} onOpenChange={setShowTamReport}>
            <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto bg-card border-border">
              <DialogHeader>
                <DialogTitle className="text-2xl font-display uppercase tracking-wider text-gold-gradient">
                  Total Addressable Market
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-6 py-4">
                {/* Product Summary */}
                <div className="space-y-3">
                  <h3 className="font-display font-bold uppercase tracking-wide text-primary">The Product</h3>
                  <p className="text-sm text-muted-foreground font-serif">
                    A chess game visualizer that transforms annotated games into color-coded, motion-implied artworks—merging chess analysis, data visualization, and personalized art.
                  </p>
                </div>

                {/* Market Size */}
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

                {/* Key Points */}
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

                {/* Why Investors Like It */}
                <div className="space-y-3">
                  <h3 className="font-display font-bold uppercase tracking-wide text-primary">Investment Thesis</h3>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2 text-sm text-muted-foreground font-serif">
                      <ChevronRight className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      Bottom-up, defensible market sizing
                    </li>
                    <li className="flex items-start gap-2 text-sm text-muted-foreground font-serif">
                      <ChevronRight className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      Natural virality — users share their visualizations
                    </li>
                    <li className="flex items-start gap-2 text-sm text-muted-foreground font-serif">
                      <ChevronRight className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      Cultural tailwinds from chess streaming boom
                    </li>
                    <li className="flex items-start gap-2 text-sm text-muted-foreground font-serif">
                      <ChevronRight className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      Emotionally-driven purchase behavior (achievement + gifting)
                    </li>
                  </ul>
                </div>

                {/* Download CTA */}
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
