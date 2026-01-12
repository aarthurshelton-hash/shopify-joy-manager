import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Scan, Camera, Fingerprint, Link2, Sparkles, TrendingUp, Users, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { VisionScanner } from "@/components/scanner/VisionScanner";

// Sample visualization patterns for the demo
const samplePatterns = [
  {
    title: "The Immortal Game",
    colors: [
      ["#8B4513", "#FFD700", "#8B4513", "#DC143C", "#FFD700", "#8B4513", "#DC143C", "#FFD700"],
      ["#DC143C", "#8B4513", "#FFD700", "#8B4513", "#DC143C", "#FFD700", "#8B4513", "#DC143C"],
      ["#FFD700", "#DC143C", "#8B4513", "#FFD700", "#8B4513", "#DC143C", "#FFD700", "#8B4513"],
      ["#8B4513", "#FFD700", "#DC143C", "#8B4513", "#FFD700", "#8B4513", "#DC143C", "#FFD700"],
      ["#DC143C", "#8B4513", "#FFD700", "#DC143C", "#8B4513", "#FFD700", "#8B4513", "#DC143C"],
      ["#FFD700", "#DC143C", "#8B4513", "#FFD700", "#DC143C", "#8B4513", "#FFD700", "#8B4513"],
      ["#8B4513", "#FFD700", "#DC143C", "#8B4513", "#FFD700", "#DC143C", "#8B4513", "#FFD700"],
      ["#DC143C", "#8B4513", "#FFD700", "#DC143C", "#8B4513", "#FFD700", "#DC143C", "#8B4513"],
    ],
  },
  {
    title: "Opera Game",
    colors: [
      ["#1E3A5F", "#87CEEB", "#1E3A5F", "#C0C0C0", "#87CEEB", "#1E3A5F", "#C0C0C0", "#87CEEB"],
      ["#C0C0C0", "#1E3A5F", "#87CEEB", "#1E3A5F", "#C0C0C0", "#87CEEB", "#1E3A5F", "#C0C0C0"],
      ["#87CEEB", "#C0C0C0", "#1E3A5F", "#87CEEB", "#1E3A5F", "#C0C0C0", "#87CEEB", "#1E3A5F"],
      ["#1E3A5F", "#87CEEB", "#C0C0C0", "#1E3A5F", "#87CEEB", "#1E3A5F", "#C0C0C0", "#87CEEB"],
      ["#C0C0C0", "#1E3A5F", "#87CEEB", "#C0C0C0", "#1E3A5F", "#87CEEB", "#1E3A5F", "#C0C0C0"],
      ["#87CEEB", "#C0C0C0", "#1E3A5F", "#87CEEB", "#C0C0C0", "#1E3A5F", "#87CEEB", "#1E3A5F"],
      ["#1E3A5F", "#87CEEB", "#C0C0C0", "#1E3A5F", "#87CEEB", "#C0C0C0", "#1E3A5F", "#87CEEB"],
      ["#C0C0C0", "#1E3A5F", "#87CEEB", "#C0C0C0", "#1E3A5F", "#87CEEB", "#C0C0C0", "#1E3A5F"],
    ],
  },
];

export function NaturalQRShowcase() {
  const [scannerOpen, setScannerOpen] = useState(false);
  const [demoStep, setDemoStep] = useState(0);

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

  const pattern = samplePatterns[0];

  return (
    <section className="relative py-16 md:py-24 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-background" />
      
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
              Natural QR Vision™
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
            {/* Left: Interactive Pattern Demo */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="relative aspect-square max-w-sm mx-auto">
                {/* Scanning overlay effect - CSS-only for smooth performance */}
                <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden rounded-xl">
                  <motion.div
                    className="absolute w-full h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent opacity-70"
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

                {/* The visualization grid - static colors, no per-square state updates */}
                <div className="grid grid-cols-8 gap-0.5 p-2 bg-card rounded-xl border border-border shadow-2xl">
                  {pattern.colors.map((row, rowIndex) =>
                    row.map((color, colIndex) => (
                      <div
                        key={`${rowIndex}-${colIndex}`}
                        className="aspect-square rounded-sm"
                        style={{ backgroundColor: color }}
                      />
                    ))
                  )}
                </div>

                {/* Pattern info overlay */}
                <motion.div
                  className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-card/95 backdrop-blur-sm px-4 py-2 rounded-full border border-border shadow-lg"
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <span className="text-sm font-medium text-gold-gradient">{pattern.title}</span>
                </motion.div>

                {/* Fingerprint visualization lines */}
                <div className="absolute -right-8 top-1/2 -translate-y-1/2 flex flex-col gap-1">
                  {[...Array(8)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="h-1 bg-primary/40 rounded-full"
                      initial={{ width: 20 }}
                      animate={{ 
                        width: [20, 40 + Math.random() * 30, 20],
                        opacity: [0.4, 0.8, 0.4]
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
              {/* Process steps */}
              <div className="grid grid-cols-2 gap-4">
                {demoSteps.map((step, index) => {
                  const Icon = step.icon;
                  const isActive = demoStep === index;
                  return (
                    <motion.div
                      key={step.title}
                      className={`p-4 rounded-xl border transition-all duration-300 ${
                        isActive 
                          ? "bg-primary/10 border-primary/30 shadow-lg shadow-primary/10" 
                          : "bg-card/50 border-border/50"
                      }`}
                      animate={{
                        scale: isActive ? 1.02 : 1,
                      }}
                    >
                      <Icon className={`h-6 w-6 mb-2 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                      <h4 className={`font-semibold ${isActive ? "text-foreground" : "text-muted-foreground"}`}>
                        {step.title}
                      </h4>
                      <p className="text-xs text-muted-foreground mt-1">{step.desc}</p>
                    </motion.div>
                  );
                })}
              </div>

              {/* Value proposition */}
              <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl p-6 border border-primary/20">
                <div className="flex items-start gap-4">
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
                
                <div className="mt-4 pt-4 border-t border-primary/20 flex items-center gap-4 text-sm">
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
                className="w-full gap-2 text-lg py-6"
                onClick={() => setScannerOpen(true)}
              >
                <Scan className="h-5 w-5" />
                Try Vision Scanner
              </Button>
              
              <p className="text-center text-xs text-muted-foreground">
                Works in-app with camera or image upload. Traditional QR also included on prints.
              </p>
            </motion.div>
          </div>
        </div>
      </div>

      <VisionScanner isOpen={scannerOpen} onClose={() => setScannerOpen(false)} />
    </section>
  );
}
