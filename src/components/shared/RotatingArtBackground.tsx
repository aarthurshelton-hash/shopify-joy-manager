import React, { useState, useEffect } from 'react';
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
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    if (images.length <= 1) return;

    const timer = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % images.length);
        setIsTransitioning(false);
      }, 500); // Half of transition duration
    }, interval);

    return () => clearInterval(timer);
  }, [images.length, interval]);

  if (images.length === 0) return null;

  return (
    <div 
      className={`absolute inset-0 overflow-hidden pointer-events-none select-none ${className}`} 
      style={{ zIndex: -1, position: 'absolute' }}
      aria-hidden="true"
      data-background-layer="true"
    >
      {/* Background image with CSS transition - explicitly non-interactive */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ease-in-out pointer-events-none"
        style={{
          backgroundImage: `url(${images[currentIndex]})`,
          opacity: isTransitioning ? 0 : opacity,
        }}
        aria-hidden="true"
      />
      {/* Gradient overlay for better text readability - explicitly non-interactive */}
      <div 
        className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/80 to-background pointer-events-none"
        aria-hidden="true"
      />
    </div>
  );
};
