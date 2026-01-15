import React, { useState } from 'react';
import { motion } from 'framer-motion';
import carlsenCover from '@/assets/book/carlsen-cover-v2.jpg';
import carlsenBackCover from '@/assets/book/carlsen-back-cover.jpg';
import logoImage from '@/assets/en-pensent-logo-new.png';

export type BookType = 'carlsen' | 'fischer';

interface BookCover3DProps {
  bookType: BookType;
  onClick?: () => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

// Book-specific configurations
const BOOK_COVERS = {
  carlsen: {
    frontCover: carlsenCover,
    backCover: carlsenBackCover,
    spineTitle: 'CARLSEN',
    spineColor: 'linear-gradient(to right, #0f172a 0%, #1e293b 20%, #1e293b 80%, #0f172a 100%)',
    titleColor: 'text-amber-400',
    accentGradient: 'linear-gradient(to bottom, #d4a574, #f5d89a 20%, #c9a45c 50%, #f5d89a 80%, #d4a574)',
    kingSymbol: '♔',
    badgeText: 'Gold Gilded Pages',
    coverAlt: 'Carlsen in Color - Coffee Table Book',
  },
  fischer: {
    frontCover: carlsenCover, // Will be replaced with Fischer cover when available
    backCover: carlsenBackCover, // Will be replaced with Fischer back cover when available
    spineTitle: 'FISCHER',
    spineColor: 'linear-gradient(to right, #1c1a0e 0%, #3d3820 20%, #3d3820 80%, #1c1a0e 100%)',
    titleColor: 'text-amber-300',
    accentGradient: 'linear-gradient(to bottom, #c9a227, #f0d875 20%, #a68b1f 50%, #f0d875 80%, #c9a227)',
    kingSymbol: '♚',
    badgeText: 'Egyptian Gold Pages',
    coverAlt: 'Fischer in Color - Coffee Table Book',
  },
};

export const BookCover3D: React.FC<BookCover3DProps> = ({ 
  bookType = 'carlsen',
  onClick, 
  className = '',
  size = 'lg' 
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const config = BOOK_COVERS[bookType];
  
  const sizeClasses = {
    sm: 'w-24',
    md: 'w-48',
    lg: 'w-80 max-w-full',
  };

  const spineWidth = {
    sm: '10px',
    md: '20px',
    lg: '36px',
  };

  const pageThickness = {
    sm: '8px',
    md: '16px',
    lg: '28px',
  };

  // Egyptian gold color for Fischer
  const pageEdgeGradient = bookType === 'fischer'
    ? 'linear-gradient(to bottom, #f0d875, #c9a227, #a68b1f, #8a7419)'
    : 'linear-gradient(to bottom, #fcd34d, #f59e0b, #d97706, #b45309)';

  const pageEdgeShadow = bookType === 'fischer'
    ? '0 0 12px rgba(201, 162, 39, 0.4)'
    : '0 0 12px rgba(251,191,36,0.4)';

  return (
    <motion.button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative group cursor-pointer ${className}`}
      style={{ perspective: '2000px' }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div 
        className={`relative ${sizeClasses[size]}`}
        style={{ 
          transformStyle: 'preserve-3d',
        }}
        animate={{
          rotateY: isHovered ? 360 : -15,
          rotateX: isHovered ? 0 : 5,
        }}
        transition={{ 
          duration: isHovered ? 2.5 : 0.7, 
          ease: [0.4, 0, 0.2, 1],
        }}
      >
        {/* Book shadow */}
        <motion.div 
          className="absolute inset-0 bg-black/40 blur-2xl rounded-lg"
          style={{
            transform: 'translateZ(-60px) translateY(24px) scale(0.9)',
          }}
          animate={{
            opacity: isHovered ? 0.3 : 0.4,
          }}
          transition={{ duration: 0.7 }}
        />
        
        {/* Page edges (bottom) - GILDED */}
        <div 
          className="absolute bottom-0 left-0 right-0"
          style={{
            height: pageThickness[size],
            transform: `translateZ(-${parseInt(pageThickness[size]) / 2}px) rotateX(-90deg)`,
            transformOrigin: 'bottom center',
            background: pageEdgeGradient,
            boxShadow: `inset 0 2px 8px rgba(0,0,0,0.2), ${pageEdgeShadow}`,
          }}
        >
          <div 
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.4) 0%, transparent 50%, rgba(255,255,255,0.3) 100%)',
            }}
          />
        </div>
        
        {/* Page edges (right side) - GILDED */}
        <div 
          className="absolute top-0 right-0 bottom-0"
          style={{
            width: pageThickness[size],
            transform: `translateX(${pageThickness[size]}) rotateY(90deg)`,
            transformOrigin: 'left center',
            background: pageEdgeGradient,
            boxShadow: `inset -2px 0 6px rgba(0,0,0,0.15), ${pageEdgeShadow}`,
          }}
        >
          <div 
            className="absolute inset-0"
            style={{
              background: `
                linear-gradient(135deg, rgba(255,255,255,0.5) 0%, transparent 40%, rgba(255,255,255,0.3) 100%),
                repeating-linear-gradient(
                  to bottom,
                  transparent,
                  transparent 3px,
                  rgba(180,83,9,0.3) 3px,
                  rgba(180,83,9,0.3) 4px
                )
              `,
            }}
          />
        </div>
        
        {/* Page edges (top) - GILDED */}
        <div 
          className="absolute top-0 left-0 right-0"
          style={{
            height: pageThickness[size],
            transform: `translateZ(-${parseInt(pageThickness[size]) / 2}px) rotateX(90deg)`,
            transformOrigin: 'top center',
            background: pageEdgeGradient,
            boxShadow: `inset 0 -2px 8px rgba(0,0,0,0.2), ${pageEdgeShadow}`,
          }}
        >
          <div 
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(225deg, rgba(255,255,255,0.4) 0%, transparent 50%, rgba(255,255,255,0.3) 100%)',
            }}
          />
        </div>

        {/* Spine - Custom Rendered */}
        <div 
          className="absolute top-0 left-0 bottom-0 overflow-hidden flex flex-col items-center justify-between"
          style={{
            width: spineWidth[size],
            transform: `translateX(-${spineWidth[size]}) rotateY(-90deg)`,
            transformOrigin: 'right center',
            background: config.spineColor,
            boxShadow: 'inset -3px 0 12px rgba(0,0,0,0.4), inset 3px 0 8px rgba(255,255,255,0.05)',
            padding: size === 'sm' ? '4px 2px' : size === 'md' ? '8px 3px' : '12px 4px',
          }}
        >
          {/* Gold gilded edge effect on left side */}
          <div 
            className="absolute left-0 top-0 bottom-0"
            style={{
              width: size === 'sm' ? '1px' : size === 'md' ? '2px' : '3px',
              background: config.accentGradient,
            }}
          />
          {/* Gold gilded edge effect on right side */}
          <div 
            className="absolute right-0 top-0 bottom-0"
            style={{
              width: size === 'sm' ? '1px' : size === 'md' ? '2px' : '3px',
              background: config.accentGradient,
            }}
          />
          
          {/* Title */}
          <div 
            className={`${config.titleColor} font-serif text-center`}
            style={{
              writingMode: 'vertical-rl',
              textOrientation: 'mixed',
              transform: 'rotate(180deg)',
              fontSize: size === 'sm' ? '4px' : size === 'md' ? '7px' : '10px',
              fontWeight: 600,
              letterSpacing: '0.2em',
            }}
          >
            {config.spineTitle}
          </div>
          
          {/* King Chess Piece */}
          <div 
            className={config.titleColor}
            style={{
              fontSize: size === 'sm' ? '6px' : size === 'md' ? '10px' : '14px',
            }}
          >
            {config.kingSymbol}
          </div>
          
          {/* EN PENSENT text */}
          <div 
            className={`${config.titleColor} opacity-80 text-center`}
            style={{
              writingMode: 'vertical-rl',
              textOrientation: 'mixed',
              transform: 'rotate(180deg)',
              fontSize: size === 'sm' ? '2px' : size === 'md' ? '4px' : '6px',
              fontWeight: 'bold',
              letterSpacing: '0.15em',
              fontVariant: 'small-caps',
            }}
          >
            EN PENSENT
          </div>
          
          {/* Gold Seal Logo at Bottom */}
          <img 
            src={logoImage} 
            alt="En Pensent" 
            className="rounded-full object-cover"
            style={{
              width: size === 'sm' ? '6px' : size === 'md' ? '12px' : '20px',
              height: size === 'sm' ? '6px' : size === 'md' ? '12px' : '20px',
              boxShadow: '0 0 4px rgba(212, 165, 116, 0.6)',
            }}
          />
        </div>

        {/* Back cover with actual image */}
        <div 
          className="absolute inset-0 rounded-l-sm overflow-hidden"
          style={{
            transform: `translateZ(-${parseInt(pageThickness[size]) + 2}px) rotateY(180deg)`,
            backfaceVisibility: 'visible',
          }}
        >
          <img 
            src={config.backCover} 
            alt={`${config.spineTitle} in Color - Back Cover`}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-black/10 pointer-events-none" />
        </div>

        {/* Front cover */}
        <div 
          className="relative rounded-r-sm overflow-hidden"
          style={{
            transformStyle: 'preserve-3d',
            boxShadow: '6px 6px 20px rgba(0,0,0,0.35), -1px -1px 3px rgba(255,255,255,0.1)',
            backfaceVisibility: 'visible',
          }}
        >
          <img 
            src={config.frontCover} 
            alt={config.coverAlt}
            className="w-full h-auto block"
          />
          
          {/* Hardcover gloss overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/8 via-transparent to-black/15 pointer-events-none" />
          
          {/* Subtle foil shimmer */}
          <motion.div 
            className="absolute inset-0 bg-gradient-to-tr from-transparent via-amber-300/15 to-transparent pointer-events-none"
            animate={{ opacity: isHovered ? 0 : 0.5 }}
            transition={{ duration: 0.5 }}
          />
          
          {/* Cover binding edge */}
          <div className="absolute top-0 left-0 bottom-0 w-[2px] bg-gradient-to-b from-white/30 via-white/15 to-white/30" />
        </div>

        {/* Hover instruction */}
        <motion.div 
          className="absolute -bottom-10 left-0 right-0 flex justify-center pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: isHovered ? 0 : 1 }}
          transition={{ delay: 0.5, duration: 0.3 }}
        >
          <span className="text-xs text-muted-foreground/60 flex items-center gap-1.5 bg-background/80 backdrop-blur-sm px-3 py-1.5 rounded-full">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Hover for 360° view
          </span>
        </motion.div>
        
        {/* Gilded badge - shows during rotation */}
        <motion.div 
          className="absolute -bottom-10 left-0 right-0 flex justify-center pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: isHovered ? 1 : 0 }}
          transition={{ delay: 0.3, duration: 0.3 }}
        >
          <span className={`text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-full shadow-sm ${
            bookType === 'fischer' 
              ? 'text-amber-700 bg-gradient-to-r from-amber-50 to-yellow-100 border border-amber-400'
              : 'text-amber-600 bg-gradient-to-r from-amber-100 to-orange-100 border border-amber-300'
          }`}>
            <span className="text-amber-500">✦</span>
            {config.badgeText}
            <span className="text-amber-500">✦</span>
          </span>
        </motion.div>
      </motion.div>
    </motion.button>
  );
};

export default BookCover3D;
