import { motion } from 'framer-motion';
import { Paintbrush, Crown, Sparkles, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useScrollAnimation, scrollAnimationClasses } from '@/hooks/useScrollAnimation';

// Example creative designs to showcase
const SHOWCASE_DESIGNS = [
  {
    id: 'endgame-study',
    title: 'The Endgame Study',
    description: 'King & Rook vs King',
    board: [
      [null, null, null, null, 'k', null, null, null],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, 'R', null, null, null],
      [null, null, null, null, 'K', null, null, null],
    ],
    whitePalette: { k: '#3B82F6', q: '#EC4899', r: '#14B8A6', b: '#A855F7', n: '#F97316', p: '#64748B' },
    blackPalette: { k: '#DC2626', q: '#7C3AED', r: '#EA580C', b: '#F59E0B', n: '#7F1D1D', p: '#57534E' },
  },
  {
    id: 'pawn-storm',
    title: 'Pawn Storm',
    description: 'Aggressive pawn structure',
    board: [
      [null, null, null, null, 'k', null, null, null],
      ['p', 'p', 'p', null, null, null, null, null],
      [null, null, null, 'p', null, null, null, null],
      [null, null, null, null, 'p', null, null, null],
      [null, null, null, null, 'P', null, null, null],
      [null, null, null, 'P', null, null, null, null],
      ['P', 'P', 'P', null, null, null, null, null],
      [null, null, null, null, 'K', null, null, null],
    ],
    whitePalette: { k: '#0EA5E9', q: '#8B5CF6', r: '#06B6D4', b: '#D946EF', n: '#F59E0B', p: '#22C55E' },
    blackPalette: { k: '#EF4444', q: '#A855F7', r: '#F97316', b: '#FBBF24', n: '#B91C1C', p: '#65A30D' },
  },
  {
    id: 'knight-pair',
    title: 'Dancing Knights',
    description: 'Powerful knight duo',
    board: [
      [null, null, null, 'k', null, null, null, null],
      [null, null, null, null, null, null, null, null],
      [null, null, 'n', null, null, 'n', null, null],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
      [null, null, 'N', null, null, 'N', null, null],
      [null, null, null, null, null, null, null, null],
      [null, null, null, 'K', null, null, null, null],
    ],
    whitePalette: { k: '#1E40AF', q: '#DB2777', r: '#0D9488', b: '#9333EA', n: '#EA580C', p: '#475569' },
    blackPalette: { k: '#991B1B', q: '#6D28D9', r: '#C2410C', b: '#D97706', n: '#7F1D1D', p: '#44403C' },
  },
  {
    id: 'queen-domination',
    title: 'Queen Domination',
    description: 'Centralized power',
    board: [
      ['r', null, null, null, 'k', null, null, 'r'],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
      [null, null, null, 'Q', null, null, null, null],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
      ['R', null, null, null, 'K', null, null, 'R'],
    ],
    whitePalette: { k: '#2563EB', q: '#F472B6', r: '#2DD4BF', b: '#C084FC', n: '#FB923C', p: '#94A3B8' },
    blackPalette: { k: '#B91C1C', q: '#8B5CF6', r: '#EA580C', b: '#FBBF24', n: '#7F1D1D', p: '#78716C' },
  },
];

const PIECE_SYMBOLS: Record<string, string> = {
  K: '♔', Q: '♕', R: '♖', B: '♗', N: '♘', P: '♙',
  k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟',
};

type PieceType = 'k' | 'q' | 'r' | 'b' | 'n' | 'p';

interface DesignCardProps {
  design: typeof SHOWCASE_DESIGNS[0];
  index: number;
}

const DesignCard = ({ design, index }: DesignCardProps) => {
  const getPieceColor = (piece: string): string => {
    const isWhite = piece === piece.toUpperCase();
    const pieceType = piece.toLowerCase() as PieceType;
    return isWhite 
      ? design.whitePalette[pieceType] 
      : design.blackPalette[pieceType];
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      className="group"
    >
      <div className="p-4 rounded-xl bg-card/80 backdrop-blur-sm border border-border/50 hover:border-primary/40 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5">
        {/* Mini Board */}
        <div className="relative mb-4 rounded-lg overflow-hidden border-2 border-amber-900/50 shadow-inner">
          <div className="grid grid-cols-8 aspect-square">
            {design.board.map((row, rowIdx) =>
              row.map((piece, colIdx) => {
                const isLight = (rowIdx + colIdx) % 2 === 0;
                return (
                  <div
                    key={`${rowIdx}-${colIdx}`}
                    className={`aspect-square flex items-center justify-center ${
                      isLight ? 'bg-amber-100' : 'bg-amber-700'
                    }`}
                  >
                    {piece && (
                      <span
                        className="text-[0.5rem] sm:text-xs md:text-sm select-none"
                        style={{ color: getPieceColor(piece) }}
                      >
                        {PIECE_SYMBOLS[piece]}
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>
          
          {/* Hover overlay */}
          <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/10 transition-colors duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
            <div className="bg-background/90 px-3 py-1.5 rounded-full text-xs font-display uppercase tracking-wider">
              Try It
            </div>
          </div>
        </div>
        
        {/* Info */}
        <h4 className="font-display font-bold text-sm uppercase tracking-wide text-center group-hover:text-primary transition-colors">
          {design.title}
        </h4>
        <p className="text-xs text-muted-foreground text-center font-serif mt-1">
          {design.description}
        </p>
      </div>
    </motion.div>
  );
};

const CreativeModeShowcase = () => {
  const [titleRef, titleVisible] = useScrollAnimation<HTMLDivElement>();

  return (
    <section className="py-16 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent pointer-events-none" />
      
      <div className="container mx-auto px-4 relative">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div 
            ref={titleRef}
            className={`text-center space-y-4 mb-12 transition-all duration-700 ease-out ${
              titleVisible 
                ? scrollAnimationClasses.fadeUp.visible 
                : scrollAnimationClasses.fadeUp.hidden
            }`}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-display uppercase tracking-widest">
              <Paintbrush className="h-3.5 w-3.5" />
              New Feature
            </div>
            
            <h3 className="text-2xl md:text-3xl font-royal font-bold uppercase tracking-wide">
              Creative <span className="text-gold-gradient">Mode</span>
            </h3>
            
            <p className="text-muted-foreground font-serif max-w-xl mx-auto">
              Design custom chess positions and color schemes. Place any piece anywhere 
              and create unique artwork that's truly yours.
            </p>
          </div>

          {/* Showcase Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-10">
            {SHOWCASE_DESIGNS.map((design, index) => (
              <Link key={design.id} to="/creative-mode">
                <DesignCard design={design} index={index} />
              </Link>
            ))}
          </div>

          {/* CTA */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="text-center"
          >
            <Link to="/creative-mode">
              <Button size="lg" className="gap-2 group">
                <Paintbrush className="h-4 w-4" />
                Enter Creative Mode
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            
            <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Crown className="h-3.5 w-3.5 text-primary" />
              <span className="font-serif">Premium feature — Try it free for preview</span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default CreativeModeShowcase;
