import React from 'react';
import { Sparkles, Crown, Trophy } from 'lucide-react';
import enPensentLogo from '@/assets/en-pensent-logo-new.png';
import { colorPalettes, PaletteId } from '@/lib/chess/pieceColors';
import { famousGames } from '@/lib/chess/famousGames';

// Import palette background images
import hotcoldBg from '@/assets/palettes/hotcold.jpg';
import medievalBg from '@/assets/palettes/medieval.jpg';
import egyptianBg from '@/assets/palettes/egyptian.jpg';
import romanBg from '@/assets/palettes/roman.jpg';
import modernBg from '@/assets/palettes/modern.jpg';
import greyscaleBg from '@/assets/palettes/greyscale.jpg';
import japaneseBg from '@/assets/palettes/japanese.jpg';
import nordicBg from '@/assets/palettes/nordic.jpg';
import artdecoBg from '@/assets/palettes/artdeco.jpg';
import tropicalBg from '@/assets/palettes/tropical.jpg';
import cyberpunkBg from '@/assets/palettes/cyberpunk.jpg';
import autumnBg from '@/assets/palettes/autumn.jpg';
import oceanBg from '@/assets/palettes/ocean.jpg';
import desertBg from '@/assets/palettes/desert.jpg';
import cosmicBg from '@/assets/palettes/cosmic.jpg';
import vintageBg from '@/assets/palettes/vintage.jpg';

// Map palette IDs to background images
const paletteBackgrounds: Record<string, string> = {
  hotCold: hotcoldBg,
  medieval: medievalBg,
  egyptian: egyptianBg,
  roman: romanBg,
  modern: modernBg,
  greyscale: greyscaleBg,
  japanese: japaneseBg,
  nordic: nordicBg,
  artdeco: artdecoBg,
  tropical: tropicalBg,
  cyberpunk: cyberpunkBg,
  autumn: autumnBg,
  ocean: oceanBg,
  desert: desertBg,
  cosmic: cosmicBg,
  vintage: vintageBg,
};

interface IntrinsicPaletteCardProps {
  paletteId?: PaletteId;
  similarity?: number;
  compact?: boolean;
  // Game card info
  gameCardId?: string;
  gameCardTitle?: string;
}

const IntrinsicPaletteCard: React.FC<IntrinsicPaletteCardProps> = ({ 
  paletteId, 
  similarity,
  compact = false,
  gameCardId,
  gameCardTitle,
}) => {
  const palette = paletteId ? colorPalettes.find(p => p.id === paletteId) : null;
  const gameCard = gameCardId ? famousGames.find(g => g.id === gameCardId) : null;
  
  // If neither palette nor game card, return null
  if (!palette && !gameCard) return null;
  if (paletteId === 'custom' && !gameCard) return null;
  
  const bgImage = paletteId ? paletteBackgrounds[paletteId] : undefined;
  const pieces = ['k', 'q', 'r', 'b', 'n', 'p'] as const;
  
  if (compact) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-primary/10 via-amber-500/10 to-primary/10 border border-primary/30">
        {/* Logo */}
        <img
          src={enPensentLogo}
          alt="En Pensent"
          className="w-6 h-6 rounded-full object-cover ring-2 ring-primary/50"
        />
        
        {/* Badge text */}
        <div className="flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs font-semibold text-primary font-display tracking-wide">
            INTRINSIC
          </span>
        </div>
        
        {/* Palette name or game title */}
        <span className="text-xs text-muted-foreground font-serif">
          {palette?.name || gameCardTitle || 'En Pensent'}
        </span>
      </div>
    );
  }
  
  return (
    <div className="relative overflow-hidden rounded-xl border-2 border-primary/40 glow-gold">
      {/* Background image */}
      {bgImage && (
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-20 pointer-events-none"
          style={{ backgroundImage: `url(${bgImage})` }}
        />
      )}
      
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-transparent to-amber-500/10 pointer-events-none" />
      
      {/* Content */}
      <div className="relative z-10 p-4">
        {/* Header with logo and badge */}
        <div className="flex items-center gap-3 mb-3">
          {/* Logo with shimmer */}
          <div className="relative">
            <img
              src={enPensentLogo}
              alt="En Pensent"
              className="w-12 h-12 rounded-full object-cover ring-2 ring-primary/60"
            />
            <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
              <Crown className="h-3 w-3 text-primary-foreground" />
            </div>
          </div>
          
          {/* Badge text */}
          <div>
            <div className="flex items-center gap-1.5 mb-0.5">
              <Sparkles className="h-4 w-4 text-primary animate-pulse" />
              <span 
                className="text-xs font-bold tracking-[0.2em] uppercase"
                style={{
                  background: 'linear-gradient(135deg, hsl(var(--primary)), #F59E0B)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                EN PENSENT
              </span>
            </div>
            <p 
              className="text-sm font-semibold"
              style={{
                background: 'linear-gradient(135deg, hsl(var(--primary)), #D4AF37)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              {gameCard ? 'Intrinsically Valued Game' : 'Intrinsically Valued Palette'}
            </p>
          </div>
        </div>
        
        {/* Game card info if present */}
        {gameCard && (
          <div className="flex items-center gap-3 p-3 mb-2 rounded-lg bg-amber-500/10 backdrop-blur-sm border border-amber-500/30">
            <Trophy className="h-8 w-8 text-amber-500 shrink-0" />
            <div className="flex-1 min-w-0">
              <h4 className="font-display font-semibold text-sm text-amber-600">
                {gameCard.title}
              </h4>
              <p className="text-xs text-muted-foreground font-serif">
                {gameCard.white} vs {gameCard.black} • {gameCard.year}
              </p>
            </div>
          </div>
        )}
        
        {/* Palette card info if present */}
        {palette && paletteId !== 'custom' && (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-card/80 backdrop-blur-sm border border-border/50">
            {/* Color swatches */}
            <div className="flex flex-col gap-1">
              <div className="flex gap-0.5">
                {pieces.map((piece) => (
                  <div
                    key={`w-${piece}`}
                    className="w-4 h-4 rounded-sm ring-1 ring-black/20"
                    style={{ backgroundColor: palette.white[piece] }}
                  />
                ))}
              </div>
              <div className="flex gap-0.5">
                {pieces.map((piece) => (
                  <div
                    key={`b-${piece}`}
                    className="w-4 h-4 rounded-sm ring-1 ring-black/20"
                    style={{ backgroundColor: palette.black[piece] }}
                  />
                ))}
              </div>
            </div>
            
            {/* Palette name and description */}
            <div className="flex-1 min-w-0">
              <h4 className="font-display font-semibold text-sm flex items-center gap-1.5">
                <span>{palette.legendTheme.whiteEmoji}</span>
                {palette.name}
                <span>{palette.legendTheme.blackEmoji}</span>
              </h4>
              <p className="text-xs text-muted-foreground font-serif truncate">
                {palette.description}
              </p>
            </div>
          </div>
        )}
        
        {/* Similarity indicator if provided */}
        {similarity && (
          <div className="mt-2 text-center">
            <span className="text-xs text-muted-foreground font-serif">
              {Math.round(similarity)}% match to featured palette
            </span>
          </div>
        )}
        
        {/* Footer message */}
        <p className="mt-3 text-[10px] text-center text-muted-foreground font-serif italic">
          {gameCard && palette 
            ? 'This vision uses an officially curated En Pensent game and palette'
            : gameCard 
              ? 'This vision recreates an officially curated En Pensent legendary game'
              : 'This vision uses an officially curated En Pensent palette'
          }
        </p>
      </div>
    </div>
  );
};

export default IntrinsicPaletteCard;
