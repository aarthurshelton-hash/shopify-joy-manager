import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRandomGameArt } from '@/hooks/useRandomGameArt';

interface RotatingArtBackgroundProps {
  /** Interval in milliseconds between transitions */
  interval?: number;
  /** Opacity of the background (0-1) */
  opacity?: number;
  /** Number of images to cycle through */
  imageCount?: number;
  /** Additional class names */
  className?: string;
}

export const RotatingArtBackground: React.FC<RotatingArtBackgroundProps> = ({
  interval = 8000,
  opacity = 0.12,
  imageCount = 10,
  className = '',
}) => {
  const images = useRandomGameArt(imageCount);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (images.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, interval);

    return () => clearInterval(timer);
  }, [images.length, interval]);

  if (images.length === 0) return null;

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`} style={{ zIndex: 0 }}>
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 1.5, ease: 'easeInOut' }}
          className="absolute inset-0 pointer-events-none"
        >
          <div
            className="absolute inset-0 bg-cover bg-center pointer-events-none"
            style={{
              backgroundImage: `url(${images[currentIndex]})`,
              opacity,
            }}
          />
          {/* Gradient overlay for better text readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/80 to-background pointer-events-none" />
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
