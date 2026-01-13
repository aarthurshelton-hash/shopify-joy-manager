import { motion } from 'framer-motion';
import { Paintbrush, Crown, Sparkles, ArrowRight, Palette } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useScrollAnimation, scrollAnimationClasses } from '@/hooks/useScrollAnimation';

// Import palette preview images as board examples
import cosmicPalette from '@/assets/palettes/cosmic.jpg';
import medievalPalette from '@/assets/palettes/medieval.jpg';
import japanesePalette from '@/assets/palettes/japanese.jpg';
import artdecoPalette from '@/assets/palettes/artdeco.jpg';
import egyptianPalette from '@/assets/palettes/egyptian.jpg';
import cyberpunkPalette from '@/assets/palettes/cyberpunk.jpg';

// Import AI art for background accents
import chessKingArt from '@/assets/chess-king-art.jpg';
import chessMovementArt from '@/assets/chess-movement-art.jpg';

// Showcase designs with real palette images
const SHOWCASE_DESIGNS = [
  {
    id: 'cosmic-masterpiece',
    title: 'Cosmic Dreams',
    description: 'Deep space aesthetics',
    image: cosmicPalette,
    accentColor: 'from-purple-500/20 to-blue-500/20',
  },
  {
    id: 'medieval-kingdom',
    title: 'Medieval Kingdom',
    description: 'Royal court elegance',
    image: medievalPalette,
    accentColor: 'from-amber-500/20 to-stone-500/20',
  },
  {
    id: 'japanese-zen',
    title: 'Japanese Zen',
    description: 'Tranquil minimalism',
    image: japanesePalette,
    accentColor: 'from-red-500/20 to-rose-500/20',
  },
  {
    id: 'art-deco-glory',
    title: 'Art Deco Glory',
    description: 'Gatsby-era opulence',
    image: artdecoPalette,
    accentColor: 'from-yellow-500/20 to-amber-500/20',
  },
];

interface DesignCardProps {
  design: typeof SHOWCASE_DESIGNS[0];
  index: number;
}

const DesignCard = ({ design, index }: DesignCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      className="group"
    >
      <div className="relative p-3 rounded-xl bg-card/80 backdrop-blur-sm border border-border/50 hover:border-primary/50 transition-all duration-500 hover:shadow-xl hover:shadow-primary/10 overflow-hidden">
        {/* Gradient accent overlay */}
        <div className={`absolute inset-0 bg-gradient-to-br ${design.accentColor} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
        
        {/* Image Board Preview */}
        <div className="relative mb-3 rounded-lg overflow-hidden border-2 border-amber-900/30 group-hover:border-primary/40 shadow-lg transition-all duration-300">
          <div className="aspect-square relative">
            <img 
              src={design.image} 
              alt={design.title}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
            {/* Premium shimmer overlay */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          </div>
          
          {/* Hover overlay */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
            <div className="bg-background/95 backdrop-blur-sm px-4 py-2 rounded-full text-xs font-display uppercase tracking-wider flex items-center gap-2 shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
              <Palette className="h-3 w-3 text-primary" />
              Create This
            </div>
          </div>
        </div>
        
        {/* Info */}
        <div className="relative z-10">
          <h4 className="font-display font-bold text-sm uppercase tracking-wide text-center group-hover:text-primary transition-colors">
            {design.title}
          </h4>
          <p className="text-xs text-muted-foreground text-center font-serif mt-1">
            {design.description}
          </p>
        </div>
      </div>
    </motion.div>
  );
};

const CreativeModeShowcase = () => {
  const [titleRef, titleVisible] = useScrollAnimation<HTMLDivElement>();

  return (
    <section className="py-20 relative overflow-hidden">
      {/* Background Art Layer - Left */}
      <div className="absolute -left-20 top-1/4 w-80 h-80 opacity-10 blur-sm pointer-events-none">
        <img 
          src={chessKingArt} 
          alt="" 
          className="w-full h-full object-cover rounded-full"
        />
      </div>
      
      {/* Background Art Layer - Right */}
      <div className="absolute -right-20 bottom-1/4 w-72 h-72 opacity-10 blur-sm pointer-events-none">
        <img 
          src={chessMovementArt} 
          alt="" 
          className="w-full h-full object-cover rounded-full"
        />
      </div>
      
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent pointer-events-none" />
      
      {/* Decorative elements */}
      <div className="absolute top-10 left-1/4 w-2 h-2 bg-primary/30 rounded-full animate-pulse" />
      <div className="absolute bottom-20 right-1/3 w-3 h-3 bg-gold/30 rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
      <div className="absolute top-1/3 right-1/4 w-1.5 h-1.5 bg-primary/40 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />
      
      <div className="container mx-auto px-4 relative">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div 
            ref={titleRef}
            className={`text-center space-y-4 mb-14 transition-all duration-700 ease-out ${
              titleVisible 
                ? scrollAnimationClasses.fadeUp.visible 
                : scrollAnimationClasses.fadeUp.hidden
            }`}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 border border-primary/30 text-primary text-xs font-display uppercase tracking-widest shadow-lg shadow-primary/10"
            >
              <Paintbrush className="h-3.5 w-3.5" />
              New Feature
              <Sparkles className="h-3 w-3" />
            </motion.div>
            
            <h3 className="text-3xl md:text-4xl font-royal font-bold uppercase tracking-wide">
              Creative <span className="text-gold-gradient">Mode</span>
            </h3>
            
            <p className="text-muted-foreground font-serif max-w-2xl mx-auto text-base leading-relaxed">
              Design custom chess positions and color schemes. Place any piece anywhere 
              and create unique artwork that's truly yours — powered by your imagination.
            </p>
          </div>

          {/* Showcase Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-12">
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
              <Button size="lg" className="gap-2 group px-8 py-6 text-base shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300">
                <Paintbrush className="h-5 w-5" />
                Enter Creative Mode
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            
            <div className="mt-5 flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Crown className="h-4 w-4 text-primary" />
              <span className="font-serif">Premium feature — Try it free for preview</span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default CreativeModeShowcase;
