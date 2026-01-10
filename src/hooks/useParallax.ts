import { useState, useEffect, useCallback, useRef, RefObject } from 'react';

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
  const rafRef = useRef<number | null>(null);
  const lastOffsetRef = useRef(0);

  const handleScroll = useCallback(() => {
    // Cancel any pending frame
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }
    
    rafRef.current = requestAnimationFrame(() => {
      if (!ref.current) return;
      
      const rect = ref.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      
      // Calculate how far the element is from the center of the viewport
      const elementCenter = rect.top + rect.height / 2;
      const viewportCenter = windowHeight / 2;
      const distanceFromCenter = elementCenter - viewportCenter;
      
      // Apply parallax based on distance from center
      const parallaxOffset = Math.round(distanceFromCenter * speed * (direction === 'up' ? 1 : -1));
      
      // Only update state if offset changed significantly (reduces re-renders)
      if (Math.abs(parallaxOffset - lastOffsetRef.current) > 0.5) {
        lastOffsetRef.current = parallaxOffset;
        setOffset(parallaxOffset);
      }
    });
  }, [ref, speed, direction]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial calculation
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [handleScroll]);

  return offset;
}

// Simpler hook that just tracks scroll position with throttling
export function useScrollY() {
  const [scrollY, setScrollY] = useState(0);
  const rafRef = useRef<number | null>(null);
  const lastScrollRef = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      
      rafRef.current = requestAnimationFrame(() => {
        const currentScroll = window.scrollY;
        // Only update if scroll changed by at least 1px
        if (Math.abs(currentScroll - lastScrollRef.current) >= 1) {
          lastScrollRef.current = currentScroll;
          setScrollY(currentScroll);
        }
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  return scrollY;
}
