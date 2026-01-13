import { useMemo } from 'react';
import { Header } from '@/components/shop/Header';
import { Footer } from '@/components/shop/Footer';
import { Crown, Heart, Palette, Users, Lightbulb, Sparkles, Eye, ScanLine, QrCode, Camera, Fingerprint, DollarSign, Building2, PenTool } from 'lucide-react';
import { useRandomGameArt } from '@/hooks/useRandomGameArt';
import { Badge } from '@/components/ui/badge';
import { RoyaltyCalculator } from '@/components/calculator/RoyaltyCalculator';

const About = () => {
  const backgroundImages = useRandomGameArt(6);
  
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
                className="absolute inset-0 opacity-[0.12] bg-cover bg-center"
                style={{ backgroundImage: `url(${backgroundImages[0]})` }}
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-br from-background/70 to-background/85" />
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
                className="absolute inset-0 opacity-[0.12] bg-cover bg-center"
                style={{ backgroundImage: `url(${backgroundImages[1]})` }}
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-br from-background/70 to-background/85" />
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

          {/* The Art of Haiku */}
          <div className="relative space-y-4 p-6 rounded-xl border border-border/50 bg-card/80 overflow-hidden">
            {backgroundImages[2] && (
              <div 
                className="absolute inset-0 opacity-[0.12] bg-cover bg-center"
                style={{ backgroundImage: `url(${backgroundImages[2]})` }}
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-br from-background/70 to-background/85" />
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-2xl font-display font-bold uppercase tracking-wider flex items-center gap-2">
                  <PenTool className="h-5 w-5 text-primary" />
                  The Art of Haiku
                </h2>
                <Badge className="bg-primary/20 text-primary border-primary/30">
                  Poetry
                </Badge>
              </div>
              <p className="text-muted-foreground font-serif leading-relaxed mt-3">
                Each En Pensent visualization is paired with a <strong className="text-foreground">unique haiku</strong> — 
                a seventeen-syllable poem that distills the essence of the game into three contemplative lines. 
                This ancient Japanese art form mirrors the precision and elegance of chess itself.
              </p>
              <p className="text-muted-foreground font-serif leading-relaxed mt-3">
                Our haikus capture the emotional arc of each battle: the tension of the opening, the drama of 
                the middlegame, and the resolution of the endgame. They transform tactical moments into meditative 
                reflections, giving voice to the silent struggle on the board.
              </p>
              
              <div className="mt-6 p-4 rounded-lg bg-primary/5 border border-primary/20">
                <p className="text-center font-serif italic text-foreground leading-relaxed">
                  "Pawns march like soldiers,<br />
                  A queen's sacrifice blooms bright—<br />
                  Checkmate, silent art."
                </p>
                <p className="text-center text-xs text-muted-foreground mt-3 font-display uppercase tracking-wider">
                  — Example haiku from "The Immortal Game"
                </p>
              </div>

              <p className="text-muted-foreground font-serif leading-relaxed mt-4">
                Whether adorning our <strong className="text-foreground">"Carlsen in Color"</strong> coffee table book 
                or accompanying individual prints, these poems elevate chess visualization from digital art to 
                a complete sensory experience — visual, intellectual, and poetic.
              </p>
            </div>
          </div>

          <div className="relative space-y-4 p-6 rounded-xl border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-amber-500/5 overflow-hidden">
            {backgroundImages[4] && (
              <div 
                className="absolute inset-0 opacity-[0.15] bg-cover bg-center"
                style={{ backgroundImage: `url(${backgroundImages[4]})` }}
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-br from-background/60 to-background/80" />
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <h2 className="text-2xl font-display font-bold uppercase tracking-wider flex items-center gap-2">
                  <ScanLine className="h-5 w-5 text-primary" />
                  Natural QR Vision™
                </h2>
                <Badge className="bg-primary/20 text-primary border-primary/30">
                  <Sparkles className="h-3 w-3 mr-1" />
                  Innovation
                </Badge>
              </div>
              
              <p className="text-muted-foreground font-serif leading-relaxed">
                Every En Pensent visualization is more than art — it's a <strong className="text-foreground">scannable digital fingerprint</strong>. 
                The unique pattern of colors and positions created by each game forms a natural visual signature 
                that can be recognized and linked back to its complete game data.
              </p>
              
              <div className="grid sm:grid-cols-3 gap-4 mt-6">
                <div className="p-4 rounded-lg bg-background/50 border border-border/50 text-center space-y-2">
                  <div className="w-10 h-10 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                    <Camera className="h-5 w-5 text-primary" />
                  </div>
                  <h4 className="font-display text-sm font-bold uppercase">Scan</h4>
                  <p className="text-xs text-muted-foreground font-serif">
                    Point any camera at a vision print or image
                  </p>
                </div>
                
                <div className="p-4 rounded-lg bg-background/50 border border-border/50 text-center space-y-2">
                  <div className="w-10 h-10 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                    <Fingerprint className="h-5 w-5 text-primary" />
                  </div>
                  <h4 className="font-display text-sm font-bold uppercase">Recognize</h4>
                  <p className="text-xs text-muted-foreground font-serif">
                    Pattern recognition identifies the unique game signature
                  </p>
                </div>
                
                <div className="p-4 rounded-lg bg-background/50 border border-border/50 text-center space-y-2">
                  <div className="w-10 h-10 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                    <QrCode className="h-5 w-5 text-primary" />
                  </div>
                  <h4 className="font-display text-sm font-bold uppercase">Connect</h4>
                  <p className="text-xs text-muted-foreground font-serif">
                    Instantly access game data, analytics, and Vision Score
                  </p>
                </div>
              </div>
              
              <div className="mt-6 p-4 rounded-lg bg-primary/5 border border-primary/20">
                <h4 className="font-display text-sm font-bold uppercase text-primary mb-2">
                  Physical-to-Digital Bridge
                </h4>
                <p className="text-sm text-muted-foreground font-serif">
                  Premium prints include a subtle gold QR code as a fallback, but the visualization itself 
                  <em> is</em> the code. Every print becomes a gateway: scan it to reveal the complete game history, 
                  move-by-move replay, creator profile, and real-time Vision Score analytics. 
                  <strong className="text-foreground"> Art that remembers its story.</strong>
                </p>
              </div>
              
              <div className="mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <p className="text-sm font-serif text-amber-600">
                  <strong>Coming Soon:</strong> Mobile camera scanning for instant vision recognition. 
                  Point, scan, explore — no QR code needed.
                </p>
              </div>
            </div>
          </div>
          
          {/* Values */}
          <div className="grid md:grid-cols-3 gap-6">
            <div className="relative p-6 rounded-lg border border-border/50 bg-card/50 space-y-3 overflow-hidden group">
              {backgroundImages[2] && (
                <div 
                  className="absolute inset-0 opacity-[0.10] group-hover:opacity-[0.18] transition-opacity bg-cover bg-center"
                  style={{ backgroundImage: `url(${backgroundImages[2]})` }}
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-br from-background/70 to-background/85" />
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
              {backgroundImages[5] && (
                <div 
                  className="absolute inset-0 opacity-[0.10] group-hover:opacity-[0.18] transition-opacity bg-cover bg-center"
                  style={{ backgroundImage: `url(${backgroundImages[5]})` }}
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-br from-background/70 to-background/85" />
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
                  className="absolute inset-0 opacity-[0.10] group-hover:opacity-[0.18] transition-opacity bg-cover bg-center"
                  style={{ backgroundImage: `url(${backgroundImages[3]})` }}
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-br from-background/70 to-background/85" />
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
          
          {/* Platform Economics */}
          <div className="relative space-y-4 p-6 rounded-xl border-2 border-green-500/30 bg-gradient-to-br from-green-500/5 to-emerald-500/5 overflow-hidden">
            {backgroundImages[5] && (
              <div 
                className="absolute inset-0 opacity-[0.10] bg-cover bg-center"
                style={{ backgroundImage: `url(${backgroundImages[5]})` }}
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-br from-background/70 to-background/85" />
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <h2 className="text-2xl font-display font-bold uppercase tracking-wider flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-green-500" />
                  Creator Economics
                </h2>
                <Badge className="bg-green-500/20 text-green-600 border-green-500/30">
                  Transparent
                </Badge>
              </div>
              
              <p className="text-muted-foreground font-serif leading-relaxed">
                We believe in <strong className="text-foreground">sustainable creator rewards</strong>. When others order 
                prints of your visions, you earn royalties automatically — passive income from your chess art collection.
              </p>
              
              <div className="grid sm:grid-cols-2 gap-4 mt-6">
                <div className="p-4 rounded-lg bg-background/50 border border-border/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-display text-sm font-bold uppercase flex items-center gap-2">
                      <Heart className="h-4 w-4 text-green-500" />
                      Creator Royalty
                    </h4>
                    <span className="text-2xl font-bold text-green-500">20%</span>
                  </div>
                  <p className="text-xs text-muted-foreground font-serif">
                    Direct to you when others order prints of your visions. Tracked automatically, paid monthly.
                  </p>
                </div>
                
                <div className="p-4 rounded-lg bg-background/50 border border-border/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-display text-sm font-bold uppercase flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      Platform & Fulfillment
                    </h4>
                    <span className="text-2xl font-bold text-muted-foreground">80%</span>
                  </div>
                  <p className="text-xs text-muted-foreground font-serif">
                    Covers printing, shipping, payment processing, customer support, and platform operations.
                  </p>
                </div>
              </div>
              
              <div className="mt-6 p-4 rounded-lg bg-green-500/5 border border-green-500/20">
                <h4 className="font-display text-sm font-bold uppercase text-green-600 mb-2">
                  Why 20% Creator Royalties?
                </h4>
                <p className="text-sm text-muted-foreground font-serif">
                  Physical print fulfillment involves significant costs: high-quality archival printing, protective 
                  packaging, global shipping, payment processing fees, and customer service. Our 80/20 split ensures 
                  <strong className="text-foreground"> sustainable growth</strong> while still rewarding creators with meaningful 
                  passive income. As our platform scales, we're committed to exploring ways to increase creator share.
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
                  Upload any PGN and watch your game transform into a unique piece of art in seconds. Each visualization is one-of-a-kind, encoded from your exact move sequence.
                </p>
              </div>
              <div className="p-4 rounded-lg bg-card/50 border border-border/50">
                <h3 className="font-display font-bold text-sm uppercase tracking-wide text-primary">Play & Create</h3>
                <p className="text-sm text-muted-foreground font-serif mt-1">
                  Play live games against opponents or our AI bot. Your artwork generates in real-time as you play—watch strategy become art, move by move.
                </p>
              </div>
              <div className="p-4 rounded-lg bg-card/50 border border-border/50">
                <h3 className="font-display font-bold text-sm uppercase tracking-wide text-primary">Creative Mode</h3>
                <p className="text-sm text-muted-foreground font-serif mt-1">
                  Full customization with 16 curated palettes and piece-by-piece color control. Design visualizations that match your aesthetic vision.
                </p>
              </div>
              <div className="p-4 rounded-lg bg-card/50 border border-border/50">
                <h3 className="font-display font-bold text-sm uppercase tracking-wide text-primary">Museum-Quality Prints</h3>
                <p className="text-sm text-muted-foreground font-serif mt-1">
                  Premium archival prints from 8×10 to 24×36. Gallery-ready framing options. Production-cost pricing with 0% markup.
                </p>
              </div>
              <div className="p-4 rounded-lg bg-gradient-to-r from-primary/5 to-amber-500/5 border-2 border-primary/30">
                <div className="flex items-center gap-2">
                  <h3 className="font-display font-bold text-sm uppercase tracking-wide text-primary">Natural QR Vision™</h3>
                  <Badge className="bg-amber-500/20 text-amber-600 border-amber-500/30 text-xs">New</Badge>
                </div>
                <p className="text-sm text-muted-foreground font-serif mt-1">
                  Every visualization is a scannable fingerprint. Point a camera at any print and instantly access the game's complete history, analytics, and Vision Score. Art that remembers its story.
                </p>
              </div>
              <div className="p-4 rounded-lg bg-card/50 border border-border/50">
                <h3 className="font-display font-bold text-sm uppercase tracking-wide text-primary">Vision Marketplace</h3>
                <p className="text-sm text-muted-foreground font-serif mt-1">
                  Trade, sell, or collect visualizations. 0% platform commission on trades—100% of sale value goes to sellers. Transparent Vision Scores track cultural impact.
                </p>
              </div>
              <div className="p-4 rounded-lg bg-gradient-to-r from-green-500/5 to-emerald-500/5 border border-green-500/30">
                <div className="flex items-center gap-2">
                  <h3 className="font-display font-bold text-sm uppercase tracking-wide text-green-600">20% Print Royalties</h3>
                  <Badge className="bg-green-500/20 text-green-600 border-green-500/30 text-xs">Passive Income</Badge>
                </div>
                <p className="text-sm text-muted-foreground font-serif mt-1">
                  Own a vision? Earn 20% every time someone else orders a print. Royalties are tracked automatically and accumulate in your account.
                </p>
              </div>
              <div className="p-4 rounded-lg bg-card/50 border border-border/50">
                <h3 className="font-display font-bold text-sm uppercase tracking-wide text-primary">Visionary Premium</h3>
                <p className="text-sm text-muted-foreground font-serif mt-1">
                  $7/month membership: watermark-free HD downloads, personal gallery storage, priority print access, and marketplace selling privileges.
                </p>
              </div>
            </div>
          </div>
          
          {/* Royalty Calculator */}
          <RoyaltyCalculator />
          
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
