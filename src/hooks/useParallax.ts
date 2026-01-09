import { useState, useEffect, useCallback, RefObject } from 'react';

interface ParallaxOptions {
  speed?: number; // 0.1 = slow, 0.5 = medium, 1 = same as scroll
  direction?: 'up' | 'down';
}

export function useParallax(
  ref: RefObject<HTMLElement>,
  options: ParallaxOptions = {}
) {
  const { speed = 0.3, direction = 'up' } = options;
  const [offset, setOffset] = useState(0);

  const handleScroll = useCallback(() => {
    if (!ref.current) return;
    
    const rect = ref.current.getBoundingClientRect();
    const windowHeight = window.innerHeight;
    
    // Calculate how far the element is from the center of the viewport
    const elementCenter = rect.top + rect.height / 2;
    const viewportCenter = windowHeight / 2;
    const distanceFromCenter = elementCenter - viewportCenter;
    
    // Apply parallax based on distance from center
    const parallaxOffset = distanceFromCenter * speed * (direction === 'up' ? 1 : -1);
    
    setOffset(parallaxOffset);
  }, [ref, speed, direction]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial calculation
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  return offset;
}

// Simpler hook that just tracks scroll position
export function useScrollY() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return scrollY;
}
