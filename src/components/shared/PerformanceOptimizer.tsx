/**
 * Performance Optimizer Components
 * 
 * Components that adapt rendering based on device capabilities.
 */

import React, { useState, useEffect, useRef, memo } from 'react';
import { useDeviceProfile, usePerformanceHints } from '@/hooks/useDeviceProfile';
import { cn } from '@/lib/utils';

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  /** Low-quality placeholder */
  placeholder?: string;
  /** Load priority */
  priority?: 'high' | 'low';
}

/**
 * Lazy loading image with device-adaptive quality
 */
export const LazyImage = memo(function LazyImage({
  src,
  alt,
  placeholder,
  priority = 'low',
  className,
  ...props
}: LazyImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [inView, setInView] = useState(priority === 'high');
  const imgRef = useRef<HTMLImageElement>(null);
  const { optimalImageQuality } = useDeviceProfile();
  
  useEffect(() => {
    if (priority === 'high') {
      setInView(true);
      return;
    }
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '100px' }
    );
    
    if (imgRef.current) {
      observer.observe(imgRef.current);
    }
    
    return () => observer.disconnect();
  }, [priority]);
  
  return (
    <div className={cn('relative overflow-hidden', className)} ref={imgRef}>
      {/* Placeholder */}
      {!loaded && placeholder && (
        <img
          src={placeholder}
          alt=""
          className="absolute inset-0 w-full h-full object-cover blur-sm scale-105"
          aria-hidden="true"
        />
      )}
      
      {/* Actual image */}
      {inView && (
        <img
          src={src}
          alt={alt}
          className={cn(
            'w-full h-full object-cover transition-opacity duration-300',
            loaded ? 'opacity-100' : 'opacity-0'
          )}
          onLoad={() => setLoaded(true)}
          loading={priority === 'high' ? 'eager' : 'lazy'}
          decoding="async"
          {...props}
        />
      )}
    </div>
  );
});

interface VirtualListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  itemHeight: number;
  overscan?: number;
  className?: string;
}

/**
 * Virtualized list for large datasets
 */
export function VirtualList<T>({
  items,
  renderItem,
  itemHeight,
  overscan = 3,
  className,
}: VirtualListProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);
  const { chunkSize } = useDeviceProfile();
  
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    const handleScroll = () => {
      setScrollTop(container.scrollTop);
    };
    
    const handleResize = () => {
      setContainerHeight(container.clientHeight);
    };
    
    handleResize();
    container.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize);
    
    return () => {
      container.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  const totalHeight = items.length * itemHeight;
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    items.length,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  );
  
  const visibleItems = items.slice(startIndex, endIndex);
  const offsetY = startIndex * itemHeight;
  
  return (
    <div
      ref={containerRef}
      className={cn('overflow-auto', className)}
      style={{ height: '100%' }}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div
          style={{
            position: 'absolute',
            top: offsetY,
            left: 0,
            right: 0,
          }}
        >
          {visibleItems.map((item, i) => (
            <div key={startIndex + i} style={{ height: itemHeight }}>
              {renderItem(item, startIndex + i)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

interface DeferredRenderProps {
  children: React.ReactNode;
  /** Delay in ms before rendering */
  delay?: number;
  /** Fallback while waiting */
  fallback?: React.ReactNode;
}

/**
 * Defer rendering of non-critical content
 */
export function DeferredRender({
  children,
  delay = 0,
  fallback = null,
}: DeferredRenderProps) {
  const [shouldRender, setShouldRender] = useState(delay === 0);
  const { performanceTier } = useDeviceProfile();
  
  useEffect(() => {
    if (delay === 0) return;
    
    // Increase delay for low-end devices
    const adjustedDelay = performanceTier === 'low' ? delay * 2 : delay;
    
    const timeoutId = setTimeout(() => {
      setShouldRender(true);
    }, adjustedDelay);
    
    return () => clearTimeout(timeoutId);
  }, [delay, performanceTier]);
  
  return <>{shouldRender ? children : fallback}</>;
}

/**
 * Render only when in viewport
 */
export function RenderWhenVisible({
  children,
  fallback = null,
  rootMargin = '100px',
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  rootMargin?: string;
}) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin }
    );
    
    if (ref.current) {
      observer.observe(ref.current);
    }
    
    return () => observer.disconnect();
  }, [rootMargin]);
  
  return (
    <div ref={ref}>
      {isVisible ? children : fallback}
    </div>
  );
}

/**
 * Conditionally render based on device type
 */
export function DeviceOnly({
  children,
  devices,
}: {
  children: React.ReactNode;
  devices: ('phone' | 'tablet' | 'desktop')[];
}) {
  const { type } = useDeviceProfile();
  
  if (!devices.includes(type)) {
    return null;
  }
  
  return <>{children}</>;
}
