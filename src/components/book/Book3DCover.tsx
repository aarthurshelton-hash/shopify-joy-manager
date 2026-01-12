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
  const [isFlipped, setIsFlipped] = useState(false);
  
  const sizeClasses = {
    sm: 'w-24',
    md: 'w-48',
    lg: 'w-80 max-w-full',
  };

  // Realistic spine width for a ~200-page coffee table book (100 spreads)
  // Standard art book: ~0.5" spine per 100 pages = roughly 12-15% of cover width
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
      onMouseEnter={() => setIsFlipped(true)}
      onMouseLeave={() => setIsFlipped(false)}
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
          rotateY: isFlipped ? 160 : -15,
          rotateX: 5,
        }}
        transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
      >
        {/* Book shadow */}
        <motion.div 
          className="absolute inset-0 bg-black/40 blur-2xl rounded-lg"
          style={{
            transform: 'translateZ(-60px) translateY(24px) scale(0.9)',
          }}
          animate={{
            translateX: isFlipped ? -15 : 15,
          }}
          transition={{ duration: 0.7 }}
        />
        
        {/* Page edges (bottom) */}
        <div 
          className="absolute bottom-0 left-0 right-0"
          style={{
            height: pageThickness[size],
            transform: `translateZ(-${parseInt(pageThickness[size]) / 2}px) rotateX(-90deg)`,
            transformOrigin: 'bottom center',
            background: 'linear-gradient(to bottom, #fef3c7, #fde68a, #fcd34d)',
            boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.15)',
          }}
        />
        
        {/* Page edges (right side - stacked pages effect) */}
        <div 
          className="absolute top-0 right-0 bottom-0"
          style={{
            width: pageThickness[size],
            transform: `translateX(${pageThickness[size]}) rotateY(90deg)`,
            transformOrigin: 'left center',
            background: 'linear-gradient(to right, #fffbeb, #fef3c7)',
            backgroundImage: `repeating-linear-gradient(
              to bottom,
              transparent,
              transparent 3px,
              rgba(0,0,0,0.04) 3px,
              rgba(0,0,0,0.04) 4px
            )`,
            boxShadow: 'inset -2px 0 6px rgba(0,0,0,0.1)',
          }}
        />

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
            backfaceVisibility: 'hidden',
          }}
        >
          <img 
            src={carlsenBackCover} 
            alt="Carlsen in Color - Back Cover"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Front cover */}
        <div 
          className="relative rounded-r-sm overflow-hidden"
          style={{
            transformStyle: 'preserve-3d',
            boxShadow: '6px 6px 20px rgba(0,0,0,0.35), -1px -1px 3px rgba(255,255,255,0.1)',
            backfaceVisibility: 'hidden',
          }}
        >
          <img 
            src={carlsenCover} 
            alt="Carlsen in Color - Coffee Table Book"
            className="w-full h-auto block"
          />
          
          {/* Hardcover gloss overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/8 via-transparent to-black/15 pointer-events-none" />
          
          {/* Subtle gold foil shimmer on hover */}
          <motion.div 
            className="absolute inset-0 bg-gradient-to-tr from-transparent via-amber-300/15 to-transparent pointer-events-none"
            animate={{ opacity: isFlipped ? 0 : 0.5 }}
            transition={{ duration: 0.5 }}
          />
          
          {/* Cover binding edge */}
          <div className="absolute top-0 left-0 bottom-0 w-[2px] bg-gradient-to-b from-white/30 via-white/15 to-white/30" />
        </div>

        {/* Hover instruction */}
        <motion.div 
          className="absolute -bottom-8 left-0 right-0 flex justify-center pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: isFlipped ? 0 : 1 }}
          transition={{ delay: 0.5, duration: 0.3 }}
        >
          <span className="text-xs text-muted-foreground/60 flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11" />
            </svg>
            Hover to flip
          </span>
        </motion.div>
      </motion.div>
    </motion.button>
  );
};

export default Book3DCover;