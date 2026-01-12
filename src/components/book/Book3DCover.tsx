import React, { useState } from 'react';
import { motion } from 'framer-motion';
import carlsenCover from '@/assets/book/carlsen-cover-v2.jpg';
import carlsenBackCover from '@/assets/book/carlsen-back-cover.jpg';

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
    sm: 'w-20',
    md: 'w-40',
    lg: 'w-80 max-w-full',
  };

  const spineWidth = {
    sm: '6px',
    md: '12px',
    lg: '24px',
  };

  const pageThickness = {
    sm: '4px',
    md: '8px',
    lg: '16px',
  };

  return (
    <motion.button
      onClick={onClick}
      onMouseEnter={() => setIsFlipped(true)}
      onMouseLeave={() => setIsFlipped(false)}
      className={`relative group cursor-pointer ${className}`}
      style={{ perspective: '1500px' }}
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
          rotateY: isFlipped ? 168 : -12,
          rotateX: 3,
        }}
        transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
      >
        {/* Book shadow */}
        <motion.div 
          className="absolute inset-0 bg-black/30 blur-2xl"
          style={{
            transform: 'translateZ(-50px) translateY(20px) translateX(10px) scale(0.95)',
          }}
          animate={{
            translateX: isFlipped ? -10 : 10,
          }}
          transition={{ duration: 0.8 }}
        />
        
        {/* Page edges (bottom) */}
        <div 
          className="absolute bottom-0 left-0 right-0 bg-gradient-to-b from-amber-100 to-amber-200"
          style={{
            height: pageThickness[size],
            transform: `translateZ(-${parseInt(pageThickness[size]) / 2}px) rotateX(-90deg)`,
            transformOrigin: 'bottom center',
            boxShadow: 'inset 0 -2px 4px rgba(0,0,0,0.1)',
          }}
        />
        
        {/* Page edges (right side - stacked pages effect) */}
        <div 
          className="absolute top-0 right-0 bottom-0 bg-gradient-to-r from-amber-50 to-amber-100"
          style={{
            width: pageThickness[size],
            transform: `translateX(${pageThickness[size]}) rotateY(90deg)`,
            transformOrigin: 'left center',
            backgroundImage: `repeating-linear-gradient(
              to bottom,
              transparent,
              transparent 2px,
              rgba(0,0,0,0.03) 2px,
              rgba(0,0,0,0.03) 3px
            )`,
          }}
        />

        {/* Spine */}
        <div 
          className="absolute top-0 left-0 bottom-0 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900"
          style={{
            width: spineWidth[size],
            transform: `translateX(-${spineWidth[size]}) rotateY(-90deg)`,
            transformOrigin: 'right center',
            boxShadow: 'inset -2px 0 8px rgba(0,0,0,0.3), inset 2px 0 8px rgba(255,255,255,0.1)',
          }}
        >
          {/* Spine text */}
          {size === 'lg' && (
            <div 
              className="absolute inset-0 flex items-center justify-center"
              style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
            >
              <span className="text-amber-400 font-serif font-bold text-xs tracking-wider">
                CARLSEN IN COLOR
              </span>
            </div>
          )}
        </div>

        {/* Back cover with actual image */}
        <div 
          className="absolute inset-0 rounded-l-sm overflow-hidden"
          style={{
            transform: `translateZ(-${parseInt(pageThickness[size]) + 4}px) rotateY(180deg)`,
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
          className="relative rounded-r-sm overflow-hidden shadow-2xl"
          style={{
            transformStyle: 'preserve-3d',
            boxShadow: '4px 4px 12px rgba(0,0,0,0.3), -1px -1px 4px rgba(255,255,255,0.1)',
            backfaceVisibility: 'hidden',
          }}
        >
          <img 
            src={carlsenCover} 
            alt="Carlsen in Color - Coffee Table Book"
            className="w-full h-auto block"
            style={{ 
              display: 'block',
            }}
          />
          
          {/* Hardcover texture overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-black/10 pointer-events-none" />
          
          {/* Embossed gold foil effect on text */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-amber-400/10 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          {/* Cover edge highlight */}
          <div className="absolute top-0 left-0 bottom-0 w-px bg-gradient-to-b from-white/20 via-white/10 to-white/20" />
        </div>

        {/* Hover hint - only show when not flipped */}
        <motion.div 
          className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent rounded-r-sm flex items-end justify-center pb-6 pointer-events-none"
          animate={{ opacity: isFlipped ? 0 : 0 }}
          whileHover={{ opacity: 1 }}
          style={{ backfaceVisibility: 'hidden' }}
        >
          <span className="flex items-center gap-2 bg-white/95 text-slate-900 px-4 py-2 rounded-full text-sm font-medium shadow-lg backdrop-blur-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            Preview Pages
          </span>
        </motion.div>
      </motion.div>
    </motion.button>
  );
};

export default Book3DCover;
