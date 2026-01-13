import { useState, useEffect, forwardRef } from "react";
import { motion } from "framer-motion";
import { Scan, Camera, Fingerprint, Link2, Sparkles, TrendingUp, Users, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import AnimatedVisualizationPreview from "@/components/chess/AnimatedVisualizationPreview";
import { famousGames } from "@/lib/chess/famousGames";

// Import AI art for background accents
import chessKingArt from "@/assets/chess-king-art.jpg";
import chessMovementArt from "@/assets/chess-movement-art.jpg";
import heroChessArt from "@/assets/hero-chess-art.jpg";

export const NaturalQRShowcase = forwardRef<HTMLElement, Record<string, never>>(function NaturalQRShowcase(_props, ref) {
  const navigate = useNavigate();
  const [demoStep, setDemoStep] = useState(0);

  // Get The Immortal Game PGN
  const immortalGame = famousGames.find(g => g.id === 'anderssen-kieseritzky-1851');
  const gamePgn = immortalGame?.pgn || famousGames[0].pgn;
  const gameTitle = immortalGame?.title || "The Immortal Game";

  // Animate through demo steps
  useEffect(() => {
    const interval = setInterval(() => {
      setDemoStep((prev) => (prev + 1) % 4);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const demoSteps = [
    { icon: Camera, title: "Capture", desc: "Photograph any En Pensent vision" },
    { icon: Fingerprint, title: "Analyze", desc: "AI reads the unique color fingerprint" },
    { icon: Link2, title: "Connect", desc: "Instantly link to digital page" },
    { icon: TrendingUp, title: "Score", desc: "Every scan increases Vision Score" },
  ];

  return (
    <section ref={ref} className="relative py-16 md:py-24 overflow-hidden">
      {/* AI Art Background Layers */}
      <div className="absolute -left-32 top-1/4 w-96 h-96 opacity-10 blur-sm pointer-events-none rotate-12">
        <img 
          src={chessKingArt} 
          alt="" 
          className="w-full h-full object-cover rounded-full"
        />
      </div>
      
      <div className="absolute -right-24 bottom-1/3 w-80 h-80 opacity-8 blur-sm pointer-events-none -rotate-12">
        <img 
          src={chessMovementArt} 
          alt="" 
          className="w-full h-full object-cover rounded-full"
        />
      </div>
      
      <div className="absolute left-1/2 -translate-x-1/2 top-0 w-full h-48 opacity-5 pointer-events-none">
        <img 
          src={heroChessArt} 
          alt="" 
          className="w-full h-full object-cover"
        />
      </div>
      
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-background pointer-events-none" />
      
      {/* Decorative particles */}
      <div className="absolute top-20 left-1/4 w-2 h-2 bg-primary/40 rounded-full animate-pulse" />
      <div className="absolute top-1/3 right-1/4 w-1.5 h-1.5 bg-gold/40 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />
      <div className="absolute bottom-32 left-1/3 w-2.5 h-2.5 bg-primary/30 rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
      
      <div className="relative container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-display uppercase tracking-widest mb-6"
            >
              <Sparkles className="h-4 w-4" />
              Revolutionary Technology
              <Badge variant="secondary" className="ml-2 text-xs">Patent Pending</Badge>
            </motion.div>
            
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-3xl md:text-5xl font-royal font-bold uppercase tracking-wide mb-4"
            >
              Natural Vision™
            </motion.h2>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-muted-foreground text-lg max-w-2xl mx-auto"
            >
              Every visualization is visually encrypted with its own data — 
              a unique fingerprint that our AI can recognize instantly.
            </motion.p>
          </div>

          {/* Main showcase grid */}
          <div className="grid md:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left: Animated Visualization Demo */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="relative aspect-square max-w-sm mx-auto">
                {/* Glowing backdrop */}
                <div className="absolute -inset-4 bg-gradient-to-br from-primary/20 via-gold/10 to-primary/20 rounded-2xl blur-xl opacity-50" />
                
                {/* Scanning overlay effect */}
                <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden rounded-xl">
                  <motion.div
                    className="absolute w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-80"
                    animate={{
                      top: ["0%", "100%"],
                    }}
                    transition={{
                      duration: 2.5,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  />
                </div>

                {/* The animated visualization - simulates GIF playback */}
                <div className="relative bg-card rounded-xl border border-border shadow-2xl overflow-hidden">
                  <AnimatedVisualizationPreview
                    pgn={gamePgn}
                    size={320}
                    animationSpeed={120}
                    className="w-full h-auto"
                  />
                  
                  {/* Corner brackets overlay - scanner viewfinder effect */}
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-2 left-2 w-6 h-6 border-l-2 border-t-2 border-primary/70" />
                    <div className="absolute top-2 right-2 w-6 h-6 border-r-2 border-t-2 border-primary/70" />
                    <div className="absolute bottom-2 left-2 w-6 h-6 border-l-2 border-b-2 border-primary/70" />
                    <div className="absolute bottom-2 right-2 w-6 h-6 border-r-2 border-b-2 border-primary/70" />
                  </div>
                </div>

                {/* Pattern info overlay */}
                <motion.div
                  className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-card/95 backdrop-blur-sm px-5 py-2.5 rounded-full border border-primary/30 shadow-lg"
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <span className="text-sm font-medium text-gold-gradient">{gameTitle}</span>
                </motion.div>

                {/* Fingerprint visualization lines */}
                <div className="absolute -right-10 top-1/2 -translate-y-1/2 flex flex-col gap-1.5">
                  {[...Array(8)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="h-1 bg-gradient-to-r from-primary/60 to-gold/40 rounded-full"
                      initial={{ width: 20 }}
                      animate={{ 
                        width: [20, 40 + Math.random() * 30, 20],
                        opacity: [0.4, 0.9, 0.4]
                      }}
                      transition={{ 
                        duration: 1.5, 
                        delay: i * 0.1, 
                        repeat: Infinity 
                      }}
                    />
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Right: Process Steps + CTA */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-8"
            >
              {/* Process steps with AI art backgrounds */}
              <div className="grid grid-cols-2 gap-4">
                {demoSteps.map((step, index) => {
                  const Icon = step.icon;
                  const isActive = demoStep === index;
                  const bgImages = [chessKingArt, chessMovementArt, heroChessArt, chessKingArt];
                  
                  return (
                    <motion.div
                      key={step.title}
                      className={`relative p-4 rounded-xl border transition-all duration-300 overflow-hidden ${
                        isActive 
                          ? "bg-primary/10 border-primary/30 shadow-lg shadow-primary/10" 
                          : "bg-card/50 border-border/50"
                      }`}
                      animate={{
                        scale: isActive ? 1.02 : 1,
                      }}
                    >
                      {/* Subtle AI art background */}
                      <div 
                        className={`absolute inset-0 opacity-[0.08] pointer-events-none transition-opacity duration-500 ${isActive ? 'opacity-[0.12]' : ''}`}
                      >
                        <img 
                          src={bgImages[index]} 
                          alt="" 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      
                      <div className="relative z-10">
                        <Icon className={`h-6 w-6 mb-2 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                        <h4 className={`font-semibold ${isActive ? "text-foreground" : "text-muted-foreground"}`}>
                          {step.title}
                        </h4>
                        <p className="text-xs text-muted-foreground mt-1">{step.desc}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Value proposition with AI art accent */}
              <div className="relative bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl p-6 border border-primary/20 overflow-hidden">
                {/* Subtle background art */}
                <div className="absolute inset-0 opacity-[0.06] pointer-events-none">
                  <img 
                    src={heroChessArt} 
                    alt="" 
                    className="w-full h-full object-cover"
                  />
                </div>
                
                <div className="relative z-10 flex items-start gap-4">
                  <div className="p-2 bg-primary/20 rounded-lg">
                    <Crown className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Early Visionary Advantage</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Every scan, view, and engagement increases your Vision's score. 
                      As our community grows, early visions become more valuable — 
                      <span className="text-primary font-medium"> your art appreciates with our platform.</span>
                    </p>
                  </div>
                </div>
                
                <div className="relative z-10 mt-4 pt-4 border-t border-primary/20 flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1.5">
                    <Users className="h-4 w-4 text-primary" />
                    <span className="text-muted-foreground">More Members</span>
                  </div>
                  <span className="text-primary">→</span>
                  <div className="flex items-center gap-1.5">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    <span className="text-muted-foreground">Higher Vision Scores</span>
                  </div>
                </div>
              </div>

              {/* CTA Button */}
              <Button
                size="lg"
                className="w-full gap-2 text-lg py-6 shadow-lg shadow-primary/20"
                onClick={() => navigate('/vision-scanner')}
              >
                <Scan className="h-5 w-5" />
                Try Natural Vision Scanner
              </Button>
              
              <p className="text-center text-xs text-muted-foreground">
                Works in-app with camera or image upload. Traditional QR also included on prints.
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
});

NaturalQRShowcase.displayName = 'NaturalQRShowcase';
