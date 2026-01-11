import { useEffect, useRef, useState } from 'react';
import { Header } from '@/components/shop/Header';
import { Footer } from '@/components/shop/Footer';
import { motion } from 'framer-motion';
import { Scan, Smartphone, ExternalLink, Crown, Sparkles } from 'lucide-react';
import { ArtisticQRCode } from '@/components/qr/ArtisticQRCode';

// Sample visualization pattern (simulating a chess game visualization)
const SampleVisualization = ({ showQR = false }: { showQR?: boolean }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = 400;
    canvas.width = size;
    canvas.height = size;

    // Draw dark background
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, size, size);

    // Draw chess board grid (subtle)
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.1)';
    ctx.lineWidth = 0.5;
    const squareSize = size / 8;
    
    for (let i = 0; i <= 8; i++) {
      ctx.beginPath();
      ctx.moveTo(i * squareSize, 0);
      ctx.lineTo(i * squareSize, size);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(0, i * squareSize);
      ctx.lineTo(size, i * squareSize);
      ctx.stroke();
    }

    // Simulate piece movement trails (abstract art pattern)
    const colors = [
      '#1E3A5F', // Navy - White King
      '#3B82F6', // Blue - White Queen
      '#22C55E', // Green - White Bishop
      '#EC4899', // Pink - White Knight
      '#F97316', // Orange - White Rook
      '#EAB308', // Yellow - White Pawn
      '#7F1D1D', // Maroon - Black Knight
      '#5B21B6', // Purple - Black Queen
      '#DC2626', // Red - Black King
      '#14B8A6', // Teal - Black Bishop
    ];

    // Draw movement lines
    const movements = [
      { from: [0, 6], to: [0, 4], color: colors[5] },
      { from: [4, 7], to: [4, 4], color: colors[0] },
      { from: [1, 0], to: [2, 2], color: colors[6] },
      { from: [3, 0], to: [7, 4], color: colors[7] },
      { from: [6, 7], to: [5, 5], color: colors[3] },
      { from: [5, 0], to: [2, 3], color: colors[9] },
      { from: [4, 0], to: [4, 1], color: colors[8] },
      { from: [2, 7], to: [5, 4], color: colors[2] },
      { from: [3, 7], to: [5, 5], color: colors[1] },
      { from: [0, 0], to: [0, 3], color: colors[4] },
    ];

    movements.forEach(({ from, to, color }) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.globalAlpha = 0.8;
      
      ctx.beginPath();
      ctx.moveTo(from[0] * squareSize + squareSize / 2, from[1] * squareSize + squareSize / 2);
      ctx.lineTo(to[0] * squareSize + squareSize / 2, to[1] * squareSize + squareSize / 2);
      ctx.stroke();

      // Draw end dot
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(to[0] * squareSize + squareSize / 2, to[1] * squareSize + squareSize / 2, 6, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.globalAlpha = 1;

  }, []);

  return (
    <div className="relative inline-block">
      <canvas 
        ref={canvasRef} 
        className="rounded-lg shadow-2xl shadow-primary/20 border border-border/30"
        style={{ width: '400px', height: '400px' }}
      />
      
      {/* Artistic QR Code Overlay - Now smaller and more subtle */}
      {showQR && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="absolute bottom-3 right-3"
        >
          <ArtisticQRCode 
            url="https://enpensent.com/v/Kx7mP2" 
            size="small"
            showLabel={true}
          />
        </motion.div>
      )}
    </div>
  );
};

const QRMockup = () => {
  const [showQR, setShowQR] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto space-y-12">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-4"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
              <Crown className="h-4 w-4 text-primary" />
              <span className="text-xs font-display uppercase tracking-widest text-primary">
                Premium Feature Preview
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-royal font-bold uppercase tracking-wide">
              Scannable <span className="text-gold-gradient">Living Art</span>
            </h1>
            <p className="text-muted-foreground font-serif max-w-xl mx-auto">
              Every premium print becomes a portal to its digital twin. 
              Scan with any camera to unlock the interactive experience.
            </p>
          </motion.div>

          {/* Mockup Display */}
          <div className="flex flex-col lg:flex-row items-center gap-12">
            {/* Visualization */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="flex-1"
            >
              <div className="relative">
                <SampleVisualization showQR={showQR} />
                
                {/* Toggle hint */}
                {!showQR && (
                  <motion.button
                    onClick={() => setShowQR(true)}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 }}
                    className="absolute bottom-4 right-4 px-4 py-2 rounded-lg bg-primary/20 border border-primary/30 text-primary text-xs font-display uppercase tracking-wider hover:bg-primary/30 transition-colors flex items-center gap-2"
                  >
                    <Sparkles className="h-3 w-3" />
                    Show QR Code
                  </motion.button>
                )}
              </div>
            </motion.div>

            {/* Info Panel */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="flex-1 space-y-6"
            >
              <div className="space-y-4">
                <h2 className="text-xl font-display font-bold uppercase tracking-wider">
                  How It Works
                </h2>
                
                <div className="space-y-4">
                  <div className="flex items-start gap-4 p-4 rounded-lg bg-card/50 border border-border/30">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Smartphone className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-display text-sm font-bold">Point & Scan</h3>
                      <p className="text-xs text-muted-foreground font-serif">
                        Open any camera app and point at the QR code on your physical print
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-4 rounded-lg bg-card/50 border border-border/30">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Scan className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-display text-sm font-bold">Instant Recognition</h3>
                      <p className="text-xs text-muted-foreground font-serif">
                        The gold-tinted QR code is designed to blend with the artwork while remaining scannable
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-4 rounded-lg bg-card/50 border border-border/30">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <ExternalLink className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-display text-sm font-bold">Digital Portal</h3>
                      <p className="text-xs text-muted-foreground font-serif">
                        Opens enpensent.com/v/[unique-id] showing the interactive visualization, game details, and move-by-move replay
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Premium Badge */}
              <div className="p-4 rounded-lg border border-primary/30 bg-primary/5 space-y-2">
                <div className="flex items-center gap-2">
                  <Crown className="h-4 w-4 text-primary" />
                  <span className="font-display text-sm uppercase tracking-wider text-primary">
                    Visionary Exclusive
                  </span>
                </div>
                <p className="text-xs text-muted-foreground font-serif">
                  This feature is only available on prints purchased by Premium Visionary members. 
                  Each QR is unique to that specific visualization and owner.
                </p>
              </div>
            </motion.div>
          </div>

          {/* QR Placement Options */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="space-y-6"
          >
            <h2 className="text-xl font-display font-bold uppercase tracking-wider text-center">
              Placement Options
            </h2>
            
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { 
                  position: 'Bottom Right', 
                  description: 'Subtle corner placement, minimal visual impact',
                  recommended: true 
                },
                { 
                  position: 'Bottom Left', 
                  description: 'Alternative corner for left-handed scanners',
                  recommended: false 
                },
                { 
                  position: 'Integrated Border', 
                  description: 'QR woven into the frame border design',
                  recommended: false 
                },
              ].map((option, index) => (
                <div 
                  key={option.position}
                  className={`p-4 rounded-lg border ${
                    option.recommended 
                      ? 'border-primary/50 bg-primary/5' 
                      : 'border-border/30 bg-card/30'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-display text-sm font-bold">{option.position}</h3>
                    {option.recommended && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary text-primary-foreground font-display uppercase">
                        Recommended
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground font-serif">
                    {option.description}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Technical Specs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="p-6 rounded-lg border border-border/30 bg-card/30 space-y-4"
          >
            <h3 className="font-display text-sm font-bold uppercase tracking-wider text-center">
              Technical Specifications
            </h3>
            <div className="grid md:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-2xl font-display text-primary">48×48</p>
                <p className="text-xs text-muted-foreground">Pixel Size (Subtle)</p>
              </div>
              <div>
                <p className="text-2xl font-display text-primary">H-Level</p>
                <p className="text-xs text-muted-foreground">30% Error Tolerance</p>
              </div>
              <div>
                <p className="text-2xl font-display text-primary">Gold</p>
                <p className="text-xs text-muted-foreground">#D4AF37</p>
              </div>
              <div>
                <p className="text-2xl font-display text-primary">∞</p>
                <p className="text-xs text-muted-foreground">Permanent Link</p>
              </div>
            </div>
          </motion.div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default QRMockup;
