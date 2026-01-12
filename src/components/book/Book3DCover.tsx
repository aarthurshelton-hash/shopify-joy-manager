import React, { useState } from 'react';
import { motion } from 'framer-motion';
import carlsenCover from '@/assets/book/carlsen-cover-v2.jpg';
import carlsenBackCover from '@/assets/book/carlsen-back-cover.jpg';
import carlsenSpine from '@/assets/book/carlsen-spine.jpg';

interface Book3DCoverProps {
  onClick?: () => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const Book3DCover: React.FC<Book3DCoverProps> = ({ 
  onClick, 
  className = '',
  size = 'lg' 
}) => {
  const [isHovered, setIsHovered] = useState(false);
  
  const sizeClasses = {
    sm: 'w-24',
    md: 'w-48',
    lg: 'w-80 max-w-full',
  };

  // Realistic spine width for a ~200-page coffee table book (100 spreads)
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
      {/* Container for 3D book */}
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
          ease: isHovered ? [0.4, 0, 0.2, 1] : [0.4, 0, 0.2, 1],
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
        
        {/* Page edges (bottom) - GILDED GOLD */}
        <div 
          className="absolute bottom-0 left-0 right-0"
          style={{
            height: pageThickness[size],
            transform: `translateZ(-${parseInt(pageThickness[size]) / 2}px) rotateX(-90deg)`,
            transformOrigin: 'bottom center',
            background: 'linear-gradient(to bottom, #fcd34d, #f59e0b, #d97706, #b45309)',
            boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.2), 0 0 12px rgba(251,191,36,0.4)',
          }}
        >
          {/* Gold shimmer effect */}
          <div 
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.4) 0%, transparent 50%, rgba(255,255,255,0.3) 100%)',
            }}
          />
        </div>
        
        {/* Page edges (right side) - GILDED GOLD */}
        <div 
          className="absolute top-0 right-0 bottom-0"
          style={{
            width: pageThickness[size],
            transform: `translateX(${pageThickness[size]}) rotateY(90deg)`,
            transformOrigin: 'left center',
            background: 'linear-gradient(to right, #fcd34d, #f59e0b, #d97706)',
            boxShadow: 'inset -2px 0 6px rgba(0,0,0,0.15), 0 0 12px rgba(251,191,36,0.4)',
          }}
        >
          {/* Gold shimmer + page lines effect */}
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
        
        {/* Page edges (top) - GILDED GOLD */}
        <div 
          className="absolute top-0 left-0 right-0"
          style={{
            height: pageThickness[size],
            transform: `translateZ(-${parseInt(pageThickness[size]) / 2}px) rotateX(90deg)`,
            transformOrigin: 'top center',
            background: 'linear-gradient(to top, #fcd34d, #f59e0b, #d97706, #b45309)',
            boxShadow: 'inset 0 -2px 8px rgba(0,0,0,0.2), 0 0 12px rgba(251,191,36,0.4)',
          }}
        >
          {/* Gold shimmer effect */}
          <div 
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(225deg, rgba(255,255,255,0.4) 0%, transparent 50%, rgba(255,255,255,0.3) 100%)',
            }}
          />
        </div>

        {/* Spine with actual image */}
        <div 
          className="absolute top-0 left-0 bottom-0 overflow-hidden"
          style={{
            width: spineWidth[size],
            transform: `translateX(-${spineWidth[size]}) rotateY(-90deg)`,
            transformOrigin: 'right center',
            boxShadow: 'inset -3px 0 12px rgba(0,0,0,0.4), inset 3px 0 8px rgba(255,255,255,0.05)',
          }}
        >
          <img 
            src={carlsenSpine} 
            alt="Book spine"
            className="w-full h-full object-cover"
          />
          {/* Spine wear/highlight */}
          <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-transparent to-black/20 pointer-events-none" />
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
            src={carlsenBackCover} 
            alt="Carlsen in Color - Back Cover"
            className="w-full h-full object-cover"
          />
          {/* Back cover gloss */}
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
            src={carlsenCover} 
            alt="Carlsen in Color - Coffee Table Book"
            className="w-full h-auto block"
          />
          
          {/* Hardcover gloss overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/8 via-transparent to-black/15 pointer-events-none" />
          
          {/* Subtle gold foil shimmer */}
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
        
        {/* Gold gilded badge - shows during rotation */}
        <motion.div 
          className="absolute -bottom-10 left-0 right-0 flex justify-center pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: isHovered ? 1 : 0 }}
          transition={{ delay: 0.3, duration: 0.3 }}
        >
          <span className="text-xs text-amber-600 flex items-center gap-1.5 bg-gradient-to-r from-amber-100 to-orange-100 border border-amber-300 px-3 py-1.5 rounded-full shadow-sm">
            <span className="text-amber-500">✦</span>
            Gold Gilded Pages
            <span className="text-amber-500">✦</span>
          </span>
        </motion.div>
      </motion.div>
    </motion.button>
  );
};

export default Book3DCover;