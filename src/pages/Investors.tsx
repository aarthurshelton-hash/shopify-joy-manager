import { useState } from 'react';
import { Header } from '@/components/shop/Header';
import { Footer } from '@/components/shop/Footer';
import { Crown, TrendingUp, Globe, Zap, Target, Download, ChevronRight, FileText, Presentation } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

type ModalType = 'market' | 'technology' | 'vision' | 'brand' | null;

const Investors = () => {
  const [activeModal, setActiveModal] = useState<ModalType>(null);

  const MetricCard = ({ 
    icon: Icon, 
    title, 
    description, 
    cta, 
    onClick 
  }: { 
    icon: typeof Globe; 
    title: string; 
    description: string; 
    cta: string;
    onClick: () => void;
  }) => (
    <button 
      onClick={onClick}
      className="p-6 rounded-lg border border-border/50 bg-card/50 space-y-3 text-left transition-all hover:border-primary/50 hover:bg-card/80 group cursor-pointer"
    >
      <div className="flex items-start justify-between">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
          <Icon className="h-6 w-6 text-primary" />
        </div>
        <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
      </div>
      <h3 className="font-display font-bold uppercase tracking-wide">{title}</h3>
      <p className="text-sm text-muted-foreground font-serif">{description}</p>
      <span className="text-xs text-primary font-medium uppercase tracking-wide">{cta} →</span>
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
            />
            
            <MetricCard
              icon={Zap}
              title="Unique Technology"
              description="Proprietary visualization algorithms that transform PGN data into stunning, one-of-a-kind art."
              cta="Learn More"
              onClick={() => setActiveModal('technology')}
            />
            
            <MetricCard
              icon={Target}
              title="Clear Vision"
              description="Expanding into licensed partnerships, limited editions, and physical retail presence."
              cta="View Roadmap"
              onClick={() => setActiveModal('vision')}
            />
            
            <MetricCard
              icon={Crown}
              title="Premium Brand"
              description="Positioned as the definitive chess art brand with museum-quality products."
              cta="Brand Strategy"
              onClick={() => setActiveModal('brand')}
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
                  </ul>
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
